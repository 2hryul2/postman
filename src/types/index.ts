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
