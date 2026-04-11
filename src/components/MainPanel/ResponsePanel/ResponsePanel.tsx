import { useState, useMemo } from "react";
import { useResponseStore } from "@/stores/useResponseStore";
import { useRequestStore } from "@/stores/useRequestStore";
import { getStatusCategory, STATUS_COLORS } from "@/lib/constants";
import { getStatusDescription } from "@/lib/httpStatusCodes";
import { friendlyError } from "@/lib/errorMessages";
import { generateCode } from "@/lib/codeGenerator";
import type { CodeLang } from "@/lib/codeGenerator";
import { applyTemplate, generateSampleCollections, QUICK_START_GET, QUICK_START_POST } from "@/lib/templates";
import styles from "./ResponsePanel.module.css";

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function tryFormatJson(text: string): string {
  try {
    return JSON.stringify(JSON.parse(text), null, 2);
  } catch {
    return text;
  }
}

type RespTab = "pretty" | "raw" | "headers" | "code-curl" | "code-python" | "code-java" | "code-csharp";

const TAB_LABELS: Record<RespTab, string> = {
  pretty: "Pretty",
  raw: "Raw",
  headers: "헤더",
  "code-curl": "cURL",
  "code-python": "Python",
  "code-java": "Java",
  "code-csharp": "C#",
};

const CODE_LANG_MAP: Partial<Record<RespTab, CodeLang>> = {
  "code-curl": "curl",
  "code-python": "python",
  "code-java": "java",
  "code-csharp": "csharp",
};

const ALL_TABS: RespTab[] = ["pretty", "raw", "headers", "code-curl", "code-python", "code-java", "code-csharp"];

export function ResponsePanel() {
  const { response, isLoading, error } = useResponseStore();
  const reqState = useRequestStore();
  const [activeTab, setActiveTab] = useState<RespTab>("pretty");
  const [generating, setGenerating] = useState(false);
  const [errorExpanded, setErrorExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  // Generate code from current request state
  const codeLang = CODE_LANG_MAP[activeTab];
  const generatedCode = useMemo(() => {
    if (!codeLang) return "";
    return generateCode(codeLang, {
      method: reqState.method,
      url: reqState.url,
      headers: reqState.headers,
      params: reqState.params,
      body: reqState.body,
      bodyType: reqState.bodyType,
      authType: reqState.authType,
      authConfig: reqState.authConfig,
    });
  }, [codeLang, reqState.method, reqState.url, reqState.headers, reqState.params, reqState.body, reqState.bodyType, reqState.authType, reqState.authConfig]);

  const handleCopy = async () => {
    if (!generatedCode) return;
    await navigator.clipboard.writeText(generatedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  if (isLoading) {
    return (
      <div className={styles.panel}>
        <div className={styles.placeholder}>요청 전송 중...</div>
      </div>
    );
  }

  if (error) {
    const friendly = friendlyError(error);
    return (
      <div className={styles.panel}>
        <div className={styles.errorContainer}>
          <div className={styles.errorMessage}>{friendly.message}</div>
          <div className={styles.errorSuggestion}>{friendly.suggestion}</div>
          <button
            className={styles.errorToggle}
            onClick={() => setErrorExpanded(!errorExpanded)}
          >
            {errorExpanded ? "상세 숨기기" : "원본 오류 보기"}
          </button>
          {errorExpanded && <pre className={styles.errorRaw}>{error}</pre>}
        </div>
      </div>
    );
  }

  if (!response) {
    const handleGenerate = async () => {
      setGenerating(true);
      try {
        await generateSampleCollections();
      } finally {
        setGenerating(false);
      }
    };

    return (
      <div className={styles.panel}>
        <div className={styles.welcomeCard}>
          <div className={styles.welcomeTitle}>API를 처음 사용하시나요?</div>

          <div className={styles.welcomeSection}>
            <button
              className={styles.welcomePrimary}
              onClick={handleGenerate}
              disabled={generating}
            >
              {generating ? "생성 중..." : "샘플 컬렉션 자동 생성"}
            </button>
            <div className={styles.welcomeHint}>
              REST 기초 + 인증 + OpenAI + Claude + Google API 예제 포함
            </div>
          </div>

          <div className={styles.welcomeSection}>
            <div className={styles.welcomeSubtitle}>직접 시작하기</div>
            <div className={styles.welcomeActions}>
              <button
                className={styles.welcomeBtn}
                onClick={() => applyTemplate(QUICK_START_GET)}
              >
                GET 체험
              </button>
              <button
                className={styles.welcomeBtn}
                onClick={() => applyTemplate(QUICK_START_POST)}
              >
                POST 체험
              </button>
            </div>
          </div>

          <div className={styles.welcomeGuide}>
            URL 입력 후 전송(Ctrl+Enter)을 누르세요
          </div>
        </div>
      </div>
    );
  }

  const category = getStatusCategory(response.status);
  const colors = STATUS_COLORS[category] ?? STATUS_COLORS["5xx"];
  const statusDesc = getStatusDescription(response.status);
  const isCodeTab = activeTab.startsWith("code-");

  return (
    <div className={styles.panel}>
      <div className={styles.statusBar}>
        <span
          className={styles.statusPill}
          style={{ background: colors.bg, color: colors.text }}
        >
          {response.status} {response.status_text}
        </span>
        {statusDesc && (
          <span className={styles.statusDesc}>{statusDesc}</span>
        )}
        <span className={styles.meta}>{response.time_ms}ms</span>
        <span className={styles.meta}>{formatSize(response.size_bytes)}</span>
        <div className={styles.respTabs}>
          {ALL_TABS.map((tab) => (
            <button
              key={tab}
              className={`${styles.respTab} ${activeTab === tab ? styles.respTabActive : ""} ${tab.startsWith("code-") ? styles.codeTab : ""}`}
              onClick={() => setActiveTab(tab)}
            >
              {TAB_LABELS[tab]}
            </button>
          ))}
        </div>
      </div>
      <div className={styles.bodyArea}>
        {activeTab === "pretty" && (
          <pre className={styles.body}>{tryFormatJson(response.body)}</pre>
        )}
        {activeTab === "raw" && (
          <pre className={styles.body}>{response.body}</pre>
        )}
        {activeTab === "headers" && (
          <div className={styles.headerList}>
            {Object.entries(response.headers).map(([k, v]) => (
              <div key={k} className={styles.headerItem}>
                <span className={styles.headerKey}>{k}</span>
                <span className={styles.headerValue}>{v}</span>
              </div>
            ))}
          </div>
        )}
        {isCodeTab && (
          <div className={styles.codeContainer}>
            <div className={styles.codeToolbar}>
              <span className={styles.codeLang}>{TAB_LABELS[activeTab]}</span>
              <button className={styles.copyBtn} onClick={handleCopy}>
                {copied ? "복사됨!" : "코드 복사"}
              </button>
            </div>
            <pre className={styles.codeBlock}>{generatedCode}</pre>
          </div>
        )}
      </div>
    </div>
  );
}
