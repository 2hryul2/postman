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
- 컴포넌트: TitleBar, Sidebar, MainPanel (RequestBar, RequestTabs, ResponsePanel), ResizeHandle
- 스토어: collection, request, environment, response, ui
- 디자인 시스템: CSS 변수 (globals.css)
- 경로 alias: @ → ./src
