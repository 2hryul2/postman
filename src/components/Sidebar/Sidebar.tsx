import { useEffect, useState, useCallback } from "react";
import { open, save } from "@tauri-apps/plugin-dialog";
import { useCollectionStore } from "@/stores/useCollectionStore";
import { useRequestStore } from "@/stores/useRequestStore";
import { useEnvironmentStore } from "@/stores/useEnvironmentStore";
import { api } from "@/lib/tauri";
import { generateId } from "@/lib/uuid";
import { METHOD_COLORS, STATUS_COLORS, getStatusCategory } from "@/lib/constants";
import type { HttpMethod, Collection, ApiRequest, HistoryItem } from "@/types";
import { EnvManager } from "./EnvManager";
import styles from "./Sidebar.module.css";

interface SidebarProps {
  width: number;
}

export function Sidebar({ width }: SidebarProps) {
  const {
    collections, setCollections,
    activeCollectionId, setActiveCollectionId,
    activeRequestId, setActiveRequestId,
    requests, setRequests,
  } = useCollectionStore();
  const { environments, activeEnvironmentId, setEnvironments, setActiveEnvironmentId, setVariables } = useEnvironmentStore();
  const reqStore = useRequestStore();
  const [search, setSearch] = useState("");
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [sidebarTab, setSidebarTab] = useState<"collections" | "history">("collections");
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
  const [envManagerOpen, setEnvManagerOpen] = useState(false);

  // Load collections on mount
  useEffect(() => {
    api.getCollections().then(setCollections).catch(console.error);
    api.getEnvironments().then(setEnvironments).catch(console.error);
  }, [setCollections, setEnvironments]);

  // Load history when tab changes
  useEffect(() => {
    if (sidebarTab === "history") {
      api.getHistory(50, 0).then(setHistoryItems).catch(console.error);
    }
  }, [sidebarTab]);

  // Load requests when active collection changes
  useEffect(() => {
    if (activeCollectionId) {
      api.getRequests(activeCollectionId).then(setRequests).catch(console.error);
    }
  }, [activeCollectionId, setRequests]);

  // Load variables when active environment changes
  useEffect(() => {
    if (activeEnvironmentId) {
      api.getEnvVariables(activeEnvironmentId).then(setVariables).catch(console.error);
    } else {
      setVariables([]);
    }
  }, [activeEnvironmentId, setVariables]);

  const toggleFolder = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    setActiveCollectionId(id);
  };

  const createCollection = useCallback(async () => {
    const name = prompt("컬렉션 이름:");
    if (!name) return;
    const col: Collection = {
      id: generateId(),
      name,
      parent_id: null,
      sort_order: collections.length,
      created_at: null,
    };
    await api.saveCollection(col);
    const updated = await api.getCollections();
    setCollections(updated);
    setExpandedIds((prev) => new Set(prev).add(col.id));
    setActiveCollectionId(col.id);
  }, [collections.length, setCollections, setActiveCollectionId]);

  const createRequest = useCallback(async (collectionId: string) => {
    const req: ApiRequest = {
      id: generateId(),
      collection_id: collectionId,
      name: "새 요청",
      method: "GET",
      url: "",
      headers: null,
      params: null,
      body_type: null,
      body: null,
      auth_type: null,
      auth_config: null,
      sort_order: requests.length,
      created_at: null,
      updated_at: null,
    };
    await api.saveRequest(req);
    const updated = await api.getRequests(collectionId);
    setRequests(updated);
    selectRequest(req);
  }, [requests.length, setRequests]);

  const selectRequest = (req: ApiRequest) => {
    setActiveRequestId(req.id);
    reqStore.setMethod(req.method);
    reqStore.setUrl(req.url);
    reqStore.setHeaders(req.headers ? JSON.parse(req.headers) : []);
    reqStore.setParams(req.params ? JSON.parse(req.params) : []);
    reqStore.setBody(req.body ?? "");
    reqStore.setBodyType(req.body_type ?? "json");
    reqStore.setAuthType(req.auth_type ?? "none");
    reqStore.setAuthConfig(req.auth_config ? JSON.parse(req.auth_config) : {});
  };

  const deleteCollection = useCallback(async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("이 컬렉션을 삭제하시겠습니까?")) return;
    await api.deleteCollection(id);
    const updated = await api.getCollections();
    setCollections(updated);
    if (activeCollectionId === id) {
      setActiveCollectionId(null);
      setRequests([]);
    }
  }, [activeCollectionId, setCollections, setActiveCollectionId, setRequests]);

  // Import Postman collection
  const handleImport = useCallback(async () => {
    const file = await open({
      multiple: false,
      filters: [{ name: "Postman Collection", extensions: ["json"] }],
    });
    if (!file) return;
    const filePath = typeof file === "string" ? file : file;
    await api.importPostmanCollection(filePath as string);
    const updated = await api.getCollections();
    setCollections(updated);
  }, [setCollections]);

  // Export collection
  const handleExport = useCallback(async (collectionId: string, collectionName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const filePath = await save({
      defaultPath: `${collectionName}.json`,
      filters: [{ name: "Postman Collection", extensions: ["json"] }],
    });
    if (!filePath) return;
    await api.exportPostmanCollection(collectionId, filePath);
  }, []);

  // Filter collections by search
  const filtered = search
    ? collections.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()))
    : collections;

  return (
    <div className={styles.sidebar} style={{ width }}>
      <div className={styles.header}>
        <input
          className={styles.search}
          type="text"
          placeholder="컬렉션 검색..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button className={styles.newBtn} onClick={createCollection}>
          + 새 컬렉션
        </button>
        <button className={styles.importBtn} onClick={handleImport}>
          가져오기 (Postman)
        </button>
      </div>

      <div className={styles.tabRow}>
        <button
          className={`${styles.sidebarTabBtn} ${sidebarTab === "collections" ? styles.sidebarTabActive : ""}`}
          onClick={() => setSidebarTab("collections")}
        >
          컬렉션
        </button>
        <button
          className={`${styles.sidebarTabBtn} ${sidebarTab === "history" ? styles.sidebarTabActive : ""}`}
          onClick={() => setSidebarTab("history")}
        >
          히스토리
        </button>
      </div>

      <div className={styles.collections}>
        {sidebarTab === "collections" && <div className={styles.sectionLabel}>COLLECTIONS</div>}
        {sidebarTab === "history" && (
          historyItems.length === 0 ? (
            <div className={styles.empty}>히스토리가 없습니다</div>
          ) : (
            historyItems.map((item) => {
              const methodColors = METHOD_COLORS[(item.method ?? "GET") as HttpMethod] ?? METHOD_COLORS.GET;
              const statusCat = item.response_status ? getStatusCategory(item.response_status) : "5xx";
              const statusColors = STATUS_COLORS[statusCat] ?? STATUS_COLORS["5xx"];
              return (
                <div
                  key={item.id}
                  className={styles.historyItem}
                  onClick={() => {
                    reqStore.setMethod((item.method ?? "GET") as HttpMethod);
                    reqStore.setUrl(item.url ?? "");
                    setSidebarTab("collections");
                  }}
                >
                  <span
                    className={styles.methodBadge}
                    style={{ background: methodColors.bg, color: methodColors.text }}
                  >
                    {(item.method ?? "GET").substring(0, 3)}
                  </span>
                  <span className={styles.historyUrl}>{item.url}</span>
                  {item.response_status && (
                    <span
                      className={styles.historyStatus}
                      style={{ color: statusColors.text }}
                    >
                      {item.response_status}
                    </span>
                  )}
                </div>
              );
            })
          )
        )}
        {sidebarTab === "collections" && filtered.length === 0 ? (
          <div className={styles.empty}>컬렉션이 없습니다</div>
        ) : sidebarTab === "collections" && (
          filtered.map((col) => (
            <div key={col.id} className={styles.folder}>
              <div
                className={styles.folderHeader}
                onClick={() => toggleFolder(col.id)}
              >
                <span className={styles.arrow}>
                  {expandedIds.has(col.id) ? "\u25BC" : "\u25B6"}
                </span>
                <span className={styles.folderName}>{col.name}</span>
                <button
                  className={styles.addReqBtn}
                  onClick={(e) => { e.stopPropagation(); createRequest(col.id); }}
                  title="요청 추가"
                >
                  +
                </button>
                <button
                  className={styles.exportBtn}
                  onClick={(e) => handleExport(col.id, col.name, e)}
                  title="Postman 내보내기"
                >
                  &#x2913;
                </button>
                <button
                  className={styles.deleteColBtn}
                  onClick={(e) => deleteCollection(col.id, e)}
                  title="삭제"
                >
                  &times;
                </button>
              </div>
              {expandedIds.has(col.id) && activeCollectionId === col.id && (
                <div className={styles.requestList}>
                  {requests.map((req) => {
                    const methodColors = METHOD_COLORS[req.method as HttpMethod] ?? METHOD_COLORS.GET;
                    return (
                      <div
                        key={req.id}
                        className={`${styles.requestItem} ${activeRequestId === req.id ? styles.active : ""}`}
                        onClick={() => selectRequest(req)}
                      >
                        <span
                          className={styles.methodBadge}
                          style={{ background: methodColors.bg, color: methodColors.text }}
                        >
                          {req.method.substring(0, 3)}
                        </span>
                        <span className={styles.requestName}>{req.name}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      <div className={styles.envBar}>
        <span className={styles.statusDot} />
        <select
          className={styles.envSelect}
          value={activeEnvironmentId ?? ""}
          onChange={(e) => setActiveEnvironmentId(e.target.value || null)}
        >
          <option value="">환경 없음</option>
          {environments.map((env) => (
            <option key={env.id} value={env.id}>{env.name}</option>
          ))}
        </select>
        <button
          className={styles.envEditBtn}
          onClick={() => setEnvManagerOpen(true)}
          title="환경 관리"
        >
          &#x2699;
        </button>
      </div>

      {envManagerOpen && (
        <EnvManager onClose={() => setEnvManagerOpen(false)} />
      )}
    </div>
  );
}
