export type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH" | "HEAD" | "OPTIONS";

export type BodyType = "json" | "form" | "raw" | "binary";

export type AuthType = "bearer" | "basic" | "apikey" | "none";

export interface KeyValuePair {
  key: string;
  value: string;
  enabled: boolean;
}

export interface Collection {
  id: string;
  name: string;
  parent_id: string | null;
  sort_order: number;
  created_at: string | null;
}

export interface ApiRequest {
  id: string;
  collection_id: string | null;
  name: string;
  method: HttpMethod;
  url: string;
  headers: string | null;
  params: string | null;
  body_type: BodyType | null;
  body: string | null;
  auth_type: AuthType | null;
  auth_config: string | null;
  sort_order: number;
  created_at: string | null;
  updated_at: string | null;
}

export interface Environment {
  id: string;
  name: string;
}

export interface EnvVariable {
  id: string;
  environment_id: string;
  key: string;
  value: string;
  is_secret: boolean;
}

export interface HistoryItem {
  id: string;
  request_id: string | null;
  method: string | null;
  url: string | null;
  request_raw: string | null;
  response_status: number | null;
  response_time_ms: number | null;
  response_size_bytes: number | null;
  response_headers: string | null;
  response_body: string | null;
  executed_at: string | null;
}

export interface ResponsePayload {
  status: number;
  status_text: string;
  headers: Record<string, string>;
  body: string;
  time_ms: number;
  size_bytes: number;
}

// MCP types
export type McpTransport = "stdio" | "http";

export interface McpServer {
  id: string;
  name: string;
  transport: McpTransport;
  command: string | null;
  args: string | null;
  env: string | null;
  url: string | null;
  headers: string | null;
  auto_connect: boolean;
  created_at: string | null;
}

export interface McpTool {
  name: string;
  title: string | null;
  description: string | null;
  inputSchema: Record<string, unknown> | null;
}

export interface McpResource {
  uri: string;
  name: string | null;
  description: string | null;
  mimeType: string | null;
}

export interface McpPromptArgument {
  name: string;
  description: string | null;
  required: boolean | null;
}

export interface McpPrompt {
  name: string;
  description: string | null;
  arguments: McpPromptArgument[] | null;
}

export interface McpConnectionInfo {
  tools: McpTool[];
  resources: McpResource[];
  prompts: McpPrompt[];
  protocol_version: string;
  server_name: string;
}

export interface McpHistoryItem {
  id: string;
  server_id: string | null;
  method: string;
  params: string | null;
  result: string | null;
  is_error: boolean;
  time_ms: number | null;
  executed_at: string | null;
}
