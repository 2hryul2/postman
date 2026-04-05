# HiveAPI — AI 바이브 코딩 Ideation Document
> Generated: 2026-04-05 01:06:36  
> Purpose: AI-assisted vibe coding ideation · Offline-first Postman alternative for air-gapped networks

---

## 1. 프로젝트 개요 (Project Overview)

| 항목 | 내용 |
|------|------|
| 프로젝트명 | HiveAPI |
| 한줄 설명 | 완전 폐쇄망(air-gapped)에서 동작하는 Postman 대체 데스크탑 API 클라이언트 |
| 대상 사용자 | 폐쇄망 내부망 환경의 백엔드/프론트엔드 개발자, QA 엔지니어 |
| 타깃 OS | Windows 11 전용 |
| 핵심 제약 | 인터넷 연결 제로, 외부 CDN/클라우드 없음, 설치 후 완전 오프라인 동작 |
| 예상 개발 기간 | 2~4주 (MVP 기준) |

---

## 2. 기술 스택 (Tech Stack)

```
Frontend  : React 18 + TypeScript + Vite
Desktop   : Tauri v2 (Rust 백엔드)
HTTP 실행  : Rust reqwest crate (시스템 프록시 자동 감지 포함)
로컬 DB   : SQLite via rusqlite
상태관리   : Zustand
코드 에디터 : CodeMirror 6 (JSON / raw body 편집)
데이터 패칭 : TanStack Query
번들 방식  : 모든 에셋 로컬 번들 (CDN 의존성 없음)
배포 형태  : Windows .msi 설치 파일
빌드 출력  : {project-root}\dist\  /  설치파일: {project-root}\dist\setup\
```

### 폐쇄망 특화 결정 사항
- `npm install` 이후 모든 node_modules 오프라인 캐시 → 인터넷 없는 빌드 환경 지원
- Tauri 번들러가 Rust + WebView2(Windows 내장)를 사용 → Node.js 런타임 불필요
- 설치 파일 목표 크기: ~15MB 이하 (Electron 대비 약 10배 경량)
- 업데이트: 자동 업데이트 비활성화, `.msi` 수동 교체 절차 문서화

---

## 3. 핵심 기능 목록 (Feature List)

### 3.1 MVP 필수 기능 (Must-have)

| # | 기능 | 설명 |
|---|------|------|
| F01 | HTTP 요청 빌더 | GET / POST / PUT / DELETE / PATCH · 헤더, 쿼리파라미터, Body (JSON · form-data · raw) |
| F02 | 인증 지원 | Bearer Token · Basic Auth · API Key (header / query) |
| F03 | 컬렉션 관리 | 요청 그룹화, 폴더 계층, 드래그 정렬 |
| F04 | 환경변수 | `{{변수}}` 치환, 개발 / 스테이징 / 운영 환경 전환 |
| F05 | 응답 뷰어 | JSON 트리 + 구문 강조, 응답시간 · 크기 · 상태코드 표시, 원본 텍스트 탭 |
| F06 | 요청 히스토리 | 모든 요청 자동 저장, 검색 · 필터, 재실행 (SQLite 로컬 저장) |
| F07 | 가져오기/내보내기 | Postman Collection v2.1 호환 JSON 파일 입출력 (USB · 파일서버 공유 대응) |
| F08 | TLS 설정 | 자체서명 인증서 검증 무시 옵션 + 커스텀 CA 인증서 등록 (내부망 HTTPS 필수) |

### 3.2 2차 목표 기능 (Nice-to-have)

| # | 기능 | 설명 |
|---|------|------|
| F09 | 사전 요청 스크립트 | JavaScript 샌드박스 — 토큰 자동 주입, 응답 검증 스크립트 |
| F10 | 로컬 Mock 서버 | 로컬 포트에서 정적 목 응답 서빙 (백엔드 없이 프론트 개발 가능) |
| F11 | 응답 기록 비교 | 두 응답을 나란히 diff 비교 |
| F12 | 오프라인 업데이트 | .msi 파일 경로 지정 → 인-앱 업데이트 적용 |

---

## 4. UI 레이아웃 설계 (UI Layout Design)

### 4.1 전체 화면 구조

```
┌─────────────────────────────────────────────────────────────────┐
│ [●][●][●]  HiveAPI                               [타이틀바 38px] │
├──────────────┬──────────────────────────────────────────────────┤
│              │  [GET ▼] [URL 입력창 ──────────────────] [전송]   │
│  사이드바    ├──────────────────────────────────────────────────┤
│  220px       │  [파라미터] [헤더] [Body] [인증]  ← 요청 탭      │
│              │  ┌──────────────────────────────────────────┐    │
│  ┌────────┐  │  │ 파라미터 패널 (키/값 행 리스트)           │    │
│  │검색창  │  │  │                                          │    │
│  └────────┘  │  └──────────────────────────────────────────┘    │
│  [+ 새 요청] ├──────────────────────────────────────────────────┤
│              │  응답 영역 (하단 고정 분할, 약 40~60% 비율)       │
│  COLLECTIONS │  ┌─────────────────────────────────────────┐     │
│  ▼ 사용자API │  │ 상태: [200 OK] [142ms] [1.2KB]          │     │
│    GET  목록 │  │ JSON 응답 트리 (구문 강조)               │     │
│    POST 생성 │  │ {                                        │     │
│    PUT  수정 │  │   "data": [ ... ],                       │     │
│    DEL  삭제 │  │   "total": 42                            │     │
│  ▼ 인증API  │  │ }                                        │     │
│    POST 로그인│  └─────────────────────────────────────────┘     │
│  ▼ 상품API  │                                                    │
│              │                                                    │
├──────────────┴──────────────────────────────────────────────────┤
│ [●dev]  [환경: 개발(dev) ▼]              ← 환경변수 상태바       │
└─────────────────────────────────────────────────────────────────┘
```

### 4.2 레이아웃 치수 (px)

| 영역 | 크기 | 비고 |
|------|------|------|
| 타이틀바 | 높이 38px | Tauri 커스텀 윈도우 드래그 영역 |
| 사이드바 | 너비 220px | 최소 160px, 최대 320px (리사이즈 핸들) |
| URL 요청바 | 높이 52px | method select + url input + send button |
| 요청 탭바 | 높이 36px | 파라미터 / 헤더 / Body / 인증 |
| 응답 헤더 | 높이 34px | 상태코드 pill + 메타 정보 |
| 환경변수 바 | 높이 30px (사이드바 하단) | 현재 환경 항상 표시 |

### 4.3 사이드바 상세 구조

```
사이드바 (220px)
├── 검색창 [input]
├── [+ 새 요청] 버튼
├── ── COLLECTIONS 섹션 라벨 ──
├── ▼ 폴더명 (클릭으로 토글)
│   ├── [GET ] 요청명
│   ├── [POST] 요청명  ← active: 좌측 2px info 색상 보더
│   └── [DEL ] 요청명
└── ── 하단 고정 ──
    [●] [환경 선택 select ▼]   ← 환경변수 바
```

메서드 배지 색상 규칙:
- GET   → bg #e1f5ee / text #0f6e56 (teal)
- POST  → bg #e6f1fb / text #185fa5 (blue)
- PUT   → bg #faeeda / text #854f0b (amber)
- DELETE→ bg #fcebeb / text #a32d2d (red)
- PATCH → bg #fbeaf0 / text #993556 (pink)

### 4.4 메인 패널 탭 구조

```
[파라미터 탭]
  헤더행: 키 | 값 | (삭제)
  데이터행: input | input | [×]
  [+ 파라미터 추가]

[헤더 탭]
  동일 구조, Content-Type / Authorization 기본 행 포함

[Body 탭]
  타입 선택: JSON | form-data | raw | binary
  CodeMirror 6 에디터 (JSON 구문 강조, 자동완성)

[인증 탭]
  타입 select: Bearer / Basic / API Key / 없음
  타입에 따라 동적 입력 필드 표시
```

### 4.5 응답 패널

```
응답 헤더 바:
  [200 OK]pill  142ms · 1.2 KB  [JSON ▼]  [복사] [저장]

응답 탭:
  [본문] [헤더] [쿠키] [타이밍]

본문 영역:
  - Pretty (JSON 트리, 구문 강조)
  - Raw (monospace 텍스트)
  - Preview (HTML 렌더링)
```

---

## 5. 컴포넌트 트리 (Component Tree)

```
App
├── TitleBar                        # Tauri 커스텀 윈도우바
├── Sidebar
│   ├── SearchInput
│   ├── NewRequestButton
│   ├── CollectionList
│   │   └── CollectionFolder
│   │       └── RequestItem         # 메서드 배지 + 요청명
│   └── EnvSelector                 # 하단 고정, 환경변수 전환
└── MainPanel
    ├── RequestBar
    │   ├── MethodSelect
    │   ├── UrlInput                # {{변수}} mono 폰트 표시
    │   └── SendButton
    ├── RequestTabs
    │   ├── ParamsPanel             # 키/값 행 리스트
    │   ├── HeadersPanel
    │   ├── BodyPanel               # CodeMirror 6
    │   └── AuthPanel
    └── ResponsePanel
        ├── ResponseStatusBar       # 상태코드 pill + 메타
        └── ResponseViewer
            ├── PrettyView          # JSON 트리
            ├── RawView
            └── PreviewView
```

---

## 6. 데이터 모델 (Data Model — SQLite)

```sql
-- 컬렉션
CREATE TABLE collections (
  id        TEXT PRIMARY KEY,
  name      TEXT NOT NULL,
  parent_id TEXT,                   -- 폴더 계층 (NULL = 루트)
  sort_order INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 요청
CREATE TABLE requests (
  id            TEXT PRIMARY KEY,
  collection_id TEXT REFERENCES collections(id),
  name          TEXT NOT NULL,
  method        TEXT NOT NULL,      -- GET, POST, PUT, DELETE, PATCH
  url           TEXT NOT NULL,
  headers       TEXT,               -- JSON array [{key, value, enabled}]
  params        TEXT,               -- JSON array [{key, value, enabled}]
  body_type     TEXT,               -- json | form | raw | binary
  body          TEXT,
  auth_type     TEXT,               -- bearer | basic | apikey | none
  auth_config   TEXT,               -- JSON object
  sort_order    INTEGER DEFAULT 0,
  created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 환경변수
CREATE TABLE environments (
  id   TEXT PRIMARY KEY,
  name TEXT NOT NULL                -- 개발, 스테이징, 운영
);

CREATE TABLE env_variables (
  id             TEXT PRIMARY KEY,
  environment_id TEXT REFERENCES environments(id),
  key            TEXT NOT NULL,
  value          TEXT NOT NULL,
  is_secret      INTEGER DEFAULT 0  -- 1이면 UI에서 마스킹
);

-- 요청 히스토리
CREATE TABLE history (
  id            TEXT PRIMARY KEY,
  request_id    TEXT,               -- NULL 허용 (임시 요청)
  method        TEXT,
  url           TEXT,
  request_raw   TEXT,               -- JSON (전송된 실제 요청 스냅샷)
  response_status INTEGER,
  response_time_ms INTEGER,
  response_size_bytes INTEGER,
  response_headers TEXT,            -- JSON
  response_body TEXT,
  executed_at   DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

---

## 7. Tauri 커맨드 인터페이스 (Rust ↔ React)

```typescript
// Tauri invoke 시그니처 (TypeScript 쪽)

// HTTP 요청 실행
invoke<ResponsePayload>('execute_request', {
  method: string,
  url: string,
  headers: Record<string, string>,
  body?: string,
  tlsSkipVerify: boolean,
  timeoutMs: number,
})

// 컬렉션 CRUD
invoke<Collection[]>('get_collections')
invoke<void>('save_collection', { collection: Collection })
invoke<void>('delete_collection', { id: string })

// 요청 CRUD
invoke<Request[]>('get_requests', { collectionId: string })
invoke<void>('save_request', { request: Request })

// 환경변수
invoke<Environment[]>('get_environments')
invoke<EnvVariable[]>('get_env_variables', { environmentId: string })

// 히스토리
invoke<HistoryItem[]>('get_history', { limit: number, offset: number })

// Postman 컬렉션 가져오기/내보내기
invoke<void>('import_postman_collection', { filePath: string })
invoke<void>('export_postman_collection', { collectionId: string, filePath: string })
```

---

## 8. 폐쇄망 운영 고려사항 (Air-gap Operations)

### 8.1 배포 절차
```
1. 인터넷 환경에서 빌드:
   npm run tauri build
   → dist\setup\HiveAPI_x.y.z_x64.msi 생성

2. USB 또는 내부 파일서버로 .msi 전달

3. 폐쇄망 PC에서 설치:
   msiexec /i HiveAPI_x.y.z_x64.msi

4. 업데이트 시:
   기존 버전 제거 또는 덮어쓰기 설치
```

### 8.2 TLS / 인증서 처리
- 내부망 HTTPS API는 자체서명 인증서 또는 내부 CA 사용이 일반적
- 요청별 옵션: "TLS 검증 무시" 토글 (개발용)
- 전역 설정: 커스텀 CA 인증서 파일(.crt/.pem) 등록

### 8.3 팀 공유 방식
- Postman Collection v2.1 JSON 파일로 내보내기 → USB / 내부 git / 파일서버
- 환경변수 파일 별도 내보내기 (보안 변수 제외 옵션 포함)

---

## 9. 개발 일정 제안 (2주 MVP 로드맵)

| 주차 | 태스크 |
|------|--------|
| 1주차 Day 1-2 | Tauri v2 프로젝트 초기화, Rust HTTP 실행 커맨드 구현 |
| 1주차 Day 3-4 | SQLite 스키마 + CRUD Rust 커맨드 구현 |
| 1주차 Day 5 | React 기본 레이아웃 (사이드바 + 메인 패널 골격) |
| 2주차 Day 1-2 | 요청 빌더 UI (메서드, URL, 파라미터, 헤더, Body 탭) |
| 2주차 Day 3 | 응답 뷰어 (JSON 강조, 상태코드 pill, 메타 정보) |
| 2주차 Day 4 | 환경변수 + {{변수}} 치환 로직 |
| 2주차 Day 5 | Postman Collection 가져오기/내보내기 + .msi 빌드 테스트 |

---

## 10. 참고 / 관련 도구

| 도구 | 비고 |
|------|------|
| Postman | 벤치마크 대상. Collection v2.1 포맷 호환 필요 |
| Bruno | 오픈소스 오프라인 클라이언트 (UX 참고) |
| reqwest (Rust) | HTTP 클라이언트 크레이트 |
| rusqlite | SQLite Rust 바인딩 |
| CodeMirror 6 | 코드 에디터 (로컬 번들 필수) |
| Tauri v2 | 데스크탑 프레임워크 공식 문서: https://tauri.app |
