import type { KeyValuePair } from "@/types";
import styles from "./KeyValueEditor.module.css";

interface KeyValueEditorProps {
  items: KeyValuePair[];
  onChange: (items: KeyValuePair[]) => void;
  keyPlaceholder?: string;
  valuePlaceholder?: string;
  addLabel?: string;
}

export function KeyValueEditor({
  items,
  onChange,
  keyPlaceholder = "키",
  valuePlaceholder = "값",
  addLabel = "+ 추가",
}: KeyValueEditorProps) {
  const updateItem = (index: number, field: keyof KeyValuePair, value: string | boolean) => {
    const next = items.map((item, i) =>
      i === index ? { ...item, [field]: value } : item
    );
    onChange(next);
  };

  const removeItem = (index: number) => {
    onChange(items.filter((_, i) => i !== index));
  };

  const addItem = () => {
    onChange([...items, { key: "", value: "", enabled: true }]);
  };

  return (
    <div className={styles.editor}>
      {items.length > 0 && (
        <div className={styles.headerRow}>
          <span className={styles.checkCol} />
          <span className={styles.label}>{keyPlaceholder}</span>
          <span className={styles.label}>{valuePlaceholder}</span>
          <span className={styles.actionCol} />
        </div>
      )}
      {items.map((item, i) => (
        <div className={styles.row} key={i}>
          <input
            type="checkbox"
            className={styles.check}
            checked={item.enabled}
            onChange={(e) => updateItem(i, "enabled", e.target.checked)}
          />
          <input
            className={styles.input}
            type="text"
            value={item.key}
            placeholder={keyPlaceholder}
            onChange={(e) => updateItem(i, "key", e.target.value)}
          />
          <input
            className={styles.input}
            type="text"
            value={item.value}
            placeholder={valuePlaceholder}
            onChange={(e) => updateItem(i, "value", e.target.value)}
          />
          <button className={styles.deleteBtn} onClick={() => removeItem(i)}>
            &times;
          </button>
        </div>
      ))}
      <button className={styles.addBtn} onClick={addItem}>
        {addLabel}
      </button>
    </div>
  );
}
