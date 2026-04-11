import type { HttpMethod, AuthType, BodyType } from "@/types";

export const METHOD_HELP: Record<HttpMethod, string> = {
  GET: "서버에서 데이터를 조회합니다 (가장 흔한 요청)",
  POST: "서버에 새 데이터를 전송합니다 (생성)",
  PUT: "기존 데이터를 전체 교체합니다 (수정)",
  DELETE: "데이터를 삭제합니다",
  PATCH: "기존 데이터를 부분 수정합니다",
  HEAD: "GET과 같지만 본문 없이 헤더만 받습니다",
  OPTIONS: "서버가 지원하는 메서드를 확인합니다 (CORS 프리플라이트)",
};

export const AUTH_HELP: Record<AuthType, { title: string; description: string; example?: string }> = {
  none: {
    title: "인증 없음",
    description: "인증이 비활성화되어 있습니다",
  },
  bearer: {
    title: "Bearer Token 인증",
    description: "API 제공자에게 받은 토큰을 그대로 붙여넣으세요.\nAuthorization: Bearer {토큰} 헤더가 자동으로 추가됩니다.",
    example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  },
  basic: {
    title: "Basic Auth 인증",
    description: "서버에 로그인할 때 사용하는 아이디/비밀번호를 입력하세요.\nBase64로 자동 인코딩되어 전송됩니다.",
  },
  apikey: {
    title: "API Key 인증",
    description: "API 제공자가 알려준 키 이름과 값을 입력하세요.\n키 이름 기본값: X-API-Key",
  },
};

export const BODY_TYPE_HELP: Record<BodyType, string> = {
  json: "가장 일반적인 API 데이터 형식입니다 (Content-Type: application/json)",
  form: "파일 업로드나 폼 데이터 전송에 사용됩니다",
  raw: "텍스트, XML 등을 직접 입력합니다",
  binary: "파일을 직접 전송할 때 사용됩니다",
};

export const TAB_HELP = {
  params: "URL 뒤 ?key=value 형태로 추가되는 쿼리 파라미터입니다",
  headers: "서버에 추가 정보를 전달하는 HTTP 헤더입니다 (인증, 형식 등)",
  body: "POST/PUT 요청 시 서버에 보낼 데이터입니다",
  auth: "API 접근 권한을 증명하는 인증 정보입니다",
};

export const BODY_NO_BODY_METHODS: HttpMethod[] = ["GET", "HEAD", "OPTIONS"];

export const COMMON_HEADER_SUGGESTIONS = [
  "Accept",
  "Authorization",
  "Content-Type",
  "Cache-Control",
  "User-Agent",
  "X-API-Key",
  "X-Request-ID",
  "X-Custom-Header",
];

export const CONTENT_TYPE_MAP: Record<string, string> = {
  json: "application/json",
  form: "application/x-www-form-urlencoded",
  binary: "application/octet-stream",
};
