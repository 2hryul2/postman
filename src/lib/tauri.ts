import { invoke } from "@tauri-apps/api/core";
import type {
  Collection,
  ApiRequest,
  Environment,
  EnvVariable,
  HistoryItem,
  ResponsePayload,
} from "@/types";

export const api = {
  executeRequest: (params: {
    method: string;
    url: string;
    headers: Record<string, string>;
    body?: string;
    tlsSkipVerify: boolean;
    timeoutMs: number;
  }) => invoke<ResponsePayload>("execute_request", params),

  getCollections: () => invoke<Collection[]>("get_collections"),

  saveCollection: (collection: Collection) =>
    invoke<void>("save_collection", { collection }),

  deleteCollection: (id: string) =>
    invoke<void>("delete_collection", { id }),

  getRequests: (collectionId: string) =>
    invoke<ApiRequest[]>("get_requests", { collectionId }),

  saveRequest: (request: ApiRequest) =>
    invoke<void>("save_request", { request }),

  getEnvironments: () => invoke<Environment[]>("get_environments"),

  getEnvVariables: (environmentId: string) =>
    invoke<EnvVariable[]>("get_env_variables", { environmentId }),

  getHistory: (limit: number, offset: number) =>
    invoke<HistoryItem[]>("get_history", { limit, offset }),

  importPostmanCollection: (filePath: string) =>
    invoke<void>("import_postman_collection", { filePath }),

  exportPostmanCollection: (collectionId: string, filePath: string) =>
    invoke<void>("export_postman_collection", { collectionId, filePath }),
};
