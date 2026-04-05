import { create } from "zustand";
import type { ResponsePayload } from "@/types";

interface ResponseState {
  response: ResponsePayload | null;
  isLoading: boolean;
  error: string | null;
  setResponse: (response: ResponsePayload | null) => void;
  setIsLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useResponseStore = create<ResponseState>((set) => ({
  response: null,
  isLoading: false,
  error: null,
  setResponse: (response) => set({ response, error: null }),
  setIsLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error, isLoading: false }),
}));
