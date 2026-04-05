import { useUIStore } from "@/stores/useUIStore";
import styles from "./RequestTabs.module.css";

const TABS = [
  { key: "params", label: "파라미터" },
  { key: "headers", label: "헤더" },
  { key: "body", label: "Body" },
  { key: "auth", label: "인증" },
] as const;

export function RequestTabs() {
  const { activeRequestTab, setActiveRequestTab } = useUIStore();

  return (
    <div className={styles.container}>
      <div className={styles.tabBar}>
        {TABS.map((tab) => (
          <button
            key={tab.key}
            className={`${styles.tab} ${activeRequestTab === tab.key ? styles.active : ""}`}
            onClick={() => setActiveRequestTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className={styles.tabContent}>
        <div className={styles.placeholder}>
          {activeRequestTab === "params" && "파라미터 패널 (키/값 편집기)"}
          {activeRequestTab === "headers" && "헤더 패널 (키/값 편집기)"}
          {activeRequestTab === "body" && "Body 패널 (CodeMirror 에디터)"}
          {activeRequestTab === "auth" && "인증 패널 (타입별 입력 폼)"}
        </div>
      </div>
    </div>
  );
}
