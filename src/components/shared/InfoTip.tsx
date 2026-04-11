import styles from "./InfoTip.module.css";

interface InfoTipProps {
  text: string;
  position?: "top" | "bottom" | "left" | "right";
}

export function InfoTip({ text, position = "top" }: InfoTipProps) {
  return (
    <span
      className={`${styles.infotip} ${styles[position]}`}
      data-tooltip={text}
    >
      ?
    </span>
  );
}
