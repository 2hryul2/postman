import { useState } from "react";
import { useMcpStore } from "@/stores/useMcpStore";
import { api } from "@/lib/tauri";
import { JsonSchemaForm } from "./JsonSchemaForm";
import styles from "./Mcp.module.css";

export function McpPanel() {
  const { activeServerId, activeItem, serverStates } = useMcpStore();
  const [result, setResult] = useState<unknown>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState<number | null>(null);

  if (!activeServerId || !activeItem) {
    return (
      <div className={styles.panelEmpty}>
        MCP 서버에 연결하고 도구/리소스/프롬프트를 선택하세요
      </div>
    );
  }

  const state = serverStates[activeServerId];
  if (!state || state.status !== "connected") {
    return <div className={styles.panelEmpty}>서버가 연결되어 있지 않습니다</div>;
  }

  const handleToolCall = async (args: Record<string, unknown>) => {
    setIsLoading(true);
    setError(null);
    setResult(null);
    const start = Date.now();
    try {
      const res = await api.mcpToolsCall(activeServerId, activeItem.name, args);
      setResult(res);
      setElapsed(Date.now() - start);
    } catch (err) {
      setError(String(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleResourceRead = async () => {
    setIsLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await api.mcpResourcesRead(activeServerId, activeItem.name);
      setResult(res);
    } catch (err) {
      setError(String(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handlePromptGet = async (args: Record<string, unknown>) => {
    setIsLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await api.mcpPromptsGet(activeServerId, activeItem.name, args);
      setResult(res);
    } catch (err) {
      setError(String(err));
    } finally {
      setIsLoading(false);
    }
  };

  // Find the active item details
  const tool = activeItem.type === "tool" ? state.tools.find((t) => t.name === activeItem.name) : null;
  const resource = activeItem.type === "resource" ? state.resources.find((r) => r.uri === activeItem.name) : null;
  const prompt = activeItem.type === "prompt" ? state.prompts.find((p) => p.name === activeItem.name) : null;

  return (
    <div className={styles.panel}>
      {/* Tool execution */}
      {tool && (
        <>
          <div className={styles.panelHeader}>
            <span className={styles.panelIcon}>&#x1F527;</span>
            <span className={styles.panelTitle}>{tool.name}</span>
          </div>
          {tool.description && <div className={styles.panelDesc}>{tool.description}</div>}
          <div className={styles.panelSection}>
            <div className={styles.sectionLabel}>입력 (Input Schema)</div>
            <JsonSchemaForm
              schema={tool.inputSchema ?? { type: "object", properties: {} }}
              onSubmit={handleToolCall}
              submitLabel="실행"
              isLoading={isLoading}
            />
          </div>
        </>
      )}

      {/* Resource read */}
      {resource && (
        <>
          <div className={styles.panelHeader}>
            <span className={styles.panelIcon}>&#x1F4C4;</span>
            <span className={styles.panelTitle}>{resource.name ?? resource.uri}</span>
          </div>
          {resource.description && <div className={styles.panelDesc}>{resource.description}</div>}
          <div className={styles.panelDesc}>URI: {resource.uri}</div>
          {resource.mimeType && <div className={styles.panelDesc}>Type: {resource.mimeType}</div>}
          <button className={styles.execBtn} onClick={handleResourceRead} disabled={isLoading}>
            {isLoading ? "읽는 중..." : "읽기"}
          </button>
        </>
      )}

      {/* Prompt get */}
      {prompt && (
        <>
          <div className={styles.panelHeader}>
            <span className={styles.panelIcon}>&#x1F4AC;</span>
            <span className={styles.panelTitle}>{prompt.name}</span>
          </div>
          {prompt.description && <div className={styles.panelDesc}>{prompt.description}</div>}
          {prompt.arguments && prompt.arguments.length > 0 && (
            <div className={styles.panelSection}>
              <div className={styles.sectionLabel}>인자</div>
              <JsonSchemaForm
                schema={{
                  type: "object",
                  properties: Object.fromEntries(
                    prompt.arguments.map((a) => [a.name, { type: "string", description: a.description ?? "" }])
                  ),
                  required: prompt.arguments.filter((a) => a.required).map((a) => a.name),
                }}
                onSubmit={handlePromptGet}
                submitLabel="가져오기"
                isLoading={isLoading}
              />
            </div>
          )}
          {(!prompt.arguments || prompt.arguments.length === 0) && (
            <button className={styles.execBtn} onClick={() => handlePromptGet({})} disabled={isLoading}>
              {isLoading ? "가져오는 중..." : "가져오기"}
            </button>
          )}
        </>
      )}

      {/* Result area */}
      {error && <div className={styles.resultError}>{error}</div>}
      {result !== null && (
        <div className={styles.panelSection}>
          <div className={styles.sectionLabel}>
            결과 {elapsed !== null && <span className={styles.elapsed}>{elapsed}ms</span>}
          </div>
          <pre className={styles.resultPre}>
            {typeof result === "string" ? result : JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
