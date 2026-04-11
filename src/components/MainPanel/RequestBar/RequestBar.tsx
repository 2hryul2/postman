import { useEffect } from "react";
import { useRequestStore } from "@/stores/useRequestStore";
import { useResponseStore } from "@/stores/useResponseStore";
import { useCollectionStore } from "@/stores/useCollectionStore";
import { useSendRequest } from "@/hooks/useSendRequest";
import { api } from "@/lib/tauri";
import { METHOD_COLORS, HTTP_METHODS } from "@/lib/constants";
import { METHOD_HELP } from "@/lib/helpText";
import { InfoTip } from "@/components/shared/InfoTip";
import type { HttpMethod, ApiRequest } from "@/types";
import styles from "./RequestBar.module.css";

export function RequestBar() {
  const { method, url, headers, params, body, bodyType, authType, authConfig, setMethod, setUrl } = useRequestStore();
  const { isLoading } = useResponseStore();
  const { activeRequestId, activeCollectionId, setRequests } = useCollectionStore();
  const sendRequest = useSendRequest();
  const colors = METHOD_COLORS[method];

  // Ctrl+Enter to send
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === "Enter") {
        e.preventDefault();
        sendRequest();
      }
      if (e.ctrlKey && e.key === "s") {
        e.preventDefault();
        if (activeRequestId && activeCollectionId) handleSave();
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendRequest();
  };

  const handleSave = async () => {
    if (!activeRequestId || !activeCollectionId) return;

    const updated: ApiRequest = {
      id: activeRequestId,
      collection_id: activeCollectionId,
      name: url.split("/").pop()?.split("?")[0] || "요청",
      method,
      url,
      headers: headers.length > 0 ? JSON.stringify(headers) : null,
      params: params.length > 0 ? JSON.stringify(params) : null,
      body_type: bodyType,
      body: body || null,
      auth_type: authType,
      auth_config: Object.keys(authConfig).length > 0 ? JSON.stringify(authConfig) : null,
      sort_order: 0,
      created_at: null,
      updated_at: null,
    };

    await api.saveRequest(updated);
    const refreshed = await api.getRequests(activeCollectionId);
    setRequests(refreshed);
  };

  return (
    <form className={styles.requestBar} onSubmit={handleSubmit}>
      <select
        className={styles.methodSelect}
        value={method}
        onChange={(e) => setMethod(e.target.value as HttpMethod)}
        style={{ background: colors.bg, color: colors.text }}
      >
        {HTTP_METHODS.map((m) => (
          <option key={m} value={m}>
            {m}
          </option>
        ))}
      </select>
      <InfoTip text={METHOD_HELP[method]} position="bottom" />
      <input
        className={styles.urlInput}
        type="text"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="https://api.example.com/users"
      />
      <button
        className={styles.saveBtn}
        type="button"
        onClick={handleSave}
        disabled={!activeRequestId}
        title={activeRequestId ? "요청 저장 (Ctrl+S)" : "컬렉션의 요청을 선택하세요"}
      >
        저장
      </button>
      <button className={styles.sendBtn} type="submit" disabled={isLoading}>
        <span>{isLoading ? "전송 중..." : "전송"}</span>
        {!isLoading && <span className={styles.shortcutHint}>Ctrl+Enter</span>}
      </button>
    </form>
  );
}
