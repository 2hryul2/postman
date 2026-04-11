interface FriendlyError {
  message: string;
  suggestion: string;
}

const ERROR_PATTERNS: Array<{ patterns: string[]; error: FriendlyError }> = [
  {
    patterns: ["dns error", "dns resolve", "failed to lookup", "no such host"],
    error: {
      message: "서버를 찾을 수 없습니다",
      suggestion: "URL의 도메인이 올바른지 확인하세요",
    },
  },
  {
    patterns: ["connection refused"],
    error: {
      message: "서버 연결이 거부되었습니다",
      suggestion: "서버가 실행 중인지, 포트가 맞는지 확인하세요",
    },
  },
  {
    patterns: ["timed out", "timeout", "deadline has elapsed"],
    error: {
      message: "요청 시간이 초과되었습니다",
      suggestion: "서버가 응답하지 않습니다. 네트워크 연결을 확인하세요",
    },
  },
  {
    patterns: ["certificate", "ssl", "tls", "handshake"],
    error: {
      message: "SSL/TLS 인증서 오류",
      suggestion: "자체 서명 인증서를 사용하는 서버일 수 있습니다",
    },
  },
  {
    patterns: ["connection reset", "connection closed", "broken pipe"],
    error: {
      message: "연결이 끊어졌습니다",
      suggestion: "서버가 연결을 종료했습니다. 잠시 후 재시도하세요",
    },
  },
  {
    patterns: ["invalid url", "url parse", "relative url without a base"],
    error: {
      message: "잘못된 URL 형식입니다",
      suggestion: "http:// 또는 https://로 시작하는 전체 주소를 입력하세요",
    },
  },
  {
    patterns: ["network", "unreachable"],
    error: {
      message: "네트워크에 연결할 수 없습니다",
      suggestion: "인터넷 연결 상태를 확인하세요",
    },
  },
];

export function friendlyError(raw: string): FriendlyError {
  const lower = raw.toLowerCase();
  for (const { patterns, error } of ERROR_PATTERNS) {
    if (patterns.some((p) => lower.includes(p))) {
      return error;
    }
  }
  return {
    message: "요청 중 오류가 발생했습니다",
    suggestion: "URL과 설정을 확인한 후 다시 시도하세요",
  };
}
