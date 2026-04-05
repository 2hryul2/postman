import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TitleBar } from "@/components/TitleBar/TitleBar";
import { Sidebar } from "@/components/Sidebar/Sidebar";
import { MainPanel } from "@/components/MainPanel/MainPanel";
import { McpPanel } from "@/components/Mcp/McpPanel";
import { ResizeHandle } from "@/components/shared/ResizeHandle";
import { useUIStore } from "@/stores/useUIStore";
import { useMcpStore } from "@/stores/useMcpStore";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: false,
    },
  },
});

function AppLayout() {
  const { sidebarWidth, setSidebarWidth, sidebarTab } = useUIStore();
  const { activeItem } = useMcpStore();

  const showMcpPanel = sidebarTab === "mcp" && activeItem !== null;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <TitleBar />
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        <Sidebar width={sidebarWidth} />
        <ResizeHandle
          onResize={setSidebarWidth}
          minWidth={160}
          maxWidth={320}
        />
        {showMcpPanel ? <McpPanel /> : <MainPanel />}
      </div>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppLayout />
    </QueryClientProvider>
  );
}

export default App;
