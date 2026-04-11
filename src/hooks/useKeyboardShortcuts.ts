import { useEffect } from "react";
import { useSendRequest } from "@/hooks/useSendRequest";

export function useKeyboardShortcuts() {
  const sendRequest = useSendRequest();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Ctrl+L: Focus URL input
      if (e.ctrlKey && e.key === "l") {
        e.preventDefault();
        const urlInput = document.querySelector<HTMLInputElement>('input[placeholder*="api.example"]');
        urlInput?.focus();
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [sendRequest]);
}
