# Session Checkpoint

## 최종 완료 단계
Step 8 — MCP 클라이언트 연결 성공

## 완료된 기능
- [x] 프로젝트 초기화 (Tauri v2 + React 19 + Rust)
- [x] HTTP 요청 빌더 UI (파라미터/헤더/Body/인증 4탭)
- [x] 컬렉션 관리 (CRUD + 사이드바 트리)
- [x] 환경변수 + {{변수}} 치환
- [x] 요청 히스토리 (자동저장 + UI)
- [x] Postman Collection v2.1 가져오기/내보내기
- [x] 요청 저장 버튼
- [x] Import/Export UI 버튼 (파일 다이얼로그)
- [x] 환경변수 관리 모달 (생성/편집/삭제)
- [x] MCP 클라이언트 — stdio 전송 (which crate + node.exe 직접 실행)
- [x] MCP 클라이언트 — Streamable HTTP 전송
- [x] MCP 사이드바 탭 (서버 추가/연결/도구 트리)
- [x] MCP McpPanel + JsonSchemaForm (동적 폼)
- [x] 프로덕션 빌드 (EXE 7.7MB, MSI 3.9MB)

## 빌드 산출물
- EXE: `src-tauri/target/release/hiveapi.exe`
- MSI: `src-tauri/target/release/bundle/msi/HiveAPI_0.1.0_x64_en-US.msi`

## 다음 가능한 단계
- MCP 로그 뷰어 UI
- CodeMirror 6 Body 에디터
- 사전 요청 스크립트 (JavaScript 샌드박스)
- 로컬 Mock 서버
- 응답 diff 비교
- TLS 커스텀 CA 인증서 등록 UI

## 알려진 이슈
- MCP 서버 추가 시 인자(args) 필드를 반드시 입력해야 함 (빈 args → 연결 차단)
- MCP stdio: 콘솔 창 안 보임 (CREATE_NO_WINDOW), node.exe 직접 실행
- cargo가 시스템 PATH에 없으면 `npm run tauri dev` 실패 → PATH 수동 설정 필요
