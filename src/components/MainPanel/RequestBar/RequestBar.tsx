import { useRequestStore } from "@/stores/useRequestStore";
import { useResponseStore } from "@/stores/useResponseStore";
import { useCollectionStore } from "@/stores/useCollectionStore";
import { useSendRequest } from "@/hooks/useSendRequest";
import { api } from "@/lib/tauri";
import { METHOD_COLORS, HTTP_METHODS } from "@/lib/constants";
import type { HttpMethod, ApiRequest } from "@/types";
import styles from "./RequestBar.module.css";

export function RequestBar() {
  const { method, url, headers, params, body, bodyType, authType, authConfig, setMethod, setUrl } = useRequestStore();
  const { isLoading } = useResponseStore();
  const { activeRequestId, activeCollectionId, setRequests } = useCollectionStore();
  const sendRequest = useSendRequest();
  const colors = METHOD_COLORS[method];

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
      <input
        className={styles.urlInput}
        type="text"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder='URL 또는 {{변수}} 입력'
      />
      <button
        className={styles.saveBtn}
        type="button"
        onClick={handleSave}
        disabled={!activeRequestId}
        title={activeRequestId ? "요청 저장" : "컬렉션의 요청을 선택하세요"}
      >
        저장
      </button>
      <button className={styles.sendBtn} type="submit" disabled={isLoading}>
        {isLoading ? "전송 중..." : "전송"}
      </button>
    </form>
  );
}
