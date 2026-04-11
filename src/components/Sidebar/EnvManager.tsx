import { useState, useEffect } from "react";
import { useEnvironmentStore } from "@/stores/useEnvironmentStore";
import { api } from "@/lib/tauri";
import { generateId } from "@/lib/uuid";
import type { Environment, EnvVariable } from "@/types";
import styles from "./EnvManager.module.css";

interface EnvManagerProps {
  onClose: () => void;
}

export function EnvManager({ onClose }: EnvManagerProps) {
  const {
    environments, setEnvironments,
    activeEnvironmentId, setActiveEnvironmentId,
    setVariables,
  } = useEnvironmentStore();

  const [editingEnvId, setEditingEnvId] = useState<string | null>(activeEnvironmentId);
  const [envVars, setEnvVars] = useState<EnvVariable[]>([]);

  // Load variables for selected environment
  useEffect(() => {
    if (editingEnvId) {
      api.getEnvVariables(editingEnvId).then(setEnvVars).catch(console.error);
    } else {
      setEnvVars([]);
    }
  }, [editingEnvId]);

  const createEnvironment = async () => {
    const name = prompt("환경 이름:");
    if (!name) return;
    const env: Environment = { id: generateId(), name };
    await api.saveEnvironment(env);
    const updated = await api.getEnvironments();
    setEnvironments(updated);
    setEditingEnvId(env.id);
  };

  const deleteEnvironment = async (id: string) => {
    if (!confirm("이 환경을 삭제하시겠습니까? 모든 변수가 삭제됩니다.")) return;
    await api.deleteEnvironment(id);
    const updated = await api.getEnvironments();
    setEnvironments(updated);
    if (activeEnvironmentId === id) {
      setActiveEnvironmentId(null);
      setVariables([]);
    }
    if (editingEnvId === id) {
      setEditingEnvId(updated.length > 0 ? updated[0].id : null);
    }
  };

  const addVariable = async () => {
    if (!editingEnvId) return;
    const newVar: EnvVariable = {
      id: generateId(),
      environment_id: editingEnvId,
      key: "",
      value: "",
      is_secret: false,
    };
    await api.saveEnvVariable(newVar);
    setEnvVars((prev) => [...prev, newVar]);
  };

  const updateVariable = async (variable: EnvVariable) => {
    await api.saveEnvVariable(variable);
    // Refresh active env variables if this is the active one
    if (editingEnvId && editingEnvId === activeEnvironmentId) {
      const updated = await api.getEnvVariables(editingEnvId);
      setVariables(updated);
    }
  };

  const deleteVariable = async (id: string) => {
    await api.deleteEnvVariable(id);
    setEnvVars((prev) => prev.filter((v) => v.id !== id));
    if (editingEnvId && editingEnvId === activeEnvironmentId) {
      const updated = await api.getEnvVariables(editingEnvId);
      setVariables(updated);
    }
  };

  const handleClose = () => {
    // Refresh active env variables on close
    if (activeEnvironmentId) {
      api.getEnvVariables(activeEnvironmentId).then(setVariables).catch(console.error);
    }
    onClose();
  };

  return (
    <div className={styles.overlay} onClick={handleClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h3 className={styles.title}>환경 관리</h3>
          <button className={styles.closeBtn} onClick={handleClose}>&times;</button>
        </div>

        <div className={styles.envDescription}>
          변수를 정의하면 URL, 헤더, Body에서 {"{{변수명}}"} 형식으로 사용할 수 있습니다
        </div>

        <div className={styles.body}>
          {/* Environment list */}
          <div className={styles.envList}>
            <div className={styles.envListHeader}>
              <span className={styles.label}>환경</span>
              <button className={styles.addEnvBtn} onClick={createEnvironment}>+ 추가</button>
            </div>
            {environments.map((env) => (
              <div
                key={env.id}
                className={`${styles.envItem} ${editingEnvId === env.id ? styles.envItemActive : ""}`}
                onClick={() => setEditingEnvId(env.id)}
              >
                <span className={styles.envName}>{env.name}</span>
                <button
                  className={styles.envDeleteBtn}
                  onClick={(e) => { e.stopPropagation(); deleteEnvironment(env.id); }}
                >
                  &times;
                </button>
              </div>
            ))}
            {environments.length === 0 && (
              <div className={styles.emptyMsg}>환경이 없습니다</div>
            )}
          </div>

          {/* Variables editor */}
          <div className={styles.varEditor}>
            {editingEnvId ? (
              <>
                <div className={styles.varHeader}>
                  <span className={styles.label}>변수</span>
                  <button className={styles.addVarBtn} onClick={addVariable}>+ 변수 추가</button>
                </div>
                {envVars.length === 0 ? (
                  <div className={styles.emptyMsg}>변수가 없습니다</div>
                ) : (
                  <div className={styles.varList}>
                    <div className={styles.varRow}>
                      <span className={styles.colLabel}>키</span>
                      <span className={styles.colLabel}>값</span>
                      <span />
                    </div>
                    {envVars.map((v) => (
                      <div key={v.id} className={styles.varRow}>
                        <input
                          className={styles.varInput}
                          value={v.key}
                          placeholder="변수명"
                          onChange={(e) => {
                            const updated = { ...v, key: e.target.value };
                            setEnvVars((prev) => prev.map((x) => x.id === v.id ? updated : x));
                          }}
                          onBlur={() => updateVariable({ ...v, key: envVars.find((x) => x.id === v.id)?.key ?? v.key, value: envVars.find((x) => x.id === v.id)?.value ?? v.value })}
                        />
                        <input
                          className={styles.varInput}
                          value={v.value}
                          placeholder="값"
                          type={v.is_secret ? "password" : "text"}
                          onChange={(e) => {
                            const updated = { ...v, value: e.target.value };
                            setEnvVars((prev) => prev.map((x) => x.id === v.id ? updated : x));
                          }}
                          onBlur={() => updateVariable(envVars.find((x) => x.id === v.id) ?? v)}
                        />
                        <button className={styles.varDeleteBtn} onClick={() => deleteVariable(v.id)}>
                          &times;
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className={styles.emptyMsg}>환경을 선택하세요</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
