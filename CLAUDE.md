# HiveAPI — AI Coding Context

## 프로젝트 개요
- **이름**: HiveAPI
- **목적**: 폐쇄망(air-gapped) 환경용 Postman 대체 + MCP 클라이언트 데스크탑 앱
- **대상 OS**: Windows 10/11 전용

## 기술 스택
- **Frontend**: React 19 + TypeScript + Vite 7
- **Desktop**: Tauri v2 (Rust 백엔드)
- **HTTP 엔진**: Rust reqwest (rustls-tls)
- **MCP 엔진**: JSON-RPC 2.0 over stdio / Streamable HTTP
- **로컬 DB**: SQLite via rusqlite (bundled)
- **상태관리**: Zustand
- **코드 에디터**: CodeMirror 6 (예정)
- **데이터 패칭**: TanStack Query
- **경로 해석**: which crate (Windows PATHEXT 지원)

## 디렉토리 구조
```
D:\source\postman\
├── ideation/          — 설계 문서 (UI 목업, 기능 목록, MCP 아이데이션)
├── src/               — React 프론트엔드
│   ├── components/
│   │   ├── TitleBar/      — 커스텀 타이틀바
│   │   ├── Sidebar/       — 컬렉션/히스토리/MCP 3탭 + 환경변수 관리
│   │   ├── MainPanel/     — REST 요청 빌더 (RequestBar, RequestTabs, ResponsePanel)
│   │   ├── Mcp/           — MCP 패널 (McpSidebar, McpPanel, JsonSchemaForm)
│   │   └── shared/        — KeyValueEditor, ResizeHandle
│   ├── stores/        — Zustand (collection, request, environment, response, ui, mcp)
│   ├── hooks/         — useSendRequest
│   ├── lib/           — tauri invoke 래퍼, 상수, envSubstitute, uuid
│   ├── types/         — TypeScript 인터페이스
│   └── styles/        — CSS 변수, 글로벌 스타일
├── src-tauri/         — Rust 백엔드
│   └── src/
│       ├── models/    — 데이터 모델 (REST + MCP)
│       ├── db/        — SQLite CRUD (7개 테이블)
│       ├── commands/  — Tauri 커맨드 핸들러 (REST 15개 + MCP 12개)
│       └── mcp/       — MCP 클라이언트 엔진 (client, stdio, http, jsonrpc)
└── dist/              — Vite 빌드 결과물
```

## 빌드/실행 명령어
```bash
# 개발 모드 (cargo가 PATH에 있어야 함)
set PATH=%USERPROFILE%\.cargo\bin;%PATH% && npm run tauri dev

# 프로덕션 빌드 (MSI + EXE)
set PATH=%USERPROFILE%\.cargo\bin;%PATH% && npm run tauri build

# 프론트엔드만 빌드
npm run build
```

## 아키텍처 규칙
- Rust 커맨드는 `src-tauri/src/commands/`에 모듈별로 분리
- DB 접근은 `Mutex<Connection>` 통해 단일 스레드 보장
- MCP 클라이언트 상태는 `McpState { clients: tokio::Mutex<HashMap> }` 으로 관리
- MCP stdio: `which` crate → .cmd 감지 → node.exe + .js 직접 실행 (cmd.exe 우회)
- 프론트엔드 invoke는 `src/lib/tauri.ts`의 typed 래퍼 사용
- 커스텀 타이틀바 (`decorations: false`, `data-tauri-drag-region`)
- CSS 변수 기반 디자인 시스템 (`src/styles/globals.css`)
- `@` alias → `./src` (vite + tsconfig)

## DB 테이블 (7개)
| 테이블 | 용도 |
|--------|------|
| collections | 요청 컬렉션 (폴더 계층) |
| requests | API 요청 정의 |
| environments | 환경 (개발/스테이징/운영) |
| env_variables | 환경변수 ({{key}} 치환) |
| history | REST 요청 히스토리 |
| mcp_servers | MCP 서버 설정 (stdio/http) |
| mcp_history | MCP 호출 히스토리 |

## 제약사항
- 런타임 인터넷 연결 제로 (폐쇄망)
- 모든 에셋 로컬 번들
- Windows 전용
- 자동 업데이트 없음
- MCP stdio: CREATE_NO_WINDOW 사용 (node.exe 직접 실행 시 안전)

## 네이밍 규칙
- Rust: snake_case
- TypeScript: camelCase (변수), PascalCase (컴포넌트/타입)
- CSS: CSS Modules (camelCase)
- Tauri 커맨드: Rust snake_case → JS camelCase 자동 변환
