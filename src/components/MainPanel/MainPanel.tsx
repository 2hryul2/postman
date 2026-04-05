import { RequestBar } from "./RequestBar/RequestBar";
import { RequestTabs } from "./RequestTabs/RequestTabs";
import { ResponsePanel } from "./ResponsePanel/ResponsePanel";
import styles from "./MainPanel.module.css";

export function MainPanel() {
  return (
    <div className={styles.mainPanel}>
      <RequestBar />
      <RequestTabs />
      <ResponsePanel />
    </div>
  );
}
