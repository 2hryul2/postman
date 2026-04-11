import { useUIStore } from "@/stores/useUIStore";
import { TAB_HELP } from "@/lib/helpText";
import { InfoTip } from "@/components/shared/InfoTip";
import { ParamsPanel } from "./ParamsPanel";
import { HeadersPanel } from "./HeadersPanel";
import { BodyPanel } from "./BodyPanel";
import { AuthPanel } from "./AuthPanel";
import styles from "./RequestTabs.module.css";

const TABS = [
  { key: "params", label: "파라미터", help: TAB_HELP.params },
  { key: "headers", label: "헤더", help: TAB_HELP.headers },
  { key: "body", label: "Body", help: TAB_HELP.body },
  { key: "auth", label: "인증", help: TAB_HELP.auth },
] as const;

export function RequestTabs() {
  const { activeRequestTab, setActiveRequestTab } = useUIStore();

  return (
    <div className={styles.container}>
      <div className={styles.tabBar}>
        {TABS.map((tab) => (
          <div key={tab.key} className={styles.tabWrapper}>
            <button
              className={`${styles.tab} ${activeRequestTab === tab.key ? styles.active : ""}`}
              onClick={() => setActiveRequestTab(tab.key)}
            >
              {tab.label}
            </button>
            {activeRequestTab === tab.key && (
              <InfoTip text={tab.help} position="bottom" />
            )}
          </div>
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
