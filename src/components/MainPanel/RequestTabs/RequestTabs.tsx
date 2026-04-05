import { useUIStore } from "@/stores/useUIStore";
import { ParamsPanel } from "./ParamsPanel";
import { HeadersPanel } from "./HeadersPanel";
import { BodyPanel } from "./BodyPanel";
import { AuthPanel } from "./AuthPanel";
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
        {activeRequestTab === "params" && <ParamsPanel />}
        {activeRequestTab === "headers" && <HeadersPanel />}
        {activeRequestTab === "body" && <BodyPanel />}
        {activeRequestTab === "auth" && <AuthPanel />}
      </div>
    </div>
  );
}
