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
        // On Windows: use "cmd.exe /S /C "command args..."" to properly handle
        // PATH resolution and spaces. cmd.exe finds npx.cmd via PATH automatically.
        #[cfg(target_os = "windows")]
        let mut cmd = {
            // Build full command string for cmd.exe /S /C "..."
            let mut parts = vec![command.to_string()];
            parts.extend(args.iter().cloned());
            let full_cmd = parts.join(" ");

            let mut c = Command::new("cmd.exe");
            c.args(["/S", "/C", &full_cmd]);
            c
        };

        #[cfg(not(target_os = "windows"))]
        let mut cmd = {
            let mut c = Command::new(command);
            c.args(args);
            c
        };

        cmd.stdin(std::process::Stdio::piped())
            .stdout(std::process::Stdio::piped())
            .stderr(std::process::Stdio::piped());

        for (k, v) in env {
            cmd.env(k, v);
        }

        // CREATE_NO_WINDOW: hide console. Safe now because we skip non-JSON
        // lines and drain stderr to prevent buffer deadlock.
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

        // Drain stderr in background to prevent OS pipe buffer deadlock
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
                    AppError::Custom(format!("Failed to read from MCP stdout: {}", e))
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
                // Only parse lines starting with '{' as JSON-RPC
                if trimmed.starts_with('{') {
                    match serde_json::from_str::<JsonRpcResponse>(trimmed) {
                        Ok(resp) => return Ok(resp),
                        Err(_) => {
                            last_line = trimmed.to_string();
                            continue;
                        }
                    }
                }
                // Skip non-JSON lines
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
