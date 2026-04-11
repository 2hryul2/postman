import { useState, useRef, useEffect } from "react";
import type { KeyValuePair } from "@/types";
import styles from "./KeyValueEditor.module.css";

interface KeyValueEditorProps {
  items: KeyValuePair[];
  onChange: (items: KeyValuePair[]) => void;
  keyPlaceholder?: string;
  valuePlaceholder?: string;
  addLabel?: string;
  keySuggestions?: string[];
}

export function KeyValueEditor({
  items,
  onChange,
  keyPlaceholder = "키",
  valuePlaceholder = "값",
  addLabel = "+ 추가",
  keySuggestions,
}: KeyValueEditorProps) {
  const [focusedIdx, setFocusedIdx] = useState<number | null>(null);
  const [selectedSuggestion, setSelectedSuggestion] = useState(-1);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const updateItem = (index: number, field: keyof KeyValuePair, value: string | boolean) => {
    const next = items.map((item, i) =>
      i === index ? { ...item, [field]: value } : item
    );
    onChange(next);
  };

  const removeItem = (index: number) => {
    onChange(items.filter((_, i) => i !== index));
    setFocusedIdx(null);
  };

  const addItem = () => {
    onChange([...items, { key: "", value: "", enabled: true }]);
  };

  const getFilteredSuggestions = (index: number): string[] => {
    if (!keySuggestions || focusedIdx !== index) return [];
    const val = items[index]?.key?.toLowerCase() ?? "";
    if (!val) return keySuggestions;
    return keySuggestions.filter((s) => s.toLowerCase().includes(val));
  };

  const applySuggestion = (index: number, suggestion: string) => {
    updateItem(index, "key", suggestion);
    setFocusedIdx(null);
    setSelectedSuggestion(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent, index: number, suggestions: string[]) => {
    if (suggestions.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedSuggestion((prev) => Math.min(prev + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedSuggestion((prev) => Math.max(prev - 1, 0));
    } else if (e.key === "Enter" && selectedSuggestion >= 0) {
      e.preventDefault();
      applySuggestion(index, suggestions[selectedSuggestion]);
    } else if (e.key === "Escape") {
      setFocusedIdx(null);
    }
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setFocusedIdx(null);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

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
      {items.map((item, i) => {
        const suggestions = getFilteredSuggestions(i);
        return (
          <div className={styles.row} key={i}>
            <input
              type="checkbox"
              className={styles.check}
              checked={item.enabled}
              onChange={(e) => updateItem(i, "enabled", e.target.checked)}
            />
            <div className={styles.inputWrapper} ref={focusedIdx === i ? dropdownRef : undefined}>
              <input
                className={styles.input}
                type="text"
                value={item.key}
                placeholder={keyPlaceholder}
                onChange={(e) => updateItem(i, "key", e.target.value)}
                onFocus={() => { setFocusedIdx(i); setSelectedSuggestion(-1); }}
                onKeyDown={(e) => handleKeyDown(e, i, suggestions)}
              />
              {suggestions.length > 0 && focusedIdx === i && (
                <div className={styles.dropdown}>
                  {suggestions.map((s, si) => (
                    <div
                      key={s}
                      className={`${styles.dropdownItem} ${si === selectedSuggestion ? styles.dropdownActive : ""}`}
                      onMouseDown={() => applySuggestion(i, s)}
                    >
                      {s}
                    </div>
                  ))}
                </div>
              )}
            </div>
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
        );
      })}
      <button className={styles.addBtn} onClick={addItem}>
        {addLabel}
      </button>
    </div>
  );
}
