import { useRequestStore } from "@/stores/useRequestStore";
import { AUTH_TYPES } from "@/lib/constants";
import type { AuthType } from "@/types";
import styles from "./AuthPanel.module.css";

export function AuthPanel() {
  const { authType, authConfig, setAuthType, setAuthConfig } = useRequestStore();

  const updateConfig = (key: string, value: string) => {
    setAuthConfig({ ...authConfig, [key]: value });
  };

  return (
    <div className={styles.authPanel}>
      <div className={styles.typeRow}>
        <label className={styles.label}>인증 타입</label>
        <select
          className={styles.select}
          value={authType}
          onChange={(e) => setAuthType(e.target.value as AuthType)}
        >
          {AUTH_TYPES.map((at) => (
            <option key={at.value} value={at.value}>
              {at.label}
            </option>
          ))}
        </select>
      </div>

      {authType === "bearer" && (
        <div className={styles.fieldGroup}>
          <label className={styles.label}>토큰</label>
          <input
            className={styles.input}
            type="text"
            value={authConfig.token ?? ""}
            onChange={(e) => updateConfig("token", e.target.value)}
            placeholder="Bearer 토큰 또는 {{변수}}"
          />
          <span className={styles.hint}>
            Authorization 헤더에 "Bearer ..." 형태로 추가됩니다
          </span>
        </div>
      )}

      {authType === "basic" && (
        <>
          <div className={styles.fieldGroup}>
            <label className={styles.label}>사용자 이름</label>
            <input
              className={styles.input}
              type="text"
              value={authConfig.username ?? ""}
              onChange={(e) => updateConfig("username", e.target.value)}
              placeholder="Username"
            />
          </div>
          <div className={styles.fieldGroup}>
            <label className={styles.label}>비밀번호</label>
            <input
              className={styles.input}
              type="password"
              value={authConfig.password ?? ""}
              onChange={(e) => updateConfig("password", e.target.value)}
              placeholder="Password"
            />
          </div>
        </>
      )}

      {authType === "apikey" && (
        <>
          <div className={styles.fieldGroup}>
            <label className={styles.label}>키 이름</label>
            <input
              className={styles.input}
              type="text"
              value={authConfig.keyName ?? ""}
              onChange={(e) => updateConfig("keyName", e.target.value)}
              placeholder="X-API-Key"
            />
          </div>
          <div className={styles.fieldGroup}>
            <label className={styles.label}>값</label>
            <input
              className={styles.input}
              type="text"
              value={authConfig.keyValue ?? ""}
              onChange={(e) => updateConfig("keyValue", e.target.value)}
              placeholder="API Key 값"
            />
          </div>
          <div className={styles.fieldGroup}>
            <label className={styles.label}>추가 위치</label>
            <select
              className={styles.select}
              value={authConfig.addTo ?? "header"}
              onChange={(e) => updateConfig("addTo", e.target.value)}
            >
              <option value="header">Header</option>
              <option value="query">Query Parameter</option>
            </select>
          </div>
        </>
      )}

      {authType === "none" && (
        <div className={styles.hint}>인증이 비활성화되어 있습니다</div>
      )}
    </div>
  );
}
