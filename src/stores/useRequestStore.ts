import { create } from "zustand";
import type { HttpMethod, BodyType, AuthType, KeyValuePair } from "@/types";
import { CONTENT_TYPE_MAP } from "@/lib/helpText";

interface RequestState {
  method: HttpMethod;
  url: string;
  headers: KeyValuePair[];
  params: KeyValuePair[];
  bodyType: BodyType;
  body: string;
  authType: AuthType;
  authConfig: Record<string, string>;
  _syncSource: "url" | "params" | null;
  setMethod: (method: HttpMethod) => void;
  setUrl: (url: string) => void;
  setHeaders: (headers: KeyValuePair[]) => void;
  setParams: (params: KeyValuePair[]) => void;
  setBodyType: (bodyType: BodyType) => void;
  setBody: (body: string) => void;
  setAuthType: (authType: AuthType) => void;
  setAuthConfig: (config: Record<string, string>) => void;
  reset: () => void;
}

const initialState = {
  method: "GET" as HttpMethod,
  url: "",
  headers: [] as KeyValuePair[],
  params: [] as KeyValuePair[],
  bodyType: "json" as BodyType,
  body: "",
  authType: "none" as AuthType,
  authConfig: {} as Record<string, string>,
  _syncSource: null as "url" | "params" | null,
};

// Parse query params from URL
function parseQueryParams(url: string): KeyValuePair[] {
  const qIdx = url.indexOf("?");
  if (qIdx === -1) return [];
  const qs = url.slice(qIdx + 1);
  if (!qs) return [];
  return qs.split("&").map((pair) => {
    const [key, ...rest] = pair.split("=");
    return {
      key: decodeURIComponent(key || ""),
      value: decodeURIComponent(rest.join("=") || ""),
      enabled: true,
    };
  });
}

// Build query string from params and attach to base URL
function buildUrlWithParams(url: string, params: KeyValuePair[]): string {
  const base = url.split("?")[0];
  const enabled = params.filter((p) => p.enabled && p.key);
  if (enabled.length === 0) return base;
  const qs = enabled
    .map((p) => `${encodeURIComponent(p.key)}=${encodeURIComponent(p.value)}`)
    .join("&");
  return `${base}?${qs}`;
}

// Auto-manage Content-Type header
function updateContentTypeHeader(
  headers: KeyValuePair[],
  bodyType: BodyType,
): KeyValuePair[] {
  const contentType = CONTENT_TYPE_MAP[bodyType];
  if (!contentType) return headers;

  const idx = headers.findIndex(
    (h) => h.key.toLowerCase() === "content-type",
  );
  if (idx >= 0) {
    // Update existing
    return headers.map((h, i) =>
      i === idx ? { ...h, value: contentType } : h,
    );
  }
  // Add new
  return [...headers, { key: "Content-Type", value: contentType, enabled: true }];
}

export const useRequestStore = create<RequestState>((set, get) => ({
  ...initialState,
  setMethod: (method) => set({ method }),
  setUrl: (url) => {
    const state = get();
    if (state._syncSource === "params") {
      // Avoid loop: params triggered this
      set({ url, _syncSource: null });
      return;
    }
    // Sync URL -> Params
    const parsed = parseQueryParams(url);
    set({ url, params: parsed, _syncSource: "url" });
    // Reset sync flag async
    setTimeout(() => set({ _syncSource: null }), 0);
  },
  setHeaders: (headers) => set({ headers }),
  setParams: (params) => {
    const state = get();
    if (state._syncSource === "url") {
      // Avoid loop: URL triggered this
      set({ params, _syncSource: null });
      return;
    }
    // Sync Params -> URL
    const newUrl = buildUrlWithParams(state.url, params);
    set({ params, url: newUrl, _syncSource: "params" });
    setTimeout(() => set({ _syncSource: null }), 0);
  },
  setBodyType: (bodyType) => {
    const state = get();
    const headers = updateContentTypeHeader(state.headers, bodyType);
    set({ bodyType, headers });
  },
  setBody: (body) => set({ body }),
  setAuthType: (authType) => set({ authType }),
  setAuthConfig: (config) => set({ authConfig: config }),
  reset: () => set(initialState),
}));
