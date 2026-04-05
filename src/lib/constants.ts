import type { HttpMethod } from "@/types";

export const METHOD_COLORS: Record<HttpMethod, { bg: string; text: string }> = {
  GET: { bg: "#e1f5ee", text: "#0f6e56" },
  POST: { bg: "#e6f1fb", text: "#185fa5" },
  PUT: { bg: "#faeeda", text: "#854f0b" },
  DELETE: { bg: "#fcebeb", text: "#a32d2d" },
  PATCH: { bg: "#fbeaf0", text: "#993556" },
  HEAD: { bg: "#f0f0f0", text: "#555555" },
  OPTIONS: { bg: "#f0f0f0", text: "#555555" },
};

export const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  "2xx": { bg: "#eaf3de", text: "#3b6d11" },
  "4xx": { bg: "#fcebeb", text: "#a32d2d" },
  "5xx": { bg: "#faeeda", text: "#854f0b" },
};

export const HTTP_METHODS: HttpMethod[] = [
  "GET", "POST", "PUT", "DELETE", "PATCH", "HEAD", "OPTIONS",
];

export const AUTH_TYPES = [
  { value: "none", label: "없음" },
  { value: "bearer", label: "Bearer Token" },
  { value: "basic", label: "Basic Auth" },
  { value: "apikey", label: "API Key" },
] as const;

export const BODY_TYPES = [
  { value: "json", label: "JSON" },
  { value: "form", label: "form-data" },
  { value: "raw", label: "raw" },
  { value: "binary", label: "binary" },
] as const;

export function getStatusCategory(status: number): string {
  if (status >= 200 && status < 300) return "2xx";
  if (status >= 400 && status < 500) return "4xx";
  return "5xx";
}
