use crate::error::AppError;
use crate::models::mcp::{JsonRpcRequest, JsonRpcResponse};
use std::collections::{HashMap, VecDeque};
use std::sync::Arc;
use tokio::io::{AsyncBufReadExt, AsyncWriteExt, BufReader};
use tokio::process::{Child, Command};
use tokio::sync::Mutex;
use tokio::time::{timeout, Duration, sleep};

fn log_debug(msg: &str) {
    use std::io::Write;
    let log_path = std::env::var("APPDATA")
        .map(|d| format!("{}\\com.hiveapi.app\\mcp_debug.log", d))
        .unwrap_or_else(|_| "mcp_debug.log".to_string());
    if let Ok(mut f) = std::fs::OpenOptions::new().create(true).append(true).open(&log_path) {
        let now = chrono::Local::now().format("%H:%M:%S%.3f");
        let _ = writeln!(f, "[{}] {}", now, msg);
    }
}

const SEND_RECV_TIMEOUT_SECS: u64 = 10;
const MAX_SKIP_LINES: usize = 500;
const STDERR_BUFFER_SIZE: usize = 50;

pub struct StdioTransport {
    child: Mutex<Child>,
    stdin: Mutex<tokio::process::ChildStdin>,
    reader: Mutex<BufReader<tokio::process::ChildStdout>>,
    stderr_buf: Arc<Mutex<VecDeque<String>>>,
}

impl StdioTransport {
    pub async fn spawn(
        command: &str,
        args: &[String],
        env: &HashMap<String, String>,
    ) -> Result<Self, AppError> {
        let (exe, final_args) = resolve_program(command, args)?;
        log_debug(&format!("SPAWN: exe='{}' args={:?}", exe, final_args));

        let mut cmd = Command::new(&exe);
        cmd.args(&final_args)
            .stdin(std::process::Stdio::piped())
            .stdout(std::process::Stdio::piped())
            .stderr(std::process::Stdio::piped());

        for (k, v) in env {
            cmd.env(k, v);
        }

        // No creation flags — let the console window appear for debugging.
        // TODO: hide window once stdio communication is confirmed working.

        let mut child = cmd.spawn().map_err(|e| {
            AppError::Custom(format!(
                "Failed to spawn '{}' (resolved to '{}'): {}",
                command, exe, e
            ))
        })?;

        let stdin = child.stdin.take()
            .ok_or(AppError::Custom("Failed to capture stdin".into()))?;
        let stdout = child.stdout.take()
            .ok_or(AppError::Custom("Failed to capture stdout".into()))?;

        // Capture stderr in a ring buffer for diagnostics
        let stderr_buf = Arc::new(Mutex::new(VecDeque::with_capacity(STDERR_BUFFER_SIZE)));
        if let Some(stderr) = child.stderr.take() {
            let buf = stderr_buf.clone();
            tokio::spawn(async move {
                let mut reader = BufReader::new(stderr);
                let mut line = String::new();
                loop {
                    line.clear();
                    match reader.read_line(&mut line).await {
                        Ok(0) | Err(_) => break,
                        Ok(_) => {
                            let mut b = buf.lock().await;
                            if b.len() >= STDERR_BUFFER_SIZE {
                                b.pop_front();
                            }
                            b.push_back(line.trim().to_string());
                        }
                    }
                }
            });
        }

        // Brief pause + check if process crashed immediately
        sleep(Duration::from_millis(150)).await;
        {
            let mut c = child.try_wait().map_err(|e| {
                AppError::Custom(format!("Failed to check child process: {}", e))
            })?;
            if let Some(status) = c {
                let stderr_lines = stderr_buf.lock().await;
                let stderr_text = stderr_lines.iter()
                    .cloned()
                    .collect::<Vec<_>>()
                    .join("\n");
                return Err(AppError::Custom(format!(
                    "MCP server exited immediately ({}). stderr:\n{}",
                    status, stderr_text
                )));
            }
        }

        Ok(Self {
            child: Mutex::new(child),
            stdin: Mutex::new(stdin),
            reader: Mutex::new(BufReader::new(stdout)),
            stderr_buf,
        })
    }

    pub async fn send(&self, request: &JsonRpcRequest) -> Result<(), AppError> {
        let mut data = serde_json::to_string(request)?;
        data.push('\n');
        log_debug(&format!("SEND: {} bytes, method={}", data.len(), request.method));
        let mut stdin = self.stdin.lock().await;
        log_debug("SEND: stdin lock acquired");
        stdin.write_all(data.as_bytes()).await.map_err(|e| {
            log_debug(&format!("SEND ERROR: write failed: {}", e));
            AppError::Custom(format!("Write to MCP stdin failed: {}", e))
        })?;
        stdin.flush().await.map_err(|e| {
            log_debug(&format!("SEND ERROR: flush failed: {}", e));
            AppError::Custom(format!("Flush MCP stdin failed: {}", e))
        })?;
        log_debug("SEND: write+flush OK");
        Ok(())
    }

    /// Read one JSON-RPC response. NO timeout here — caller must wrap with timeout.
    pub async fn receive(&self) -> Result<JsonRpcResponse, AppError> {
        log_debug("RECV: waiting for reader lock");
        let mut reader = self.reader.lock().await;
        log_debug("RECV: reader lock acquired, reading...");
        let mut skipped = 0usize;

        loop {
            let mut line = String::new();
            log_debug("RECV: calling read_line...");
            let n = reader.read_line(&mut line).await.map_err(|e| {
                log_debug(&format!("RECV ERROR: {}", e));
                AppError::Custom(format!("Read MCP stdout failed: {}", e))
            })?;
            log_debug(&format!("RECV: got {} bytes: '{}'", n, line.trim_end()));

            if n == 0 {
                let stderr = self.get_stderr().await;
                return Err(AppError::Custom(format!(
                    "MCP server closed stdout (EOF). stderr:\n{}", stderr
                )));
            }

            let trimmed = line.trim();
            if trimmed.is_empty() {
                continue;
            }

            // Only attempt JSON parse on lines starting with '{'
            if trimmed.starts_with('{') {
                if let Ok(resp) = serde_json::from_str::<JsonRpcResponse>(trimmed) {
                    return Ok(resp);
                }
            }

            // Skip non-JSON output
            skipped += 1;
            if skipped > MAX_SKIP_LINES {
                let stderr = self.get_stderr().await;
                return Err(AppError::Custom(format!(
                    "Too many non-JSON lines ({}). Last: '{}'. stderr:\n{}",
                    skipped, trimmed, stderr
                )));
            }
        }
    }

    pub async fn send_and_receive(&self, request: &JsonRpcRequest) -> Result<JsonRpcResponse, AppError> {
        self.send(request).await?;
        let request_id = request.id.clone();

        let result = timeout(Duration::from_secs(SEND_RECV_TIMEOUT_SECS), async {
            loop {
                let resp = self.receive().await?;
                // Skip notifications (no id) when waiting for a response
                if resp.id.is_none() && request_id.is_some() {
                    continue;
                }
                if resp.id == request_id {
                    return Ok::<_, AppError>(resp);
                }
            }
        }).await;

        match result {
            Ok(inner) => inner,
            Err(_) => {
                let stderr = self.get_stderr().await;
                Err(AppError::Custom(format!(
                    "Timeout ({}s) waiting for MCP response. stderr:\n{}",
                    SEND_RECV_TIMEOUT_SECS, stderr
                )))
            }
        }
    }

    pub async fn kill(&self) -> Result<(), AppError> {
        let mut child = self.child.lock().await;
        let _ = child.kill().await;
        Ok(())
    }

    async fn get_stderr(&self) -> String {
        let buf = self.stderr_buf.lock().await;
        buf.iter().cloned().collect::<Vec<_>>().join("\n")
    }
}

/// Resolve the command to a real executable path.
/// On Windows, handles .cmd/.bat → node.exe + .js script conversion.
fn resolve_program(command: &str, args: &[String]) -> Result<(String, Vec<String>), AppError> {
    // Use `which` to resolve the full path (respects PATHEXT on Windows)
    let resolved = which::which(command).map_err(|e| {
        AppError::Custom(format!(
            "Command '{}' not found in PATH: {}", command, e
        ))
    })?;

    let resolved_str = resolved.to_string_lossy().to_string();
    let ext = resolved.extension()
        .map(|e| e.to_string_lossy().to_lowercase())
        .unwrap_or_default();

    // On Windows: if resolved to .cmd/.bat, bypass it by calling node.exe directly
    if ext == "cmd" || ext == "bat" {
        if let Ok(node_path) = which::which("node") {
            let node_str = node_path.to_string_lossy().to_string();
            let node_dir = node_path.parent();

            // For npx/npm, find the corresponding CLI .js script
            let cmd_lower = command.to_lowercase();
            if cmd_lower.starts_with("npx") {
                if let Some(dir) = node_dir {
                    let cli_js = dir.join("node_modules/npm/bin/npx-cli.js");
                    if cli_js.exists() {
                        let mut final_args = vec![cli_js.to_string_lossy().to_string()];
                        final_args.extend(args.iter().cloned());
                        return Ok((node_str, final_args));
                    }
                }
            }
            if cmd_lower.starts_with("npm") {
                if let Some(dir) = node_dir {
                    let cli_js = dir.join("node_modules/npm/bin/npm-cli.js");
                    if cli_js.exists() {
                        let mut final_args = vec![cli_js.to_string_lossy().to_string()];
                        final_args.extend(args.iter().cloned());
                        return Ok((node_str, final_args));
                    }
                }
            }
            // Generic .cmd: try running through node if it looks like a JS wrapper
            // Otherwise fall through to use the resolved path directly
        }
    }

    // For .exe or non-Windows: use resolved path directly
    Ok((resolved_str, args.to_vec()))
}
