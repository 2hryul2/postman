# Session Checkpoint

## 최종 완료 단계
Step 1 — 프로젝트 초기화

## 현재 상태
- [x] MSVC Build Tools 14.44 설치
- [x] Rust 1.94.1 설치
- [x] Tauri v2 scaffolding (React-TS)
- [x] tauri.conf.json 커스터마이징 (HiveAPI, 커스텀 타이틀바, MSI)
- [x] Rust 백엔드: models, db, commands 모듈 구조 완성
- [x] SQLite 스키마 5개 테이블 (collections, requests, environments, env_variables, history)
- [x] 11개 Tauri 커맨드 등록 (execute_request 실구현, 나머지 CRUD)
- [x] React 프론트엔드: 레이아웃 골격 (TitleBar + Sidebar + MainPanel)
- [x] Zustand 스토어 5개, TanStack Query 설정
- [x] CSS 변수 디자인 시스템
- [ ] 스모크 테스트 (npm run tauri dev)
- [ ] Git 초기 커밋

## 다음 단계
- Step 2: HTTP 요청 빌더 UI (파라미터, 헤더, Body 탭 구현)

## 알려진 이슈
- MSVC Build Tools 설치 후 재시작 미완 (exit code 194)
- import/export 커맨드는 stub 상태
