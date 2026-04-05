import { useRequestStore } from "@/stores/useRequestStore";
import { useResponseStore } from "@/stores/useResponseStore";
import { useSendRequest } from "@/hooks/useSendRequest";
import { METHOD_COLORS, HTTP_METHODS } from "@/lib/constants";
import type { HttpMethod } from "@/types";
import styles from "./RequestBar.module.css";

export function RequestBar() {
  const { method, url, setMethod, setUrl } = useRequestStore();
  const { isLoading } = useResponseStore();
  const sendRequest = useSendRequest();
  const colors = METHOD_COLORS[method];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendRequest();
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
      <button className={styles.sendBtn} type="submit" disabled={isLoading}>
        {isLoading ? "전송 중..." : "전송"}
      </button>
    </form>
  );
}
