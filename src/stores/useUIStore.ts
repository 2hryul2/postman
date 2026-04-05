import { create } from "zustand";

type RequestTab = "params" | "headers" | "body" | "auth";
type ResponseTab = "body" | "headers" | "cookies" | "timing";
type SidebarTab = "collections" | "history" | "mcp";

interface UIState {
  sidebarWidth: number;
  sidebarVisible: boolean;
  sidebarTab: SidebarTab;
  activeRequestTab: RequestTab;
  activeResponseTab: ResponseTab;
  setSidebarWidth: (width: number) => void;
  setSidebarVisible: (visible: boolean) => void;
  setSidebarTab: (tab: SidebarTab) => void;
  setActiveRequestTab: (tab: RequestTab) => void;
  setActiveResponseTab: (tab: ResponseTab) => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarWidth: 220,
  sidebarVisible: true,
  sidebarTab: "collections",
  activeRequestTab: "params",
  activeResponseTab: "body",
  setSidebarWidth: (width) => set({ sidebarWidth: width }),
  setSidebarVisible: (visible) => set({ sidebarVisible: visible }),
  setSidebarTab: (tab) => set({ sidebarTab: tab }),
  setActiveRequestTab: (tab) => set({ activeRequestTab: tab }),
  setActiveResponseTab: (tab) => set({ activeResponseTab: tab }),
}));
