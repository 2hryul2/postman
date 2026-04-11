import { useRequestStore } from "@/stores/useRequestStore";
import { BODY_TYPES } from "@/lib/constants";
import { BODY_TYPE_HELP, BODY_NO_BODY_METHODS } from "@/lib/helpText";
import type { BodyType } from "@/types";
import styles from "./BodyPanel.module.css";

export function BodyPanel() {
  const { method, bodyType, body, setBodyType, setBody } = useRequestStore();
  const isNoBody = BODY_NO_BODY_METHODS.includes(method);

  const handleJsonTemplate = () => {
    setBody(JSON.stringify({ key: "value" }, null, 2));
  };

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

      <div className={styles.bodyHint}>{BODY_TYPE_HELP[bodyType]}</div>

      {isNoBody && (
        <div className={styles.noBodyBanner}>
          {method} 요청은 Body를 사용하지 않습니다
        </div>
      )}

      {!isNoBody && !body && bodyType === "json" && (
        <button className={styles.templateBtn} onClick={handleJsonTemplate}>
          JSON 템플릿 채우기
        </button>
      )}

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
        disabled={isNoBody}
      />
    </div>
  );
}
