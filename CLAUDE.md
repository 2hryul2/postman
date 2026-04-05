# HiveAPI — AI Coding Context

## 프로젝트 개요
- **이름**: HiveAPI
- **목적**: 폐쇄망(air-gapped) 환경용 Postman 대체 데스크탑 API 클라이언트
- **대상 OS**: Windows 10/11 전용

## 기술 스택
- **Frontend**: React 19 + TypeScript + Vite 7
- **Desktop**: Tauri v2 (Rust 백엔드)
- **HTTP 엔진**: Rust reqwest (rustls-tls)
- **로컬 DB**: SQLite via rusqlite (bundled)
- **상태관리**: Zustand
- **코드 에디터**: CodeMirror 6 (예정)
- **데이터 패칭**: TanStack Query

## 디렉토리 구조
```
D:\source\postman\
├── ideation/          — 설계 문서 (UI 목업, 기능 목록)
├── src/               — React 프론트엔드
│   ├── components/    — TitleBar, Sidebar, MainPanel
│   ├── stores/        — Zustand 스토어
│   ├── lib/           — tauri invoke 래퍼, 상수
│   ├── types/         — TypeScript 인터페이스
│   └── styles/        — CSS 변수, 글로벌 스타일
├── src-tauri/         — Rust 백엔드
│   └── src/
│       ├── models/    — 데이터 모델 구조체
│       ├── db/        — SQLite CRUD 레이어
│       └── commands/  — Tauri 커맨드 핸들러
└── dist/              — Vite 빌드 결과물
```

## 빌드/실행 명령어
```bash
# 개발 모드
npm run tauri dev

# 프로덕션 빌드 (MSI)
npm run tauri build

# 프론트엔드만 빌드
npm run build
```

## 아키텍처 규칙
- Rust 커맨드는 `src-tauri/src/commands/`에 모듈별로 분리
- DB 접근은 `Mutex<Connection>` 통해 단일 스레드 보장
- 프론트엔드 invoke는 `src/lib/tauri.ts`의 typed 래퍼 사용
- 커스텀 타이틀바 (`decorations: false`, `data-tauri-drag-region`)
- CSS 변수 기반 디자인 시스템 (`src/styles/globals.css`)
- `@` alias → `./src` (vite + tsconfig)

## DB 정보
- 경로: `%AppData%/com.hiveapi.app/hiveapi.db`
- WAL 모드, Foreign Keys ON
- UUIDv4 텍스트 ID

## 제약사항
- 런타임 인터넷 연결 제로
- 모든 에셋 로컬 번들
- Windows 전용
- 자동 업데이트 없음

## 네이밍 규칙
- Rust: snake_case
- TypeScript: camelCase (변수), PascalCase (컴포넌트/타입)
- CSS: CSS Modules (camelCase)
- Tauri 커맨드: Rust snake_case → JS camelCase 자동 변환
