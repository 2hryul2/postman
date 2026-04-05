import styles from "./Sidebar.module.css";

interface SidebarProps {
  width: number;
}

export function Sidebar({ width }: SidebarProps) {
  return (
    <div className={styles.sidebar} style={{ width }}>
      <div className={styles.header}>
        <input
          className={styles.search}
          type="text"
          placeholder="컬렉션 검색..."
        />
        <button className={styles.newBtn}>+ 새 요청</button>
      </div>

      <div className={styles.collections}>
        <div className={styles.sectionLabel}>COLLECTIONS</div>
        <div className={styles.empty}>컬렉션이 없습니다</div>
      </div>

      <div className={styles.envBar}>
        <span className={styles.statusDot} />
        <select className={styles.envSelect}>
          <option>환경 없음</option>
        </select>
      </div>
    </div>
  );
}
