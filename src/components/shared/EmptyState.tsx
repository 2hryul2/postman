import styles from "./EmptyState.module.css";

interface EmptyAction {
  label: string;
  onClick: () => void;
  variant?: "primary" | "secondary";
}

interface EmptyStateProps {
  title: string;
  description?: string;
  actions?: EmptyAction[];
}

export function EmptyState({ title, description, actions }: EmptyStateProps) {
  return (
    <div className={styles.container}>
      <div className={styles.title}>{title}</div>
      {description && <div className={styles.description}>{description}</div>}
      {actions && actions.length > 0 && (
        <div className={styles.actions}>
          {actions.map((action) => (
            <button
              key={action.label}
              className={`${styles.btn} ${action.variant === "secondary" ? styles.secondary : styles.primary}`}
              onClick={action.onClick}
            >
              {action.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
