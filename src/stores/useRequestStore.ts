import { create } from "zustand";
import type { HttpMethod, BodyType, AuthType, KeyValuePair } from "@/types";

interface RequestState {
  method: HttpMethod;
  url: string;
  headers: KeyValuePair[];
  params: KeyValuePair[];
  bodyType: BodyType;
  body: string;
  authType: AuthType;
  authConfig: Record<string, string>;
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
};

export const useRequestStore = create<RequestState>((set) => ({
  ...initialState,
  setMethod: (method) => set({ method }),
  setUrl: (url) => set({ url }),
  setHeaders: (headers) => set({ headers }),
  setParams: (params) => set({ params }),
  setBodyType: (bodyType) => set({ bodyType }),
  setBody: (body) => set({ body }),
  setAuthType: (authType) => set({ authType }),
  setAuthConfig: (config) => set({ authConfig: config }),
  reset: () => set(initialState),
}));
