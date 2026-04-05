import { useRequestStore } from "@/stores/useRequestStore";
import { BODY_TYPES } from "@/lib/constants";
import type { BodyType } from "@/types";
import styles from "./BodyPanel.module.css";

export function BodyPanel() {
  const { bodyType, body, setBodyType, setBody } = useRequestStore();

  return (
    <div className={styles.bodyPanel}>
      <div className={styles.typeBar}>
        {BODY_TYPES.map((bt) => (
          <button
            key={bt.value}
            className={`${styles.typeBtn} ${bodyType === bt.value ? styles.active : ""}`}
            onClick={() => setBodyType(bt.value as BodyType)}
          >
            {bt.label}
          </button>
        ))}
      </div>
      <textarea
        className={styles.editor}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder={
          bodyType === "json"
            ? '{\n  "key": "value"\n}'
            : "요청 본문을 입력하세요..."
        }
        spellCheck={false}
      />
    </div>
  );
}
