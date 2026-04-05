import { useState } from "react";
import styles from "./Mcp.module.css";

interface JsonSchemaFormProps {
  schema: Record<string, unknown>;
  onSubmit: (values: Record<string, unknown>) => void;
  submitLabel: string;
  isLoading: boolean;
}

export function JsonSchemaForm({ schema, onSubmit, submitLabel, isLoading }: JsonSchemaFormProps) {
  const properties = (schema.properties ?? {}) as Record<string, Record<string, unknown>>;
  const required = (schema.required ?? []) as string[];
  const propNames = Object.keys(properties);

  const [values, setValues] = useState<Record<string, unknown>>({});

  const updateValue = (key: string, value: unknown) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Filter out empty string values
    const cleaned: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(values)) {
      if (v !== "" && v !== undefined) {
        // Try to parse numbers
        const prop = properties[k];
        if (prop?.type === "number" || prop?.type === "integer") {
          cleaned[k] = Number(v);
        } else if (prop?.type === "boolean") {
          cleaned[k] = Boolean(v);
        } else {
          cleaned[k] = v;
        }
      }
    }
    onSubmit(cleaned);
  };

  if (propNames.length === 0) {
    return (
      <form onSubmit={handleSubmit}>
        <div className={styles.formNote}>파라미터 없음</div>
        <button className={styles.execBtn} type="submit" disabled={isLoading}>
          {isLoading ? "실행 중..." : submitLabel}
        </button>
      </form>
    );
  }

  return (
    <form className={styles.schemaForm} onSubmit={handleSubmit}>
      {propNames.map((key) => {
        const prop = properties[key];
        const type = prop?.type as string ?? "string";
        const description = prop?.description as string ?? "";
        const enumValues = prop?.enum as string[] | undefined;
        const isRequired = required.includes(key);

        return (
          <div key={key} className={styles.formField}>
            <label className={styles.formLabel}>
              {key} {isRequired && <span className={styles.reqStar}>*</span>}
              <span className={styles.formType}>({type})</span>
            </label>
            {description && <div className={styles.formHint}>{description}</div>}

            {enumValues ? (
              <select
                className={styles.formSelect}
                value={String(values[key] ?? "")}
                onChange={(e) => updateValue(key, e.target.value)}
              >
                <option value="">선택...</option>
                {enumValues.map((v) => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </select>
            ) : type === "boolean" ? (
              <input
                type="checkbox"
                checked={Boolean(values[key])}
                onChange={(e) => updateValue(key, e.target.checked)}
              />
            ) : (
              <input
                className={styles.formInput}
                type={type === "number" || type === "integer" ? "number" : "text"}
                value={String(values[key] ?? "")}
                onChange={(e) => updateValue(key, e.target.value)}
                placeholder={description || key}
              />
            )}
          </div>
        );
      })}
      <button className={styles.execBtn} type="submit" disabled={isLoading}>
        {isLoading ? "실행 중..." : submitLabel}
      </button>
    </form>
  );
}
