import { useResponseStore } from "@/stores/useResponseStore";
import { getStatusCategory, STATUS_COLORS } from "@/lib/constants";
import styles from "./ResponsePanel.module.css";

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  return `${(bytes / 1024).toFixed(1)} KB`;
}

export function ResponsePanel() {
  const { response, isLoading, error } = useResponseStore();

  if (isLoading) {
    return (
      <div className={styles.panel}>
        <div className={styles.placeholder}>요청 전송 중...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.panel}>
        <div className={styles.error}>{error}</div>
      </div>
    );
  }

  if (!response) {
    return (
      <div className={styles.panel}>
        <div className={styles.placeholder}>
          전송 버튼을 눌러 요청을 실행하세요
        </div>
      </div>
    );
  }

  const category = getStatusCategory(response.status);
  const colors = STATUS_COLORS[category] ?? STATUS_COLORS["5xx"];

  return (
    <div className={styles.panel}>
      <div className={styles.statusBar}>
        <span
          className={styles.statusPill}
          style={{ background: colors.bg, color: colors.text }}
        >
          {response.status} {response.status_text}
        </span>
        <span className={styles.meta}>{response.time_ms}ms</span>
        <span className={styles.meta}>{formatSize(response.size_bytes)}</span>
      </div>
      <pre className={styles.body}>{response.body}</pre>
    </div>
  );
}
