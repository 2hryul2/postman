# HiveAPI — UI Mockup Specification
> AI Coding Context File · 이 파일은 AI 코딩 어시스턴트가 UI를 구현할 때 참조하는 목업 명세입니다.
> Generated: 2026-04-05 01:06:36

---

## SCREEN 01 — Main Window (Default State)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ [●red][●yel][●grn]   HiveAPI                              [─][□][×]         │
│ ─────────────────────────────────────────────────────────────────────────── │
│ SIDEBAR (220px)       │ MAIN PANEL (flex-1)                                  │
│                       │                                                      │
│ [🔍 컬렉션 검색...  ] │ [GET ▼] [https://{{host}}/api/users    ] [전송]      │
│ [+ 새 요청          ] │ ──────────────────────────────────────────────────   │
│                       │ [파라미터] [헤더] [Body] [인증]                      │
│ COLLECTIONS ─────── │                                                      │
│                       │  키              값                   [×]            │
│ ▼ 📁 사용자 API      │  page            1                    [×]            │
│   [GET ] 사용자 목록 ◀│  limit           20                   [×]            │
│   [POST] 사용자 생성  │  [빈 행...]      [빈 행...]            [×]            │
│   [PUT ] 사용자 수정  │  [+ 파라미터 추가]                                   │
│   [DEL ] 사용자 삭제  │                                                      │
│                       │ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│ ▼ 📁 인증 API        │ 응답                                                  │
│   [POST] 로그인       │  전송 버튼을 눌러 요청을 실행하세요                   │
│   [POST] 토큰 갱신    │                                                      │
│                       │                                                      │
│ ▼ 📁 상품 API        │                                                      │
│   [GET ] 상품 목록    │                                                      │
│   [PAT ] 상품 부분수정│                                                      │
│                       │                                                      │
│ ─────────────────── │                                                      │
│ [●] [개발 (dev)  ▼] │                                                      │
└───────────────────────┴──────────────────────────────────────────────────────┘
```

**Active state indicator:** 선택된 요청 항목은 좌측에 2px info-color 세로선 표시

---

## SCREEN 02 — After Send (Response Populated)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ [●][●][●]  HiveAPI                                                          │
├───────────────────────┬─────────────────────────────────────────────────────┤
│ SIDEBAR               │ [GET ▼] [https://{{host}}/api/users    ] [전송]     │
│  ...동일...           ├─────────────────────────────────────────────────────┤
│                       │ [파라미터▶] [헤더] [Body] [인증]                    │
│                       │  ... 파라미터 패널 ...                              │
│                       ├─────────────────────────────────────────────────────┤
│                       │ 응답  [200 OK]pill  142ms · 1.2 KB                  │
│                       │ ─────────────────────────────────────────────────   │
│                       │ {                                                   │
│                       │   "data": [                                         │
│                       │     {                                               │
│                       │       "id": 1,                                      │
│                       │       "name": "홍길동",                              │
│                       │       "email": "hong@example.com",                  │
│                       │       "active": true                                │
│                       │     },                                              │
│                       │     { "id": 2, "name": "김영희", ... }              │
│                       │   ],                                                │
│                       │   "total": 42,                                      │
│                       │   "page": 1                                         │
│                       │ }                                                   │
│ [●] [개발 (dev) ▼]  │                                                     │
└───────────────────────┴─────────────────────────────────────────────────────┘
```

**Status pill colors:**
- 2xx → background: #eaf3de, color: #3b6d11 (green)
- 4xx → background: #fcebeb, color: #a32d2d (red)
- 5xx → background: #faeeda, color: #854f0b (amber)

---

## SCREEN 03 — Body Tab (POST Request)

```
│ [GET ▼→POST▼] [https://{{host}}/api/users    ] [전송]                      │
├─────────────────────────────────────────────────────────────────────────────┤
│ [파라미터] [헤더] [Body ◀active] [인증]                                     │
│                                                                             │
│  타입: [JSON ▼]  [form-data]  [raw]  [binary]                              │
│                                                                             │
│ ┌───────────────────────────────────────────────────────────────────────┐  │
│ │ {                                                                     │  │
│ │   "name": "홍길동",                                                   │  │
│ │   "email": "hong@example.com",                                        │  │
│ │   "role": "user"                                                      │  │
│ │ }                                                                     │  │
│ │                                                                       │  │
│ └───────────────────────────────────────────────────────────────────────┘  │
│  [CodeMirror 6 에디터 — JSON 구문강조, 괄호 매칭, 자동완성]                  │
```

---

## SCREEN 04 — Auth Tab

```
│ [파라미터] [헤더] [Body] [인증 ◀active]                                    │
│                                                                             │
│  인증 타입: [Bearer Token ▼]                                                │
│                                                                             │
│  토큰                                                                       │
│  [{{token}}                                        ]  ← mono font input    │
│                                                                             │
│  ℹ️ Authorization 헤더에 자동으로 "Bearer {{token}}" 형태로 추가됩니다.     │
```

**Auth type options:** Bearer Token | Basic Auth | API Key | 없음

---

## SCREEN 05 — Environment Selector (Dropdown Open)

```
│ SIDEBAR 하단                                                                │
│ ─────────────────────────────                                               │
│ [●grn] [개발 (dev)         ▼]                                              │
│         ┌─────────────────────┐                                             │
│         │ ✓ 개발 (dev)        │  ← 현재 선택                               │
│         │   스테이징           │                                             │
│         │   운영 (prod)        │                                             │
│         │ ─────────────────── │                                             │
│         │ + 환경 추가...       │                                             │
│         └─────────────────────┘                                             │
```

**환경변수 치환 동작:**
- URL 입력창에서 `{{host}}` → 선택된 환경의 `host` 값으로 치환 후 전송
- 치환 전 상태로 URL 입력창에 표시 (사용자가 변수명 확인 가능)
- 미정의 변수는 오렌지색 언더라인으로 경고 표시

---

## COMPONENT SPEC

### RequestBar
```
Props: method, url, onSend, isSending
Layout: flex-row, height 52px, padding 10px 12px, gap 6px
  - MethodSelect: width auto, font-weight 500, color by method
  - UrlInput: flex-1, font-family monospace, placeholder "URL 또는 {{변수}} 입력"
  - SendButton: width 60px, bg: info-color, text white, disabled when isSending
```

### MethodSelect — color map
```javascript
const METHOD_COLORS = {
  GET:    { bg: '#e1f5ee', text: '#0f6e56' },
  POST:   { bg: '#e6f1fb', text: '#185fa5' },
  PUT:    { bg: '#faeeda', text: '#854f0b' },
  DELETE: { bg: '#fcebeb', text: '#a32d2d' },
  PATCH:  { bg: '#fbeaf0', text: '#993556' },
}
```

### SidebarItem (RequestItem)
```
Layout: flex-row, padding 4px 6px, border-radius 6px, cursor pointer
Active: border-left: 2px solid info-color, padding-left: 4px
Hover: background: --color-background-primary
  - MethodBadge: 32px min-width, font-size 9px, centered text
  - RequestName: flex-1, font-size 12px, truncate overflow
```

### ResponseStatusPill
```
Renders as: <span class="status-pill s-{category}">
  category = '2xx' | '4xx' | '5xx'
  2xx → bg #eaf3de, color #3b6d11
  4xx → bg #fcebeb, color #a32d2d
  5xx → bg #faeeda, color #854f0b
  padding: 2px 7px, border-radius: 10px, font-size: 11px, font-weight: 500
```

### ParamsPanel (shared with HeadersPanel)
```
Layout: flex-column, padding 10px 12px, gap 6px
Header row: grid 1fr 1fr 24px — labels "키" / "값" / ""
Data rows:  grid 1fr 1fr 24px — input / input / delete-button
Footer: "+ 파라미터 추가" text button
Input style: height 28px, mono font, border 0.5px, border-radius 6px
```

### EnvSelector (Sidebar Bottom)
```
Layout: flex-row, padding 4px 10px, border-top 0.5px, height 30px
  - StatusDot: 7px circle, bg #28c840 (connected) or #ff5f57 (error)
  - Select: font-size 11px, appearance none, flex-1
```

---

## COLOR TOKENS (CSS Variables — Tauri WebView2)

```css
/* 사용할 CSS 변수 — Tauri의 WebView2에서 직접 정의 */
:root {
  --bg-primary:    #ffffff;
  --bg-secondary:  #f5f5f4;
  --bg-tertiary:   #eeede8;
  --text-primary:  #1a1a18;
  --text-secondary:#6b6a64;
  --text-tertiary: #9b9a94;
  --border-sub:    rgba(0,0,0,0.12);
  --border-weak:   rgba(0,0,0,0.08);
  --info-bg:       #e6f1fb;
  --info-text:     #185fa5;
  --success-bg:    #eaf3de;
  --success-text:  #3b6d11;
  --danger-bg:     #fcebeb;
  --danger-text:   #a32d2d;
  --warn-bg:       #faeeda;
  --warn-text:     #854f0b;
  --radius-md:     8px;
  --radius-lg:     12px;
  --font-sans:     'Pretendard', 'Segoe UI', sans-serif;
  --font-mono:     'JetBrains Mono', 'Consolas', monospace;
}
```

---

## INTERACTION FLOWS

### Flow 1: 요청 전송
```
사용자: 사이드바에서 요청 클릭
  → URL, Method, Params, Headers, Body 로드
  → [전송] 클릭
  → SendButton → "전송 중..." (disabled)
  → Tauri invoke('execute_request', payload)
  → Rust: reqwest 실행 → response
  → React: 응답 패널 업데이트 (status, time, size, body)
  → SendButton → "전송" (enabled)
```

### Flow 2: 환경변수 치환
```
URL: "https://{{host}}/api/{{version}}/users"
환경 선택: 개발 (dev)
  → host = "192.168.1.100:8080"
  → version = "v1"
실제 전송 URL: "https://192.168.1.100:8080/api/v1/users"
UI 표시: "https://{{host}}/api/{{version}}/users" (치환 전 그대로)
```

### Flow 3: Postman 컬렉션 가져오기
```
메뉴: 파일 → 가져오기
  → 파일 선택 다이얼로그 (로컬 .json 파일)
  → Tauri invoke('import_postman_collection', { filePath })
  → Rust: JSON 파싱 → Collection v2.1 → SQLite 저장
  → React: 컬렉션 목록 새로고침
```

---

## RESPONSIVE BEHAVIOR (창 크기별)

| 창 너비 | 사이드바 | 메인 패널 |
|---------|---------|---------|
| < 800px | 숨김 (토글 버튼으로 오버레이) | 전체 너비 |
| 800~1200px | 고정 220px | 나머지 |
| > 1200px | 리사이즈 가능 (220~400px) | 나머지 |

최소 창 크기: 800 × 600px
