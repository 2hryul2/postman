import { getCurrentWindow } from "@tauri-apps/api/window";
import styles from "./TitleBar.module.css";

export function TitleBar() {
  const appWindow = getCurrentWindow();

  return (
    <div className={styles.titlebar} data-tauri-drag-region>
      <div className={styles.left}>
        <span className={styles.title}>HiveAPI</span>
      </div>
      <div className={styles.controls}>
        <button
          className={styles.controlBtn}
          onClick={() => appWindow.minimize()}
          aria-label="Minimize"
        >
          &#x2013;
        </button>
        <button
          className={styles.controlBtn}
          onClick={() => appWindow.toggleMaximize()}
          aria-label="Maximize"
        >
          &#x25A1;
        </button>
        <button
          className={`${styles.controlBtn} ${styles.closeBtn}`}
          onClick={() => appWindow.close()}
          aria-label="Close"
        >
          &#x2715;
        </button>
      </div>
    </div>
  );
}
