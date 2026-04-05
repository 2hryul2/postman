import { create } from "zustand";
import type { Collection, ApiRequest } from "@/types";

interface CollectionState {
  collections: Collection[];
  activeCollectionId: string | null;
  activeRequestId: string | null;
  requests: ApiRequest[];
  setCollections: (collections: Collection[]) => void;
  setActiveCollectionId: (id: string | null) => void;
  setActiveRequestId: (id: string | null) => void;
  setRequests: (requests: ApiRequest[]) => void;
}

export const useCollectionStore = create<CollectionState>((set) => ({
  collections: [],
  activeCollectionId: null,
  activeRequestId: null,
  requests: [],
  setCollections: (collections) => set({ collections }),
  setActiveCollectionId: (id) => set({ activeCollectionId: id }),
  setActiveRequestId: (id) => set({ activeRequestId: id }),
  setRequests: (requests) => set({ requests }),
}));
