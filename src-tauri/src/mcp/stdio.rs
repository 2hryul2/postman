use crate::error::AppError;
use crate::models::mcp::{JsonRpcRequest, JsonRpcResponse};
use std::collections::HashMap;
use tokio::io::{AsyncBufReadExt, AsyncWriteExt, BufReader};
use tokio::process::{Child, Command};
use tokio::sync::Mutex;

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
        // On Windows, use cmd.exe /C to resolve .cmd/.bat files (e.g. npx → npx.cmd)
        // and inherit the full system PATH
        #[cfg(target_os = "windows")]
        let mut cmd = {
            let mut full_args = vec!["/C".to_string(), command.to_string()];
            full_args.extend(args.iter().cloned());
            let mut c = Command::new("cmd.exe");
            c.args(&full_args);
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

        // Merge with current env + custom env
        for (k, v) in env {
            cmd.env(k, v);
        }

        // On Windows, prevent console window from appearing
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
        // Read lines until we find valid JSON-RPC (skip non-JSON lines from cmd.exe/npx)
        let mut attempts = 0;
        loop {
            let mut line = String::new();
            let bytes_read = reader.read_line(&mut line).await.map_err(|e| {
                AppError::Custom(format!("Failed to read from MCP stdout: {}", e))
            })?;
            if bytes_read == 0 {
                return Err(AppError::Custom("MCP server closed stdout".to_string()));
            }
            let trimmed = line.trim();
            if trimmed.is_empty() {
                attempts += 1;
                if attempts > 100 {
                    return Err(AppError::Custom("Too many empty lines from MCP server".to_string()));
                }
                continue;
            }
            // Only try to parse lines that look like JSON objects
            if trimmed.starts_with('{') {
                match serde_json::from_str::<JsonRpcResponse>(trimmed) {
                    Ok(resp) => return Ok(resp),
                    Err(_) => continue, // malformed JSON, skip
                }
            }
            // Non-JSON line (cmd.exe banner, npx download progress, etc.) — skip
            attempts += 1;
            if attempts > 200 {
                return Err(AppError::Custom(format!(
                    "No valid JSON-RPC response after 200 lines. Last line: {}",
                    trimmed
                )));
            }
        }
    }

    pub async fn send_and_receive(&self, request: &JsonRpcRequest) -> Result<JsonRpcResponse, AppError> {
        self.send(request).await?;
        // Read responses until we get one matching our request id
        let request_id = request.id.clone();
        loop {
            let resp = self.receive().await?;
            // Notifications have no id — skip them
            if resp.id.is_none() && request_id.is_some() {
                continue;
            }
            // Match response id
            if resp.id == request_id {
                return Ok(resp);
            }
        }
    }

    pub async fn kill(&self) -> Result<(), AppError> {
        let mut child = self.child.lock().await;
        let _ = child.kill().await;
        Ok(())
    }
}
