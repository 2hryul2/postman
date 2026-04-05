import { useRequestStore } from "@/stores/useRequestStore";
import { useResponseStore } from "@/stores/useResponseStore";
import { useEnvironmentStore } from "@/stores/useEnvironmentStore";
import { api } from "@/lib/tauri";
import { substituteEnvVars } from "@/lib/envSubstitute";

export function useSendRequest() {
  const reqStore = useRequestStore();
  const { setResponse, setIsLoading, setError } = useResponseStore();
  const { variables } = useEnvironmentStore();

  const send = async () => {
    const { method, url, params, headers, body, bodyType, authType, authConfig } = reqStore;

    if (!url.trim()) {
      setError("URL을 입력하세요");
      return;
    }

    setIsLoading(true);
    setResponse(null);

    try {
      // Apply env variable substitution
      const sub = (text: string) => substituteEnvVars(text, variables);

      // Build query string from enabled params
      let finalUrl = sub(url);
      const enabledParams = params.filter((p) => p.enabled && p.key);
      if (enabledParams.length > 0) {
        const qs = enabledParams
          .map((p) => `${encodeURIComponent(sub(p.key))}=${encodeURIComponent(sub(p.value))}`)
          .join("&");
        finalUrl += (finalUrl.includes("?") ? "&" : "?") + qs;
      }

      // Build headers from enabled items
      const headerMap: Record<string, string> = {};
      headers.filter((h) => h.enabled && h.key).forEach((h) => {
        headerMap[sub(h.key)] = sub(h.value);
      });

      // Inject auth headers
      if (authType === "bearer" && authConfig.token) {
        headerMap["Authorization"] = `Bearer ${sub(authConfig.token)}`;
      } else if (authType === "basic" && authConfig.username) {
        const encoded = btoa(`${sub(authConfig.username)}:${sub(authConfig.password ?? "")}`);
        headerMap["Authorization"] = `Basic ${encoded}`;
      } else if (authType === "apikey" && authConfig.keyName && authConfig.keyValue) {
        if (authConfig.addTo === "query") {
          finalUrl += (finalUrl.includes("?") ? "&" : "?") +
            `${encodeURIComponent(sub(authConfig.keyName))}=${encodeURIComponent(sub(authConfig.keyValue))}`;
        } else {
          headerMap[sub(authConfig.keyName)] = sub(authConfig.keyValue);
        }
      }

      // Set content-type for body if not already set
      let bodyStr: string | undefined;
      if (method !== "GET" && method !== "HEAD" && body) {
        bodyStr = sub(body);
        if (bodyType === "json" && !headerMap["Content-Type"] && !headerMap["content-type"]) {
          headerMap["Content-Type"] = "application/json";
        }
      }

      const result = await api.executeRequest({
        method,
        url: finalUrl,
        headers: headerMap,
        body: bodyStr,
        tlsSkipVerify: true,
        timeoutMs: 30000,
      });

      setResponse(result);
    } catch (err) {
      setError(String(err));
    } finally {
      setIsLoading(false);
    }
  };

  return send;
}
