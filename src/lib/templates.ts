import type { HttpMethod, BodyType, AuthType, KeyValuePair } from "@/types";
import { generateId } from "@/lib/uuid";
import { api } from "@/lib/tauri";
import { useCollectionStore } from "@/stores/useCollectionStore";
import { useEnvironmentStore } from "@/stores/useEnvironmentStore";
import { useRequestStore } from "@/stores/useRequestStore";

// --- Template Types ---

export interface RequestTemplate {
  name: string;
  method: HttpMethod;
  url: string;
  headers?: KeyValuePair[];
  params?: KeyValuePair[];
  bodyType?: BodyType;
  body?: string;
  authType?: AuthType;
  authConfig?: Record<string, string>;
}

interface CollectionTemplate {
  name: string;
  requests: RequestTemplate[];
}

// --- Apply Template to Request Store ---

export function applyTemplate(template: RequestTemplate) {
  const store = useRequestStore.getState();
  store.setMethod(template.method);
  store.setUrl(template.url);
  store.setHeaders(template.headers ?? []);
  store.setParams(template.params ?? []);
  store.setBodyType(template.bodyType ?? "json");
  store.setBody(template.body ?? "");
  store.setAuthType(template.authType ?? "none");
  store.setAuthConfig(template.authConfig ?? {});
}

// --- Quick Start Templates ---

export const QUICK_START_GET: RequestTemplate = {
  name: "GET 체험",
  method: "GET",
  url: "https://jsonplaceholder.typicode.com/posts/1",
  headers: [{ key: "Accept", value: "application/json", enabled: true }],
};

export const QUICK_START_POST: RequestTemplate = {
  name: "POST 체험",
  method: "POST",
  url: "https://jsonplaceholder.typicode.com/posts",
  headers: [{ key: "Content-Type", value: "application/json", enabled: true }],
  bodyType: "json",
  body: JSON.stringify(
    { title: "테스트 제목", body: "테스트 내용입니다", userId: 1 },
    null,
    2,
  ),
};

// --- Sample Collections ---

const REST_BASICS: CollectionTemplate = {
  name: "REST API 기초",
  requests: [
    {
      name: "게시물 목록 조회 (GET)",
      method: "GET",
      url: "https://jsonplaceholder.typicode.com/posts",
      headers: [{ key: "Accept", value: "application/json", enabled: true }],
    },
    {
      name: "게시물 상세 조회 (GET)",
      method: "GET",
      url: "https://jsonplaceholder.typicode.com/posts/1",
      headers: [{ key: "Accept", value: "application/json", enabled: true }],
    },
    {
      name: "쿼리 파라미터 필터링 (GET)",
      method: "GET",
      url: "https://jsonplaceholder.typicode.com/posts",
      headers: [{ key: "Accept", value: "application/json", enabled: true }],
      params: [{ key: "userId", value: "1", enabled: true }],
    },
    {
      name: "게시물 생성 (POST)",
      method: "POST",
      url: "https://jsonplaceholder.typicode.com/posts",
      headers: [{ key: "Content-Type", value: "application/json", enabled: true }],
      bodyType: "json",
      body: JSON.stringify(
        { title: "새 게시물", body: "내용입니다", userId: 1 },
        null,
        2,
      ),
    },
    {
      name: "게시물 수정 (PUT)",
      method: "PUT",
      url: "https://jsonplaceholder.typicode.com/posts/1",
      headers: [{ key: "Content-Type", value: "application/json", enabled: true }],
      bodyType: "json",
      body: JSON.stringify(
        { id: 1, title: "수정된 제목", body: "수정된 내용", userId: 1 },
        null,
        2,
      ),
    },
    {
      name: "게시물 부분 수정 (PATCH)",
      method: "PATCH",
      url: "https://jsonplaceholder.typicode.com/posts/1",
      headers: [{ key: "Content-Type", value: "application/json", enabled: true }],
      bodyType: "json",
      body: JSON.stringify({ title: "부분 수정" }, null, 2),
    },
    {
      name: "게시물 삭제 (DELETE)",
      method: "DELETE",
      url: "https://jsonplaceholder.typicode.com/posts/1",
      headers: [{ key: "Accept", value: "application/json", enabled: true }],
    },
  ],
};

const AUTH_EXAMPLES: CollectionTemplate = {
  name: "인증 방식 예제",
  requests: [
    {
      name: "Bearer Token 인증",
      method: "GET",
      url: "https://httpbin.org/bearer",
      authType: "bearer",
      authConfig: { token: "your-token-here" },
    },
    {
      name: "Basic Auth 인증",
      method: "GET",
      url: "https://httpbin.org/basic-auth/user/passwd",
      authType: "basic",
      authConfig: { username: "user", password: "passwd" },
    },
    {
      name: "API Key (헤더)",
      method: "GET",
      url: "https://httpbin.org/headers",
      authType: "apikey",
      authConfig: { keyName: "X-API-Key", keyValue: "demo-key-12345", addTo: "header" },
    },
    {
      name: "API Key (쿼리 파라미터)",
      method: "GET",
      url: "https://httpbin.org/get",
      authType: "apikey",
      authConfig: { keyName: "api_key", keyValue: "demo-key-12345", addTo: "query" },
    },
    {
      name: "커스텀 헤더",
      method: "GET",
      url: "https://httpbin.org/headers",
      headers: [
        { key: "Accept", value: "application/json", enabled: true },
        { key: "X-Custom-Header", value: "HiveAPI-Test", enabled: true },
        { key: "X-Request-ID", value: "req-001", enabled: true },
      ],
    },
  ],
};

const OPENAI_API: CollectionTemplate = {
  name: "OpenAI API 사용법",
  requests: [
    {
      name: "채팅 완성 (기본)",
      method: "POST",
      url: "https://api.openai.com/v1/chat/completions",
      headers: [
        { key: "Content-Type", value: "application/json", enabled: true },
        { key: "Authorization", value: "Bearer {{OPENAI_API_KEY}}", enabled: true },
      ],
      bodyType: "json",
      body: JSON.stringify(
        {
          model: "gpt-4o-mini",
          messages: [
            { role: "user", content: "안녕하세요! 간단히 자기소개 해주세요." },
          ],
          max_tokens: 200,
        },
        null,
        2,
      ),
    },
    {
      name: "채팅 완성 (시스템 프롬프트)",
      method: "POST",
      url: "https://api.openai.com/v1/chat/completions",
      headers: [
        { key: "Content-Type", value: "application/json", enabled: true },
        { key: "Authorization", value: "Bearer {{OPENAI_API_KEY}}", enabled: true },
      ],
      bodyType: "json",
      body: JSON.stringify(
        {
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content: "당신은 친절한 한국어 AI 비서입니다. 간결하게 답변합니다.",
            },
            { role: "user", content: "REST API가 뭔가요?" },
          ],
          max_tokens: 300,
          temperature: 0.7,
        },
        null,
        2,
      ),
    },
    {
      name: "모델 목록 조회",
      method: "GET",
      url: "https://api.openai.com/v1/models",
      headers: [
        { key: "Authorization", value: "Bearer {{OPENAI_API_KEY}}", enabled: true },
      ],
    },
    {
      name: "특정 모델 정보",
      method: "GET",
      url: "https://api.openai.com/v1/models/gpt-4o",
      headers: [
        { key: "Authorization", value: "Bearer {{OPENAI_API_KEY}}", enabled: true },
      ],
    },
    {
      name: "임베딩 생성",
      method: "POST",
      url: "https://api.openai.com/v1/embeddings",
      headers: [
        { key: "Content-Type", value: "application/json", enabled: true },
        { key: "Authorization", value: "Bearer {{OPENAI_API_KEY}}", enabled: true },
      ],
      bodyType: "json",
      body: JSON.stringify(
        {
          model: "text-embedding-3-small",
          input: "HiveAPI는 폐쇄망용 API 클라이언트입니다",
        },
        null,
        2,
      ),
    },
    {
      name: "이미지 생성 (DALL-E)",
      method: "POST",
      url: "https://api.openai.com/v1/images/generations",
      headers: [
        { key: "Content-Type", value: "application/json", enabled: true },
        { key: "Authorization", value: "Bearer {{OPENAI_API_KEY}}", enabled: true },
      ],
      bodyType: "json",
      body: JSON.stringify(
        {
          model: "dall-e-3",
          prompt: "A cute robot holding a beehive, digital art style",
          n: 1,
          size: "1024x1024",
        },
        null,
        2,
      ),
    },
  ],
};

const CLAUDE_API: CollectionTemplate = {
  name: "Claude API 사용법",
  requests: [
    {
      name: "메시지 생성 (기본)",
      method: "POST",
      url: "https://api.anthropic.com/v1/messages",
      headers: [
        { key: "Content-Type", value: "application/json", enabled: true },
        { key: "x-api-key", value: "{{CLAUDE_API_KEY}}", enabled: true },
        { key: "anthropic-version", value: "2023-06-01", enabled: true },
      ],
      bodyType: "json",
      body: JSON.stringify(
        {
          model: "claude-sonnet-4-20250514",
          max_tokens: 1024,
          messages: [
            { role: "user", content: "안녕하세요! 간단히 자기소개 해주세요." },
          ],
        },
        null,
        2,
      ),
    },
    {
      name: "메시지 생성 (시스템 프롬프트)",
      method: "POST",
      url: "https://api.anthropic.com/v1/messages",
      headers: [
        { key: "Content-Type", value: "application/json", enabled: true },
        { key: "x-api-key", value: "{{CLAUDE_API_KEY}}", enabled: true },
        { key: "anthropic-version", value: "2023-06-01", enabled: true },
      ],
      bodyType: "json",
      body: JSON.stringify(
        {
          model: "claude-sonnet-4-20250514",
          max_tokens: 1024,
          system: "당신은 친절한 한국어 AI 비서입니다. 간결하게 답변합니다.",
          messages: [
            { role: "user", content: "REST API가 뭔가요?" },
          ],
        },
        null,
        2,
      ),
    },
    {
      name: "멀티턴 대화",
      method: "POST",
      url: "https://api.anthropic.com/v1/messages",
      headers: [
        { key: "Content-Type", value: "application/json", enabled: true },
        { key: "x-api-key", value: "{{CLAUDE_API_KEY}}", enabled: true },
        { key: "anthropic-version", value: "2023-06-01", enabled: true },
      ],
      bodyType: "json",
      body: JSON.stringify(
        {
          model: "claude-sonnet-4-20250514",
          max_tokens: 1024,
          messages: [
            { role: "user", content: "HTTP 상태코드 200은 뭔가요?" },
            { role: "assistant", content: "HTTP 200은 요청이 성공했다는 의미입니다." },
            { role: "user", content: "그러면 404는요?" },
          ],
        },
        null,
        2,
      ),
    },
    {
      name: "Temperature/Top-P 조절",
      method: "POST",
      url: "https://api.anthropic.com/v1/messages",
      headers: [
        { key: "Content-Type", value: "application/json", enabled: true },
        { key: "x-api-key", value: "{{CLAUDE_API_KEY}}", enabled: true },
        { key: "anthropic-version", value: "2023-06-01", enabled: true },
      ],
      bodyType: "json",
      body: JSON.stringify(
        {
          model: "claude-sonnet-4-20250514",
          max_tokens: 512,
          temperature: 0.9,
          top_p: 0.95,
          messages: [
            { role: "user", content: "재미있는 프로그래밍 농담 하나 해주세요." },
          ],
        },
        null,
        2,
      ),
    },
    {
      name: "Claude Haiku (경량 모델)",
      method: "POST",
      url: "https://api.anthropic.com/v1/messages",
      headers: [
        { key: "Content-Type", value: "application/json", enabled: true },
        { key: "x-api-key", value: "{{CLAUDE_API_KEY}}", enabled: true },
        { key: "anthropic-version", value: "2023-06-01", enabled: true },
      ],
      bodyType: "json",
      body: JSON.stringify(
        {
          model: "claude-haiku-4-20250514",
          max_tokens: 256,
          messages: [
            { role: "user", content: "1+1은?" },
          ],
        },
        null,
        2,
      ),
    },
    {
      name: "Claude Opus (최상위 모델)",
      method: "POST",
      url: "https://api.anthropic.com/v1/messages",
      headers: [
        { key: "Content-Type", value: "application/json", enabled: true },
        { key: "x-api-key", value: "{{CLAUDE_API_KEY}}", enabled: true },
        { key: "anthropic-version", value: "2023-06-01", enabled: true },
      ],
      bodyType: "json",
      body: JSON.stringify(
        {
          model: "claude-opus-4-20250514",
          max_tokens: 2048,
          messages: [
            { role: "user", content: "Python으로 퀵소트 알고리즘을 구현하고 설명해주세요." },
          ],
        },
        null,
        2,
      ),
    },
  ],
};

const GOOGLE_API: CollectionTemplate = {
  name: "Google API 사용법",
  requests: [
    {
      name: "YouTube 동영상 검색",
      method: "GET",
      url: "https://www.googleapis.com/youtube/v3/search",
      headers: [
        { key: "Accept", value: "application/json", enabled: true },
      ],
      params: [
        { key: "key", value: "{{GOOGLE_API_KEY}}", enabled: true },
        { key: "part", value: "snippet", enabled: true },
        { key: "q", value: "REST API 튜토리얼", enabled: true },
        { key: "type", value: "video", enabled: true },
        { key: "maxResults", value: "5", enabled: true },
      ],
    },
    {
      name: "YouTube 동영상 상세 정보",
      method: "GET",
      url: "https://www.googleapis.com/youtube/v3/videos",
      headers: [
        { key: "Accept", value: "application/json", enabled: true },
      ],
      params: [
        { key: "key", value: "{{GOOGLE_API_KEY}}", enabled: true },
        { key: "part", value: "snippet,statistics,contentDetails", enabled: true },
        { key: "id", value: "dQw4w9WgXcQ", enabled: true },
      ],
    },
    {
      name: "YouTube 채널 정보",
      method: "GET",
      url: "https://www.googleapis.com/youtube/v3/channels",
      headers: [
        { key: "Accept", value: "application/json", enabled: true },
      ],
      params: [
        { key: "key", value: "{{GOOGLE_API_KEY}}", enabled: true },
        { key: "part", value: "snippet,statistics", enabled: true },
        { key: "forUsername", value: "Google", enabled: true },
      ],
    },
    {
      name: "Google Books 도서 검색",
      method: "GET",
      url: "https://www.googleapis.com/books/v1/volumes",
      headers: [
        { key: "Accept", value: "application/json", enabled: true },
      ],
      params: [
        { key: "q", value: "python programming", enabled: true },
        { key: "maxResults", value: "5", enabled: true },
        { key: "langRestrict", value: "ko", enabled: true },
      ],
    },
    {
      name: "Google Geocoding (주소 → 좌표)",
      method: "GET",
      url: "https://maps.googleapis.com/maps/api/geocode/json",
      headers: [
        { key: "Accept", value: "application/json", enabled: true },
      ],
      params: [
        { key: "key", value: "{{GOOGLE_API_KEY}}", enabled: true },
        { key: "address", value: "서울특별시 강남구 테헤란로 152", enabled: true },
        { key: "language", value: "ko", enabled: true },
      ],
    },
    {
      name: "Google Geocoding (좌표 → 주소)",
      method: "GET",
      url: "https://maps.googleapis.com/maps/api/geocode/json",
      headers: [
        { key: "Accept", value: "application/json", enabled: true },
      ],
      params: [
        { key: "key", value: "{{GOOGLE_API_KEY}}", enabled: true },
        { key: "latlng", value: "37.5000,127.0365", enabled: true },
        { key: "language", value: "ko", enabled: true },
      ],
    },
    {
      name: "Google Translate (번역)",
      method: "POST",
      url: "https://translation.googleapis.com/language/translate/v2",
      headers: [
        { key: "Content-Type", value: "application/json", enabled: true },
      ],
      params: [
        { key: "key", value: "{{GOOGLE_API_KEY}}", enabled: true },
      ],
      bodyType: "json",
      body: JSON.stringify(
        {
          q: "Hello, how are you?",
          source: "en",
          target: "ko",
          format: "text",
        },
        null,
        2,
      ),
    },
    {
      name: "Google Custom Search (웹 검색)",
      method: "GET",
      url: "https://www.googleapis.com/customsearch/v1",
      headers: [
        { key: "Accept", value: "application/json", enabled: true },
      ],
      params: [
        { key: "key", value: "{{GOOGLE_API_KEY}}", enabled: true },
        { key: "cx", value: "여기에_검색엔진ID_입력", enabled: true },
        { key: "q", value: "HiveAPI", enabled: true },
        { key: "num", value: "5", enabled: true },
      ],
    },
  ],
};

const ALL_SAMPLE_COLLECTIONS: CollectionTemplate[] = [
  REST_BASICS,
  AUTH_EXAMPLES,
  OPENAI_API,
  CLAUDE_API,
  GOOGLE_API,
];

// --- Generate Sample Collections ---

export async function generateSampleCollections() {
  const collectionStore = useCollectionStore.getState();
  const envStore = useEnvironmentStore.getState();

  // 1. Create "AI API Keys" environment with OPENAI_API_KEY + CLAUDE_API_KEY
  const envId = generateId();
  await api.saveEnvironment({ id: envId, name: "AI API Keys" });
  await api.saveEnvVariable({
    id: generateId(),
    environment_id: envId,
    key: "OPENAI_API_KEY",
    value: "sk-여기에_OpenAI_API키를_입력하세요",
    is_secret: true,
  });
  await api.saveEnvVariable({
    id: generateId(),
    environment_id: envId,
    key: "CLAUDE_API_KEY",
    value: "sk-ant-여기에_Claude_API키를_입력하세요",
    is_secret: true,
  });
  await api.saveEnvVariable({
    id: generateId(),
    environment_id: envId,
    key: "GOOGLE_API_KEY",
    value: "AIza여기에_Google_API키를_입력하세요",
    is_secret: true,
  });

  // Refresh environments and activate
  const envs = await api.getEnvironments();
  envStore.setEnvironments(envs);
  envStore.setActiveEnvironmentId(envId);
  const vars = await api.getEnvVariables(envId);
  envStore.setVariables(vars);

  // 2. Create collections with requests
  let firstCollectionId: string | null = null;

  for (const colTemplate of ALL_SAMPLE_COLLECTIONS) {
    const colId = generateId();
    if (!firstCollectionId) firstCollectionId = colId;

    await api.saveCollection({
      id: colId,
      name: colTemplate.name,
      parent_id: null,
      sort_order: 0,
      created_at: null,
    });

    for (let i = 0; i < colTemplate.requests.length; i++) {
      const req = colTemplate.requests[i];
      await api.saveRequest({
        id: generateId(),
        collection_id: colId,
        name: req.name,
        method: req.method,
        url: req.url,
        headers: req.headers ? JSON.stringify(req.headers) : null,
        params: req.params ? JSON.stringify(req.params) : null,
        body_type: req.bodyType ?? null,
        body: req.body ?? null,
        auth_type: req.authType ?? null,
        auth_config: req.authConfig ? JSON.stringify(req.authConfig) : null,
        sort_order: i,
        created_at: null,
        updated_at: null,
      });
    }
  }

  // 3. Refresh collections
  const collections = await api.getCollections();
  collectionStore.setCollections(collections);

  // 4. Load first collection's requests
  if (firstCollectionId) {
    const reqs = await api.getRequests(firstCollectionId);
    collectionStore.setRequests(reqs);
    collectionStore.setActiveCollectionId(firstCollectionId);
    if (reqs.length > 0) {
      collectionStore.setActiveRequestId(reqs[0].id);
    }
  }
}
