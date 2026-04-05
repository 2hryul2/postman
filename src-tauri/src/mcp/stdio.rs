use crate::error::AppError;
use crate::models::mcp::{JsonRpcRequest, JsonRpcResponse};
use std::collections::HashMap;
use tokio::io::{AsyncBufReadExt, AsyncWriteExt, BufReader};
use tokio::process::{Child, Command};
use tokio::sync::Mutex;
use tokio::time::{timeout, Duration};

const RECEIVE_TIMEOUT_SECS: u64 = 90;

pub struct StdioTransport {
    child: Mutex<Child>,
    stdin: Mutex<tokio::process::ChildStdin>,
    reader: Mutex<BufReader<tokio::process::ChildStdout>>,
}

impl StdioTransport {
    pub async fn spawn(
        command: &str,
        args: &[String],
        env: &HashMap<String, String>,
    ) -> Result<Self, AppError> {
        let mut cmd;

        #[cfg(target_os = "windows")]
        {
            // On Windows: find the actual executable to bypass .cmd/.bat issues.
            // For "npx", "npm", "node" etc., find node.exe and run via it.
            let (exe, mut final_args) = resolve_windows_command(command, args);
            cmd = Command::new(&exe);
            cmd.args(&final_args);

            // STARTF_USESHOWWINDOW + SW_HIDE via CREATE_NO_WINDOW won't work
            // with cmd.exe, so we avoid cmd.exe entirely.
            // The process runs windowless because we use node.exe directly
            // (not a console app that creates a window).
        }

        #[cfg(not(target_os = "windows"))]
        {
            cmd = Command::new(command);
            cmd.args(args);
        }

        cmd.stdin(std::process::Stdio::piped())
            .stdout(std::process::Stdio::piped())
            .stderr(std::process::Stdio::piped());

        for (k, v) in env {
            cmd.env(k, v);
        }

        // Hide any console window
        #[cfg(target_os = "windows")]
        {
            use std::os::windows::process::CommandExt;
            cmd.creation_flags(0x08000000); // CREATE_NO_WINDOW
        }

        let mut child = cmd.spawn().map_err(|e| {
            AppError::Custom(format!("Failed to spawn MCP server '{}': {}", command, e))
        })?;

        let stdin = child.stdin.take().ok_or(AppError::Custom(
            "Failed to capture stdin".to_string(),
        ))?;
        let stdout = child.stdout.take().ok_or(AppError::Custom(
            "Failed to capture stdout".to_string(),
        ))?;

        // Drain stderr in background
        if let Some(stderr) = child.stderr.take() {
            tokio::spawn(async move {
                let mut reader = BufReader::new(stderr);
                let mut line = String::new();
                loop {
                    line.clear();
                    match reader.read_line(&mut line).await {
                        Ok(0) | Err(_) => break,
                        Ok(_) => {}
                    }
                }
            });
        }

        Ok(Self {
            child: Mutex::new(child),
            stdin: Mutex::new(stdin),
            reader: Mutex::new(BufReader::new(stdout)),
        })
    }

    pub async fn send(&self, request: &JsonRpcRequest) -> Result<(), AppError> {
        let mut line = serde_json::to_string(request)?;
        line.push('\n');
        let mut stdin = self.stdin.lock().await;
        stdin.write_all(line.as_bytes()).await.map_err(|e| {
            AppError::Custom(format!("Failed to write to MCP stdin: {}", e))
        })?;
        stdin.flush().await.map_err(|e| {
            AppError::Custom(format!("Failed to flush MCP stdin: {}", e))
        })?;
        Ok(())
    }

    pub async fn receive(&self) -> Result<JsonRpcResponse, AppError> {
        let mut reader = self.reader.lock().await;
        let mut last_line = String::new();

        let result = timeout(Duration::from_secs(RECEIVE_TIMEOUT_SECS), async {
            loop {
                let mut line = String::new();
                let bytes_read = reader.read_line(&mut line).await.map_err(|e| {
                    AppError::Custom(format!("Failed to read stdout: {}", e))
                })?;
                if bytes_read == 0 {
                    return Err(AppError::Custom(format!(
                        "MCP server closed stdout. Last: {}",
                        last_line
                    )));
                }
                let trimmed = line.trim();
                if trimmed.is_empty() {
                    continue;
                }
                if trimmed.starts_with('{') {
                    match serde_json::from_str::<JsonRpcResponse>(trimmed) {
                        Ok(resp) => return Ok(resp),
                        Err(_) => {
                            last_line = trimmed.to_string();
                            continue;
                        }
                    }
                }
                last_line = trimmed.to_string();
            }
        }).await;

        match result {
            Ok(inner) => inner,
            Err(_) => Err(AppError::Custom(format!(
                "Timeout ({}s) waiting for MCP response. Last: {}",
                RECEIVE_TIMEOUT_SECS, last_line
            ))),
        }
    }

    pub async fn send_and_receive(&self, request: &JsonRpcRequest) -> Result<JsonRpcResponse, AppError> {
        self.send(request).await?;
        let request_id = request.id.clone();

        let result = timeout(Duration::from_secs(RECEIVE_TIMEOUT_SECS), async {
            loop {
                let resp = self.receive().await?;
                if resp.id.is_none() && request_id.is_some() {
                    continue;
                }
                if resp.id == request_id {
                    return Ok(resp);
                }
            }
        }).await;

        match result {
            Ok(inner) => inner,
            Err(_) => Err(AppError::Custom(format!(
                "Timeout ({}s) matching MCP response",
                RECEIVE_TIMEOUT_SECS
            ))),
        }
    }

    pub async fn kill(&self) -> Result<(), AppError> {
        let mut child = self.child.lock().await;
        let _ = child.kill().await;
        Ok(())
    }
}

/// On Windows, resolve "npx" / "npm" / "node" etc. to their actual executable paths,
/// bypassing .cmd batch file wrappers that break pipe I/O.
///
/// Strategy: find node.exe, then for npm/npx, call node.exe with the corresponding
/// CLI script directly.
#[cfg(target_os = "windows")]
fn resolve_windows_command(command: &str, args: &[String]) -> (String, Vec<String>) {
    let cmd_lower = command.to_lowercase();

    // Find node.exe path
    let node_exe = find_in_path("node.exe").unwrap_or_else(|| "node.exe".to_string());

    match cmd_lower.as_str() {
        "npx" | "npx.cmd" => {
            // npx → node.exe <nodejs_dir>/node_modules/npm/bin/npx-cli.js <args>
            if let Some(npx_cli) = find_npx_cli(&node_exe) {
                let mut final_args = vec![npx_cli];
                final_args.extend(args.iter().cloned());
                (node_exe, final_args)
            } else {
                // Fallback: try to find npx-cli.js from well-known node paths
                let fallback_paths = [
                    "C:\\Program Files\\nodejs\\node_modules\\npm\\bin\\npx-cli.js",
                    "C:\\Program Files (x86)\\nodejs\\node_modules\\npm\\bin\\npx-cli.js",
                ];
                if let Some(path) = fallback_paths.iter().find(|p| std::path::Path::new(p).exists()) {
                    let mut final_args = vec![path.to_string()];
                    final_args.extend(args.iter().cloned());
                    (node_exe, final_args)
                } else {
                    // Last resort: use node_exe with npx as module
                    let mut final_args = vec!["-e".to_string(),
                        "require('child_process').execFileSync(process.argv0.replace('node.exe','npx.cmd'),[...process.argv.slice(1)],{stdio:'inherit'})".to_string()];
                    final_args.extend(args.iter().cloned());
                    (node_exe, final_args)
                }
            }
        }
        "npm" | "npm.cmd" => {
            if let Some(npm_cli) = find_npm_cli(&node_exe) {
                let mut final_args = vec![npm_cli];
                final_args.extend(args.iter().cloned());
                (node_exe, final_args)
            } else {
                let fallback = "C:\\Program Files\\nodejs\\node_modules\\npm\\bin\\npm-cli.js";
                if std::path::Path::new(fallback).exists() {
                    let mut final_args = vec![fallback.to_string()];
                    final_args.extend(args.iter().cloned());
                    (node_exe, final_args)
                } else {
                    (command.to_string(), args.to_vec())
                }
            }
        }
        "node" | "node.exe" => {
            (node_exe, args.to_vec())
        }
        "python" | "python.exe" | "python3" | "python3.exe" => {
            let py = find_in_path("python.exe").unwrap_or_else(|| command.to_string());
            (py, args.to_vec())
        }
        _ => {
            // For unknown commands, try to find the .exe directly
            let exe = find_in_path(&format!("{}.exe", command))
                .unwrap_or_else(|| command.to_string());
            (exe, args.to_vec())
        }
    }
}

#[cfg(target_os = "windows")]
fn find_in_path(name: &str) -> Option<String> {
    // Search PATH env var directly (don't rely on `where` command)
    if let Ok(path_var) = std::env::var("PATH") {
        for dir in path_var.split(';') {
            let dir = dir.trim();
            if dir.is_empty() { continue; }
            let candidate = std::path::Path::new(dir).join(name);
            if candidate.exists() {
                return Some(candidate.to_string_lossy().to_string());
            }
        }
    }
    // Also check well-known locations
    let well_known = [
        format!("C:\\Program Files\\nodejs\\{}", name),
        format!("C:\\Program Files (x86)\\nodejs\\{}", name),
    ];
    for path in &well_known {
        if std::path::Path::new(path).exists() {
            return Some(path.clone());
        }
    }
    None
}

#[cfg(target_os = "windows")]
fn find_npx_cli(node_exe: &str) -> Option<String> {
    let node_dir = std::path::Path::new(node_exe).parent()?;
    // Try standard npm installation paths
    let candidates = [
        node_dir.join("node_modules").join("npm").join("bin").join("npx-cli.js"),
        node_dir.join("node_modules").join("npm").join("bin").join("npm-cli.js"),
    ];
    let npx_path = candidates.iter().find(|p| p.exists())?;
    Some(npx_path.to_string_lossy().to_string())
}

#[cfg(target_os = "windows")]
fn find_npm_cli(node_exe: &str) -> Option<String> {
    let node_dir = std::path::Path::new(node_exe).parent()?;
    let cli = node_dir.join("node_modules").join("npm").join("bin").join("npm-cli.js");
    if cli.exists() {
        Some(cli.to_string_lossy().to_string())
    } else {
        None
    }
}
