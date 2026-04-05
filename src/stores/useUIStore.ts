import { create } from "zustand";

type RequestTab = "params" | "headers" | "body" | "auth";
type ResponseTab = "body" | "headers" | "cookies" | "timing";

interface UIState {
  sidebarWidth: number;
  sidebarVisible: boolean;
  activeRequestTab: RequestTab;
  activeResponseTab: ResponseTab;
  setSidebarWidth: (width: number) => void;
  setSidebarVisible: (visible: boolean) => void;
  setActiveRequestTab: (tab: RequestTab) => void;
  setActiveResponseTab: (tab: ResponseTab) => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarWidth: 220,
  sidebarVisible: true,
  activeRequestTab: "params",
  activeResponseTab: "body",
  setSidebarWidth: (width) => set({ sidebarWidth: width }),
  setSidebarVisible: (visible) => set({ sidebarVisible: visible }),
  setActiveRequestTab: (tab) => set({ activeRequestTab: tab }),
  setActiveResponseTab: (tab) => set({ activeResponseTab: tab }),
}));
