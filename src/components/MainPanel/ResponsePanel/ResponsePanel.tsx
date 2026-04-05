import { useState } from "react";
import { useResponseStore } from "@/stores/useResponseStore";
import { getStatusCategory, STATUS_COLORS } from "@/lib/constants";
import styles from "./ResponsePanel.module.css";

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function tryFormatJson(text: string): string {
  try {
    return JSON.stringify(JSON.parse(text), null, 2);
  } catch {
    return text;
  }
}

type RespTab = "pretty" | "raw" | "headers";

export function ResponsePanel() {
  const { response, isLoading, error } = useResponseStore();
  const [activeTab, setActiveTab] = useState<RespTab>("pretty");

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
        <div className={styles.respTabs}>
          {(["pretty", "raw", "headers"] as const).map((tab) => (
            <button
              key={tab}
              className={`${styles.respTab} ${activeTab === tab ? styles.respTabActive : ""}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab === "pretty" ? "Pretty" : tab === "raw" ? "Raw" : "헤더"}
            </button>
          ))}
        </div>
      </div>
      <div className={styles.bodyArea}>
        {activeTab === "pretty" && (
          <pre className={styles.body}>{tryFormatJson(response.body)}</pre>
        )}
        {activeTab === "raw" && (
          <pre className={styles.body}>{response.body}</pre>
        )}
        {activeTab === "headers" && (
          <div className={styles.headerList}>
            {Object.entries(response.headers).map(([k, v]) => (
              <div key={k} className={styles.headerItem}>
                <span className={styles.headerKey}>{k}</span>
                <span className={styles.headerValue}>{v}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
