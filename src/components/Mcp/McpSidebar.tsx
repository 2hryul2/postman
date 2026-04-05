import { useEffect, useState, useCallback } from "react";
import { useMcpStore } from "@/stores/useMcpStore";
import { api } from "@/lib/tauri";
import { McpAddServerModal } from "./McpAddServerModal";
import type { McpTool, McpResource, McpPrompt } from "@/types";
import styles from "./Mcp.module.css";

export function McpSidebar() {
  const { servers, serverStates, activeServerId, activeItem, setServers, setActiveServerId, setActiveItem, setServerState } = useMcpStore();
  const [showAddModal, setShowAddModal] = useState(false);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    api.mcpGetServers().then(setServers).catch(console.error);
  }, [setServers]);

  const toggleServer = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    setActiveServerId(id);
  };

  const handleConnect = useCallback(async (serverId: string) => {
    setServerState(serverId, { status: "connecting", error: null });
    try {
      const info = await api.mcpConnect(serverId);
      setServerState(serverId, {
        status: "connected",
        tools: info.tools,
        resources: info.resources,
        prompts: info.prompts,
        protocolVersion: info.protocol_version,
        serverName: info.server_name,
      });
      setExpandedIds((prev) => new Set(prev).add(serverId));
    } catch (err) {
      setServerState(serverId, { status: "error", error: String(err) });
    }
  }, [setServerState]);

  const handleDisconnect = useCallback(async (serverId: string) => {
    try {
      await api.mcpDisconnect(serverId);
    } catch { /* ignore */ }
    setServerState(serverId, { status: "disconnected", tools: [], resources: [], prompts: [] });
  }, [setServerState]);

  const handleDelete = useCallback(async (serverId: string) => {
    if (!confirm("이 MCP 서버를 삭제하시겠습니까?")) return;
    try { await api.mcpDisconnect(serverId); } catch { /* ignore */ }
    await api.mcpDeleteServer(serverId);
    const updated = await api.mcpGetServers();
    setServers(updated);
    if (activeServerId === serverId) setActiveServerId(null);
  }, [activeServerId, setServers, setActiveServerId]);

  const statusDot = (status: string) => {
    switch (status) {
      case "connected": return styles.dotGreen;
      case "connecting": return styles.dotYellow;
      case "error": return styles.dotRed;
      default: return styles.dotGray;
    }
  };

  return (
    <div className={styles.mcpSidebar}>
      <button className={styles.addServerBtn} onClick={() => setShowAddModal(true)}>
        + MCP 서버 추가
      </button>

      {servers.length === 0 && <div className={styles.empty}>MCP 서버가 없습니다</div>}

      {servers.map((srv) => {
        const state = serverStates[srv.id];
        const status = state?.status ?? "disconnected";
        const tools: McpTool[] = state?.tools ?? [];
        const resources: McpResource[] = state?.resources ?? [];
        const prompts: McpPrompt[] = state?.prompts ?? [];
        const isExpanded = expandedIds.has(srv.id);

        return (
          <div key={srv.id} className={styles.serverBlock}>
            <div className={styles.serverHeader} onClick={() => toggleServer(srv.id)}>
              <span className={styles.arrow}>{isExpanded ? "\u25BC" : "\u25B6"}</span>
              <span className={`${styles.dot} ${statusDot(status)}`} />
              <span className={styles.serverName}>{srv.name}</span>
              <span className={styles.transport}>{srv.transport}</span>
            </div>

            {isExpanded && (
              <div className={styles.serverBody}>
                {status === "disconnected" && (
                  <div className={styles.serverActions}>
                    <button className={styles.connectBtn} onClick={() => handleConnect(srv.id)}>연결</button>
                    <button className={styles.deleteBtn} onClick={() => handleDelete(srv.id)}>&times;</button>
                  </div>
                )}
                {status === "connecting" && <div className={styles.statusMsg}>연결 중...</div>}
                {status === "error" && (
                  <div className={styles.serverActions}>
                    <span className={styles.errorMsg}>{state?.error}</span>
                    <button className={styles.connectBtn} onClick={() => handleConnect(srv.id)}>재연결</button>
                  </div>
                )}
                {status === "connected" && (
                  <>
                    {tools.length > 0 && (
                      <div className={styles.category}>
                        <div className={styles.categoryLabel}>Tools ({tools.length})</div>
                        {tools.map((t) => (
                          <div
                            key={t.name}
                            className={`${styles.mcpItem} ${activeItem?.name === t.name && activeItem?.type === "tool" ? styles.mcpItemActive : ""}`}
                            onClick={() => { setActiveServerId(srv.id); setActiveItem({ type: "tool", name: t.name }); }}
                          >
                            <span className={styles.mcpIcon}>&#x1F527;</span>
                            <span className={styles.mcpItemName}>{t.name}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {resources.length > 0 && (
                      <div className={styles.category}>
                        <div className={styles.categoryLabel}>Resources ({resources.length})</div>
                        {resources.map((r) => (
                          <div
                            key={r.uri}
                            className={`${styles.mcpItem} ${activeItem?.name === r.uri && activeItem?.type === "resource" ? styles.mcpItemActive : ""}`}
                            onClick={() => { setActiveServerId(srv.id); setActiveItem({ type: "resource", name: r.uri }); }}
                          >
                            <span className={styles.mcpIcon}>&#x1F4C4;</span>
                            <span className={styles.mcpItemName}>{r.name ?? r.uri}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {prompts.length > 0 && (
                      <div className={styles.category}>
                        <div className={styles.categoryLabel}>Prompts ({prompts.length})</div>
                        {prompts.map((p) => (
                          <div
                            key={p.name}
                            className={`${styles.mcpItem} ${activeItem?.name === p.name && activeItem?.type === "prompt" ? styles.mcpItemActive : ""}`}
                            onClick={() => { setActiveServerId(srv.id); setActiveItem({ type: "prompt", name: p.name }); }}
                          >
                            <span className={styles.mcpIcon}>&#x1F4AC;</span>
                            <span className={styles.mcpItemName}>{p.name}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    <button className={styles.disconnectBtn} onClick={() => handleDisconnect(srv.id)}>연결 해제</button>
                  </>
                )}
              </div>
            )}
          </div>
        );
      })}

      {showAddModal && (
        <McpAddServerModal
          onClose={() => setShowAddModal(false)}
          onAdded={() => { api.mcpGetServers().then(setServers); setShowAddModal(false); }}
        />
      )}
    </div>
  );
}
