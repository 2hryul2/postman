# Build Log

## 2026-04-05 — Step 1: 프로젝트 초기화

### 설치
- Visual Studio Build Tools 2022 (MSVC 14.44.35207)
- Rust 1.94.1 via rustup
- Node.js v22.17.0 (기존)

### Scaffolding
- `npx create-tauri-app@latest` React-TS 템플릿
- 임시 디렉토리 생성 후 이동 (ideation/ 보존)

### Rust 백엔드
- Cargo 의존성: tauri 2, tauri-plugin-dialog 2, reqwest 0.12 (rustls-tls), rusqlite 0.32 (bundled), uuid, tokio, thiserror 2
- 모듈: error, models (5), db (5), commands (6)
- execute_request: reqwest 기반 실구현
- SQLite 스키마: 5개 테이블

### React 프론트엔드
- npm 의존성: zustand, @tanstack/react-query, @tauri-apps/plugin-dialog
- 컴포넌트: TitleBar, Sidebar, MainPanel, ResizeHandle
- 스토어: collection, request, environment, response, ui
- 디자인 시스템: CSS 변수 (globals.css)

---

## 2026-04-05 — Steps 2~6: MVP 기능

- HTTP 요청 빌더 (Params/Headers/Body/Auth 탭)
- 컬렉션 CRUD + 사이드바 트리
- 환경변수 {{치환}} 로직
- 요청 히스토리 자동저장
- Postman Collection v2.1 import/export (Rust 구현)
- 응답 뷰어 (Pretty/Raw/Headers 탭)

---

## 2026-04-05 — Step 7: 누락 UI 보완

- 요청 저장 버튼 (RequestBar)
- Import/Export UI 버튼 (Sidebar, file dialog)
- 환경변수 관리 모달 (EnvManager)

---

## 2026-04-05 — Step 8: MCP 클라이언트

### Rust MCP 엔진
- `src-tauri/src/mcp/` 모듈 신규: client, stdio, http, jsonrpc
- stdio 전송: `which` crate → .cmd 감지 → node.exe + npx-cli.js 직접 실행
- Streamable HTTP 전송: reqwest + SSE 파싱
- 12개 Tauri 커맨드 (서버 CRUD + 연결 + tools/resources/prompts)
- SQLite: mcp_servers, mcp_history 테이블 추가

### React MCP UI
- McpSidebar: 서버 목록, 연결 상태, 도구/리소스/프롬프트 트리
- McpAddServerModal: stdio (명령어+인자) / HTTP (URL+헤더) 설정
- McpPanel: JsonSchemaForm 동적 폼 + 결과 뷰어
- useMcpStore: 서버 상태, 연결 정보

### Windows stdio 디버깅 이력
- .cmd → cmd.exe 개입 → CREATE_NO_WINDOW 충돌 → 6차 패치
- 최종 해결: `which` crate (OpenAI Codex 방식) + node.exe 직접 실행
- 근본 원인: DB에 저장된 서버의 args가 비어있었음

### Cargo 추가 의존성
- which = "7" (PATHEXT 지원 명령어 해석)
- chrono = "0.4" (디버그 로그 타임스탬프)
