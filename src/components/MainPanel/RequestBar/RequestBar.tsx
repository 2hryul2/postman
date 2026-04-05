import { useRequestStore } from "@/stores/useRequestStore";
import { METHOD_COLORS, HTTP_METHODS } from "@/lib/constants";
import type { HttpMethod } from "@/types";
import styles from "./RequestBar.module.css";

export function RequestBar() {
  const { method, url, setMethod, setUrl } = useRequestStore();
  const colors = METHOD_COLORS[method];

  return (
    <div className={styles.requestBar}>
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
      <button className={styles.sendBtn}>전송</button>
    </div>
  );
}
