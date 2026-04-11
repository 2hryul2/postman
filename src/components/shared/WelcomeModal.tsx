import { useState } from "react";
import { generateSampleCollections } from "@/lib/templates";
import { useUIStore } from "@/stores/useUIStore";
import styles from "./WelcomeModal.module.css";

const STEPS = [
  {
    title: "HiveAPI에 오신 것을 환영합니다",
    content:
      "HiveAPI는 REST API 테스트를 위한 데스크탑 도구입니다.\n폐쇄망(오프라인) 환경에서도 사용할 수 있습니다.",
  },
  {
    title: "이렇게 사용하세요",
    content:
      "1. URL 입력창에 API 주소를 입력합니다\n2. HTTP 메서드(GET, POST 등)를 선택합니다\n3. 전송 버튼(Ctrl+Enter)을 누릅니다\n4. 응답이 하단에 표시됩니다",
  },
  {
    title: "시작하기",
    content: "아래에서 시작 방법을 선택하세요.",
  },
];

export function WelcomeModal() {
  const [step, setStep] = useState(0);
  const [generating, setGenerating] = useState(false);
  const setWelcomeOpen = useUIStore((s) => s.setWelcomeOpen);

  const close = () => {
    localStorage.setItem("hiveapi_welcomed", "1");
    setWelcomeOpen(false);
  };

  const handleSamples = async () => {
    setGenerating(true);
    try {
      await generateSampleCollections();
      close();
    } finally {
      setGenerating(false);
    }
  };

  const current = STEPS[step];

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.stepIndicator}>
          {STEPS.map((_, i) => (
            <span
              key={i}
              className={`${styles.dot} ${i === step ? styles.dotActive : ""}`}
            />
          ))}
        </div>

        <h2 className={styles.title}>{current.title}</h2>
        <p className={styles.content}>{current.content}</p>

        {step === STEPS.length - 1 ? (
          <div className={styles.startActions}>
            <button
              className={styles.primaryBtn}
              onClick={handleSamples}
              disabled={generating}
            >
              {generating ? "생성 중..." : "샘플 컬렉션으로 시작"}
            </button>
            <button className={styles.secondaryBtn} onClick={close}>
              직접 시작하기
            </button>
          </div>
        ) : (
          <div className={styles.navActions}>
            {step > 0 && (
              <button className={styles.secondaryBtn} onClick={() => setStep(step - 1)}>
                이전
              </button>
            )}
            <button className={styles.primaryBtn} onClick={() => setStep(step + 1)}>
              다음
            </button>
            <button className={styles.skipBtn} onClick={close}>
              건너뛰기
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
