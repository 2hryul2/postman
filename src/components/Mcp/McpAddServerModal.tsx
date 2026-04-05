import { useState } from "react";
import { api } from "@/lib/tauri";
import { generateId } from "@/lib/uuid";
import type { McpServer, McpTransport } from "@/types";
import styles from "./Mcp.module.css";

interface Props {
  onClose: () => void;
  onAdded: () => void;
}

export function McpAddServerModal({ onClose, onAdded }: Props) {
  const [name, setName] = useState("");
  const [transport, setTransport] = useState<McpTransport>("stdio");
  const [command, setCommand] = useState("");
  const [args, setArgs] = useState("");
  const [url, setUrl] = useState("");
  const [headerKey, setHeaderKey] = useState("");
  const [headerValue, setHeaderValue] = useState("");

  const handleSubmit = async () => {
    if (!name.trim()) return;

    const server: McpServer = {
      id: generateId(),
      name: name.trim(),
      transport,
      command: transport === "stdio" ? command.trim() || null : null,
      args: transport === "stdio" && args.trim()
        ? JSON.stringify(args.trim().split(/\s+/))
        : null,
      env: null,
      url: transport === "http" ? url.trim() || null : null,
      headers: transport === "http" && headerKey.trim()
        ? JSON.stringify({ [headerKey.trim()]: headerValue })
        : null,
      auto_connect: false,
      created_at: null,
    };

    await api.mcpSaveServer(server);
    onAdded();
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3>MCP 서버 추가</h3>
          <button className={styles.closeBtn} onClick={onClose}>&times;</button>
        </div>

        <div className={styles.modalBody}>
          <label className={styles.fieldLabel}>서버 이름</label>
          <input className={styles.fieldInput} value={name} onChange={(e) => setName(e.target.value)} placeholder="my-mcp-server" />

          <label className={styles.fieldLabel}>전송 방식</label>
          <div className={styles.radioRow}>
            <label><input type="radio" checked={transport === "stdio"} onChange={() => setTransport("stdio")} /> stdio</label>
            <label><input type="radio" checked={transport === "http"} onChange={() => setTransport("http")} /> Streamable HTTP</label>
          </div>

          {transport === "stdio" && (
            <>
              <label className={styles.fieldLabel}>실행 명령어</label>
              <input className={styles.fieldInput} value={command} onChange={(e) => setCommand(e.target.value)} placeholder="npx, python, node 등" />
              <label className={styles.fieldLabel}>인자 (공백 구분)</label>
              <input className={styles.fieldInput} value={args} onChange={(e) => setArgs(e.target.value)} placeholder="-y @modelcontextprotocol/server-filesystem /path" />
            </>
          )}

          {transport === "http" && (
            <>
              <label className={styles.fieldLabel}>서버 URL</label>
              <input className={styles.fieldInput} value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://mcp.example.com/mcp" />
              <label className={styles.fieldLabel}>인증 헤더 (선택)</label>
              <div className={styles.headerRow}>
                <input className={styles.fieldInput} value={headerKey} onChange={(e) => setHeaderKey(e.target.value)} placeholder="Authorization" />
                <input className={styles.fieldInput} value={headerValue} onChange={(e) => setHeaderValue(e.target.value)} placeholder="Bearer sk-..." />
              </div>
            </>
          )}
        </div>

        <div className={styles.modalFooter}>
          <button className={styles.cancelBtn} onClick={onClose}>취소</button>
          <button className={styles.submitBtn} onClick={handleSubmit} disabled={!name.trim()}>추가</button>
        </div>
      </div>
    </div>
  );
}
