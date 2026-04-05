import { create } from "zustand";
import type { McpServer, McpTool, McpResource, McpPrompt, McpHistoryItem } from "@/types";

type ConnectionStatus = "disconnected" | "connecting" | "connected" | "error";

interface McpServerState {
  status: ConnectionStatus;
  tools: McpTool[];
  resources: McpResource[];
  prompts: McpPrompt[];
  protocolVersion: string;
  serverName: string;
  error: string | null;
}

interface McpState {
  servers: McpServer[];
  serverStates: Record<string, McpServerState>;
  activeServerId: string | null;
  activeItem: { type: "tool" | "resource" | "prompt"; name: string } | null;
  history: McpHistoryItem[];
  setServers: (servers: McpServer[]) => void;
  setActiveServerId: (id: string | null) => void;
  setActiveItem: (item: { type: "tool" | "resource" | "prompt"; name: string } | null) => void;
  setServerState: (serverId: string, state: Partial<McpServerState>) => void;
  setHistory: (history: McpHistoryItem[]) => void;
}

const defaultServerState: McpServerState = {
  status: "disconnected",
  tools: [],
  resources: [],
  prompts: [],
  protocolVersion: "",
  serverName: "",
  error: null,
};

export const useMcpStore = create<McpState>((set) => ({
  servers: [],
  serverStates: {},
  activeServerId: null,
  activeItem: null,
  history: [],
  setServers: (servers) => set({ servers }),
  setActiveServerId: (id) => set({ activeServerId: id, activeItem: null }),
  setActiveItem: (item) => set({ activeItem: item }),
  setServerState: (serverId, state) =>
    set((prev) => ({
      serverStates: {
        ...prev.serverStates,
        [serverId]: { ...(prev.serverStates[serverId] ?? defaultServerState), ...state },
      },
    })),
  setHistory: (history) => set({ history }),
}));
