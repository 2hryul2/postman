# HiveAPI — MCP Client Feature Ideation
> Generated: 2026-04-05
> Purpose: HiveAPI에 MCP (Model Context Protocol) 클라이언트 기능 추가 설계

---

## 1. MCP 프로토콜 요약

### 1.1 MCP란?
- **Model Context Protocol** — AI 모델이 외부 도구/데이터에 접근하는 표준 프로토콜
- **JSON-RPC 2.0** 기반 양방향 메시징
- 서버가 **Tools**, **Resources**, **Prompts** 3가지를 제공
- 클라이언트가 연결 → 초기화 → 탐색 → 호출하는 구조

### 1.2 전송 방식 (Transport)

| 방식 | 설명 | 사용 시나리오 |
|------|------|---------------|
| **stdio** | 서버를 자식 프로세스로 실행, stdin/stdout으로 통신 | 로컬 MCP 서버 (npx, python 등) |
| **Streamable HTTP** | HTTP POST/GET + SSE 스트리밍 | 원격 MCP 서버 (URL 기반) |

### 1.3 핵심 JSON-RPC 메서드

| 메서드 | 방향 | 설명 |
|--------|------|------|
| `initialize` | Client → Server | 연결 초기화, 프로토콜 버전/능력 협상 |
| `initialized` | Client → Server | 초기화 완료 알림 (notification) |
| `tools/list` | Client → Server | 사용 가능한 도구 목록 조회 |
| `tools/call` | Client → Server | 도구 실행 |
| `resources/list` | Client → Server | 리소스 목록 조회 |
| `resources/read` | Client → Server | 리소스 내용 읽기 |
| `prompts/list` | Client → Server | 프롬프트 템플릿 목록 |
| `prompts/get` | Client → Server | 프롬프트 내용 가져오기 |

---

## 2. UI 설계 — 전체 레이아웃

### 2.1 기존 구조에 MCP 탭 추가

사이드바 탭에 "MCP" 탭을 추가합니다.

```
┌─────────────────────────────────────────────────────────────────┐
│ [●][●][●]  HiveAPI                                    [─][□][×] │
├──────────────┬──────────────────────────────────────────────────┤
│ SIDEBAR      │  메인 패널 (기존 REST / MCP 뷰 전환)            │
│              │                                                  │
│ [검색]       │  ┌─ REST 모드 ───────────────────────────────┐  │
│ [+ 새 컬렉션]│  │ [GET ▼] [URL ──────────────] [전송]       │  │
│ [가져오기]   │  └────────────────────────────────────────────┘  │
│              │                                                  │
│ [컬렉션][히스토리][MCP]  ← 3탭                                  │
│              │  ┌─ MCP 모드 ────────────────────────────────┐  │
│ ── MCP 탭 ──│  │ MCP 전용 메인 패널 (아래 상세)             │  │
│ ▼ 서버 A    │  └────────────────────────────────────────────┘  │
│   🔧 tool1  │                                                  │
│   🔧 tool2  │                                                  │
│   📄 res1   │                                                  │
│ ▼ 서버 B    │                                                  │
│   🔧 tool3  │                                                  │
│              │                                                  │
│ [+ 서버 추가]│                                                  │
├──────────────┴──────────────────────────────────────────────────┤
│ [●] [개발 (dev) ▼]                          [⚙]                │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 사이드바 MCP 탭 상세

```
MCP 서버 목록
├── [+ 서버 추가] 버튼
├── ▼ 🟢 filesystem (stdio)         ← 연결됨 (녹색 점)
│   ├── 🔧 Tools (3)
│   │   ├── read_file
│   │   ├── write_file
│   │   └── list_directory
│   ├── 📄 Resources (2)
│   │   ├── file:///config.json
│   │   └── file:///data.csv
│   └── 💬 Prompts (1)
│       └── summarize-file
├── ▼ 🔴 weather-api (http)         ← 연결 끊김 (빨간 점)
│   └── [재연결] 버튼
└── ▼ ⚪ database (stdio)           ← 미연결 (회색 점)
    └── [연결] 버튼
```

**상태 표시:**
- 🟢 연결됨 (connected)
- 🔴 연결 끊김 (disconnected/error)
- ⚪ 미연결 (not started)
- 🟡 연결 중 (connecting)

---

## 3. UI 설계 — MCP 서버 추가 모달

```
┌─────────────────────────────────────────────┐
│  MCP 서버 추가                         [×]  │
├─────────────────────────────────────────────┤
│                                             │
│  서버 이름                                  │
│  [my-mcp-server               ]             │
│                                             │
│  전송 방식                                  │
│  (●) stdio    ( ) Streamable HTTP           │
│                                             │
│  ── stdio 설정 ──────────────────────────   │
│  실행 명령어                                │
│  [npx                          ]            │
│  인자 (arguments)                           │
│  [-y @modelcontextprotocol/server-filesystem]│
│  [/path/to/allowed/directory   ]            │
│  [+ 인자 추가]                              │
│                                             │
│  환경변수 (선택)                            │
│  키               값                        │
│  [NODE_ENV      ] [production   ]           │
│  [+ 환경변수 추가]                          │
│                                             │
│  ── 또는 HTTP 설정 ─────────────────────    │
│  서버 URL                                   │
│  [https://mcp.example.com/sse  ]            │
│  인증 헤더 (선택)                           │
│  [Authorization ] [Bearer sk-...  ]         │
│                                             │
│         [취소]  [연결 테스트]  [추가]        │
└─────────────────────────────────────────────┘
```

---

## 4. UI 설계 — MCP 메인 패널

### 4.1 서버 선택 시 — 개요 화면

```
┌────────────────────────────────────────────────────────────────┐
│  🟢 filesystem                            [연결 해제] [삭제]   │
│  stdio · npx -y @modelcontextprotocol/server-filesystem        │
├────────────────────────────────────────────────────────────────┤
│  [Tools (3)]  [Resources (2)]  [Prompts (1)]  [로그]          │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  🔧 Tools                                                      │
│  ┌──────────────┬──────────────────────────────────────────┐  │
│  │ read_file    │ Read the complete contents of a file     │  │
│  │              │ Params: path (string, required)          │  │
│  │              │                           [실행 ▶]       │  │
│  ├──────────────┼──────────────────────────────────────────┤  │
│  │ write_file   │ Create or overwrite a file               │  │
│  │              │ Params: path, content (string, required) │  │
│  │              │                           [실행 ▶]       │  │
│  ├──────────────┼──────────────────────────────────────────┤  │
│  │ list_dir     │ List directory contents                  │  │
│  │              │ Params: path (string, required)          │  │
│  │              │                           [실행 ▶]       │  │
│  └──────────────┴──────────────────────────────────────────┘  │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

### 4.2 Tool 실행 화면 (실행 ▶ 클릭 시)

```
┌────────────────────────────────────────────────────────────────┐
│  🔧 read_file                                    [← 목록으로] │
│  Read the complete contents of a file from the filesystem      │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  ── 입력 (Input Schema) ──────────────────────────────────    │
│                                                                │
│  path * (string)                                               │
│  [/home/user/config.json                        ]              │
│                                                                │
│                                          [실행]                │
│                                                                │
│  ── 결과 ─────────────────────────────────────────────────    │
│  [200 OK]   32ms                                               │
│                                                                │
│  {                                                             │
│    "type": "text",                                             │
│    "text": "{\n  \"debug\": true,\n  \"port\": 3000\n}"       │
│  }                                                             │
│                                                                │
│  ── JSON-RPC Raw ────────────────────────────────────────     │
│  Request:                                                      │
│  {"jsonrpc":"2.0","id":5,"method":"tools/call",                │
│   "params":{"name":"read_file","arguments":{"path":"..."}}}    │
│                                                                │
│  Response:                                                     │
│  {"jsonrpc":"2.0","id":5,"result":{"content":[...]}}           │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

### 4.3 Resource 읽기 화면

```
┌────────────────────────────────────────────────────────────────┐
│  📄 Resources                                                  │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  file:///config.json (application/json)          [읽기]        │
│  ┌──────────────────────────────────────────────────────┐     │
│  │ {                                                     │     │
│  │   "debug": true,                                      │     │
│  │   "port": 3000                                        │     │
│  │ }                                                     │     │
│  └──────────────────────────────────────────────────────┘     │
│                                                                │
│  file:///data.csv (text/csv)                     [읽기]        │
│  ┌──────────────────────────────────────────────────────┐     │
│  │ name,age,city                                         │     │
│  │ Alice,30,Seoul                                        │     │
│  │ Bob,25,Busan                                          │     │
│  └──────────────────────────────────────────────────────┘     │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

### 4.4 Prompt 실행 화면

```
┌────────────────────────────────────────────────────────────────┐
│  💬 summarize-file                               [← 목록으로] │
│  Summarize the contents of a file                              │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  ── 인자 ─────────────────────────────────────────────────    │
│                                                                │
│  path * (required)                                             │
│  [/home/user/document.md                        ]              │
│                                                                │
│                                          [가져오기]            │
│                                                                │
│  ── 결과 (Messages) ──────────────────────────────────────    │
│                                                                │
│  [user] Please summarize the contents of:                      │
│         /home/user/document.md                                 │
│                                                                │
│         Content: # My Document                                 │
│         This is a sample document with ...                     │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

### 4.5 로그 탭

```
┌────────────────────────────────────────────────────────────────┐
│  로그                                            [지우기]      │
├────────────────────────────────────────────────────────────────┤
│  14:23:01 → initialize (id:1)                                  │
│  14:23:01 ← initialize result: OK (v2025-06-18)               │
│  14:23:01 → initialized (notification)                         │
│  14:23:02 → tools/list (id:2)                                  │
│  14:23:02 ← tools/list result: 3 tools                        │
│  14:23:05 → tools/call read_file (id:3)                        │
│  14:23:05 ← tools/call result: OK (32ms)                      │
│  14:23:10 ← notifications/tools/list_changed                  │
│  14:23:10 → tools/list (id:4) [auto-refresh]                  │
│  14:23:10 ← tools/list result: 4 tools                        │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

---

## 5. 데이터 모델 (SQLite 추가 테이블)

```sql
-- MCP 서버 설정
CREATE TABLE mcp_servers (
  id            TEXT PRIMARY KEY,
  name          TEXT NOT NULL,
  transport     TEXT NOT NULL,          -- 'stdio' | 'http'
  -- stdio fields
  command       TEXT,                   -- 실행 명령어 (npx, python 등)
  args          TEXT,                   -- JSON array of arguments
  env           TEXT,                   -- JSON object of env vars
  -- http fields
  url           TEXT,                   -- Streamable HTTP endpoint URL
  headers       TEXT,                   -- JSON object of auth headers
  -- common
  auto_connect  INTEGER DEFAULT 0,     -- 앱 시작 시 자동 연결
  created_at    DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- MCP 호출 히스토리
CREATE TABLE mcp_history (
  id            TEXT PRIMARY KEY,
  server_id     TEXT REFERENCES mcp_servers(id),
  method        TEXT NOT NULL,          -- 'tools/call', 'resources/read' 등
  params        TEXT,                   -- JSON (요청 파라미터)
  result        TEXT,                   -- JSON (응답)
  is_error      INTEGER DEFAULT 0,
  time_ms       INTEGER,
  executed_at   DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

---

## 6. 컴포넌트 트리 (MCP 관련)

```
App
├── Sidebar
│   ├── ... (기존 컬렉션/히스토리 탭)
│   └── McpTab                           # MCP 사이드바 탭
│       ├── McpServerList                # 서버 목록
│       │   └── McpServerItem            # 서버 항목 (연결 상태, 접기/펼치기)
│       │       ├── McpToolItem          # 도구 항목
│       │       ├── McpResourceItem      # 리소스 항목
│       │       └── McpPromptItem        # 프롬프트 항목
│       └── AddServerButton
│
└── MainPanel
    ├── ... (기존 REST 패널)
    └── McpPanel                         # MCP 메인 패널 (MCP 아이템 선택 시)
        ├── McpServerOverview            # 서버 개요 (tools/resources/prompts 목록)
        ├── McpToolExecutor              # Tool 실행 폼 + 결과
        │   ├── JsonSchemaForm           # inputSchema 기반 동적 폼
        │   └── McpResultViewer          # 결과 표시 (text/image/resource)
        ├── McpResourceViewer            # Resource 내용 표시
        ├── McpPromptViewer              # Prompt 실행 + 메시지 표시
        └── McpLogViewer                 # JSON-RPC 로그
```

---

## 7. Rust 백엔드 — Tauri 커맨드

```typescript
// MCP 서버 관리
invoke('mcp_save_server', { server: McpServer })
invoke('mcp_delete_server', { id: string })
invoke('mcp_get_servers', {}) → McpServer[]

// MCP 연결
invoke('mcp_connect', { serverId: string })     → { tools, resources, prompts }
invoke('mcp_disconnect', { serverId: string })

// MCP 호출
invoke('mcp_tools_list', { serverId: string })   → Tool[]
invoke('mcp_tools_call', { serverId, name, arguments }) → ToolResult
invoke('mcp_resources_list', { serverId })        → Resource[]
invoke('mcp_resources_read', { serverId, uri })   → ResourceContent
invoke('mcp_prompts_list', { serverId })          → Prompt[]
invoke('mcp_prompts_get', { serverId, name, arguments }) → PromptResult
```

### Rust 구현 방식

**stdio 전송:**
```
Rust: tokio::process::Command → stdin/stdout 파이프
     → JSON-RPC 메시지 라인 단위 송수신
     → 세션 유지 (프로세스 수명 동안)
```

**Streamable HTTP 전송:**
```
Rust: reqwest POST → JSON-RPC 요청
     → SSE 스트림 파싱 (text/event-stream)
     → Mcp-Session-Id 헤더 관리
```

---

## 8. 인터랙션 플로우

### Flow 1: MCP 서버 추가 및 연결
```
사용자: [+ 서버 추가] 클릭
  → 모달: 이름, 전송 방식, 명령어/URL 입력
  → [추가] 클릭
  → Rust: mcp_save_server → SQLite 저장
  → Rust: mcp_connect → 프로세스 실행 or HTTP 연결
  → Rust: initialize → initialized
  → Rust: tools/list + resources/list + prompts/list
  → React: 사이드바 트리 업데이트 (도구/리소스/프롬프트)
```

### Flow 2: Tool 실행
```
사용자: 사이드바에서 tool 클릭
  → McpToolExecutor 표시: inputSchema 기반 동적 폼
  → 파라미터 입력 → [실행] 클릭
  → Rust: mcp_tools_call → JSON-RPC tools/call
  → React: 결과 표시 (text/image/resource)
  → Rust: mcp_history insert → SQLite 저장
```

### Flow 3: Resource 읽기
```
사용자: 사이드바에서 resource 클릭
  → McpResourceViewer 표시
  → [읽기] 클릭
  → Rust: mcp_resources_read → JSON-RPC resources/read
  → React: 내용 표시 (JSON/text/binary)
```

---

## 9. JSON Schema → 동적 폼 (핵심 UI)

MCP Tool의 `inputSchema`는 JSON Schema 형식입니다.
이를 자동으로 입력 폼으로 변환하는 `JsonSchemaForm` 컴포넌트가 핵심입니다.

### 지원 타입 → UI 매핑

| JSON Schema type | UI 컴포넌트 |
|------------------|-------------|
| `string` | `<input type="text">` |
| `number` / `integer` | `<input type="number">` |
| `boolean` | `<input type="checkbox">` |
| `string` + `enum` | `<select>` (드롭다운) |
| `object` (중첩) | 재귀적 폼 렌더링 |
| `array` | 동적 아이템 추가/삭제 리스트 |

### 예시

```
inputSchema:
{
  "type": "object",
  "properties": {
    "location": { "type": "string", "description": "도시명" },
    "units": { "type": "string", "enum": ["celsius", "fahrenheit"] }
  },
  "required": ["location"]
}

→ 생성되는 폼:
  location * (string)  도시명
  [Seoul                              ]

  units (string)
  [celsius          ▼]
```

---

## 10. 폐쇄망 고려사항

| 항목 | 대응 |
|------|------|
| stdio 서버 | 로컬 실행이므로 인터넷 불필요 ✅ |
| HTTP 서버 | 내부망 URL만 허용 (외부 접속 불가) |
| npm 패키지 | `npx -y` 불가 → 미리 설치된 MCP 서버만 사용 |
| 폐쇄망 MCP 서버 | 직접 빌드한 바이너리 경로 지정으로 실행 |

---

## 11. 개발 일정 제안

| 단계 | 내용 | 예상 |
|------|------|------|
| Phase 1 | SQLite 스키마 + Rust CRUD (mcp_servers, mcp_history) | 1일 |
| Phase 2 | Rust stdio 전송 구현 (프로세스 관리 + JSON-RPC) | 2일 |
| Phase 3 | Rust Streamable HTTP 전송 구현 (reqwest + SSE 파싱) | 1일 |
| Phase 4 | React 사이드바 MCP 탭 + 서버 추가 모달 | 1일 |
| Phase 5 | React McpPanel + JsonSchemaForm + 결과 뷰어 | 2일 |
| Phase 6 | 로그 뷰어 + 히스토리 + 연결 상태 관리 | 1일 |

---

## 12. 참고

- [MCP Specification (2025-06-18)](https://modelcontextprotocol.io/specification/2025-06-18/basic/transports)
- [MCP Tools Spec](https://modelcontextprotocol.io/specification/2025-06-18/server/tools)
- [MCP JSON-RPC Reference](https://portkey.ai/blog/mcp-message-types-complete-json-rpc-reference-guide/)
- [MCP Client Development Guide](https://github.com/cyanheads/model-context-protocol-resources/blob/main/guides/mcp-client-development-guide.md)
