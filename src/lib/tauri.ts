import { invoke } from "@tauri-apps/api/core";
import type {
  Collection,
  ApiRequest,
  Environment,
  EnvVariable,
  HistoryItem,
  ResponsePayload,
  McpServer,
  McpTool,
  McpResource,
  McpPrompt,
  McpConnectionInfo,
  McpHistoryItem,
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
  saveEnvironment: (environment: Environment) =>
    invoke<void>("save_environment", { environment }),
  deleteEnvironment: (id: string) =>
    invoke<void>("delete_environment", { id }),
  saveEnvVariable: (variable: EnvVariable) =>
    invoke<void>("save_env_variable", { variable }),
  deleteEnvVariable: (id: string) =>
    invoke<void>("delete_env_variable", { id }),

  getHistory: (limit: number, offset: number) =>
    invoke<HistoryItem[]>("get_history", { limit, offset }),

  importPostmanCollection: (filePath: string) =>
    invoke<void>("import_postman_collection", { filePath }),
  exportPostmanCollection: (collectionId: string, filePath: string) =>
    invoke<void>("export_postman_collection", { collectionId, filePath }),

  // MCP
  mcpGetServers: () => invoke<McpServer[]>("mcp_get_servers"),
  mcpSaveServer: (server: McpServer) => invoke<void>("mcp_save_server", { server }),
  mcpDeleteServer: (id: string) => invoke<void>("mcp_delete_server", { id }),
  mcpConnect: (serverId: string) => invoke<McpConnectionInfo>("mcp_connect", { serverId }),
  mcpDisconnect: (serverId: string) => invoke<void>("mcp_disconnect", { serverId }),
  mcpToolsList: (serverId: string) => invoke<McpTool[]>("mcp_tools_list", { serverId }),
  mcpToolsCall: (serverId: string, name: string, arguments_: Record<string, unknown>) =>
    invoke<unknown>("mcp_tools_call", { serverId, name, arguments: arguments_ }),
  mcpResourcesList: (serverId: string) => invoke<McpResource[]>("mcp_resources_list", { serverId }),
  mcpResourcesRead: (serverId: string, uri: string) =>
    invoke<unknown>("mcp_resources_read", { serverId, uri }),
  mcpPromptsList: (serverId: string) => invoke<McpPrompt[]>("mcp_prompts_list", { serverId }),
  mcpPromptsGet: (serverId: string, name: string, arguments_: Record<string, unknown>) =>
    invoke<unknown>("mcp_prompts_get", { serverId, name, arguments: arguments_ }),
  mcpGetHistory: (serverId: string, limit: number) =>
    invoke<McpHistoryItem[]>("mcp_get_history", { serverId, limit }),
};
