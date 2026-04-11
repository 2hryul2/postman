import type { HttpMethod, BodyType, AuthType, KeyValuePair } from "@/types";

interface CodeGenInput {
  method: HttpMethod;
  url: string;
  headers: KeyValuePair[];
  params: KeyValuePair[];
  body: string;
  bodyType: BodyType;
  authType: AuthType;
  authConfig: Record<string, string>;
}

// --- Helpers ---

function buildFullUrl(url: string, params: KeyValuePair[]): string {
  const enabled = params.filter((p) => p.enabled && p.key);
  if (enabled.length === 0) return url;
  const qs = enabled
    .map((p) => `${encodeURIComponent(p.key)}=${encodeURIComponent(p.value)}`)
    .join("&");
  return url + (url.includes("?") ? "&" : "?") + qs;
}

function collectHeaders(input: CodeGenInput): Record<string, string> {
  const h: Record<string, string> = {};
  input.headers
    .filter((kv) => kv.enabled && kv.key)
    .forEach((kv) => { h[kv.key] = kv.value; });

  // Inject auth
  if (input.authType === "bearer" && input.authConfig.token) {
    h["Authorization"] = `Bearer ${input.authConfig.token}`;
  } else if (input.authType === "basic" && input.authConfig.username) {
    h["Authorization"] = `Basic <base64(${input.authConfig.username}:${input.authConfig.password ?? ""})>`;
  } else if (input.authType === "apikey" && input.authConfig.addTo === "header" && input.authConfig.keyName) {
    h[input.authConfig.keyName] = input.authConfig.keyValue ?? "";
  }
  return h;
}

function hasBody(method: HttpMethod): boolean {
  return !["GET", "HEAD", "OPTIONS"].includes(method);
}

// =====================
//  Python (requests)
// =====================
export function generatePython(input: CodeGenInput): string {
  const lines: string[] = [];
  lines.push("import requests");
  lines.push("import json");
  lines.push("");

  // URL
  const fullUrl = buildFullUrl(input.url, input.params);
  lines.push(`url = "${fullUrl}"`);
  lines.push("");

  // Headers
  const headers = collectHeaders(input);
  if (Object.keys(headers).length > 0) {
    lines.push("headers = {");
    for (const [k, v] of Object.entries(headers)) {
      lines.push(`    "${k}": "${v}",`);
    }
    lines.push("}");
    lines.push("");
  }

  // Basic Auth
  if (input.authType === "basic" && input.authConfig.username) {
    lines.push(`auth = ("${input.authConfig.username}", "${input.authConfig.password ?? ""}")`);
    lines.push("");
  }

  // Body
  const sendBody = hasBody(input.method) && input.body;
  if (sendBody) {
    if (input.bodyType === "json") {
      try {
        const parsed = JSON.parse(input.body);
        lines.push(`payload = ${JSON.stringify(parsed, null, 4)}`);
      } catch {
        lines.push(`payload = ${JSON.stringify(input.body)}`);
      }
    } else {
      lines.push(`payload = ${JSON.stringify(input.body)}`);
    }
    lines.push("");
  }

  // Request
  const args: string[] = ["url"];
  if (Object.keys(headers).length > 0) args.push("headers=headers");
  if (input.authType === "basic" && input.authConfig.username) args.push("auth=auth");
  if (sendBody) {
    args.push(input.bodyType === "json" ? "json=payload" : "data=payload");
  }

  lines.push(`response = requests.${input.method.toLowerCase()}(`);
  lines.push(`    ${args.join(",\n    ")}`);
  lines.push(")");
  lines.push("");

  // Response handling
  lines.push("# 응답 처리");
  lines.push(`print(f"Status: {response.status_code}")`);
  lines.push(`print(f"Time: {response.elapsed.total_seconds() * 1000:.0f}ms")`);
  lines.push("");
  lines.push("try:");
  lines.push("    data = response.json()");
  lines.push("    print(json.dumps(data, indent=2, ensure_ascii=False))");
  lines.push("except ValueError:");
  lines.push("    print(response.text)");

  return lines.join("\n");
}

// =====================
//  Java (HttpClient)
// =====================
export function generateJava(input: CodeGenInput): string {
  const lines: string[] = [];
  const headers = collectHeaders(input);
  const fullUrl = buildFullUrl(input.url, input.params);
  const sendBody = hasBody(input.method) && input.body;

  lines.push("import java.net.URI;");
  lines.push("import java.net.http.HttpClient;");
  lines.push("import java.net.http.HttpRequest;");
  lines.push("import java.net.http.HttpResponse;");
  if (input.authType === "basic") {
    lines.push("import java.util.Base64;");
  }
  lines.push("");
  lines.push("public class ApiExample {");
  lines.push("    public static void main(String[] args) throws Exception {");
  lines.push("        HttpClient client = HttpClient.newHttpClient();");
  lines.push("");

  // Body
  if (sendBody) {
    const escaped = input.body
      .replace(/\\/g, "\\\\")
      .replace(/"/g, '\\"')
      .replace(/\n/g, "\\n");
    lines.push(`        String body = "${escaped}";`);
    lines.push("");
  }

  // Build request
  lines.push("        HttpRequest request = HttpRequest.newBuilder()");
  lines.push(`            .uri(URI.create("${fullUrl}"))`);

  // Method + body
  if (sendBody) {
    lines.push(`            .method("${input.method}", HttpRequest.BodyPublishers.ofString(body))`);
  } else if (input.method === "GET") {
    lines.push("            .GET()");
  } else if (input.method === "DELETE") {
    lines.push("            .DELETE()");
  } else {
    lines.push(`            .method("${input.method}", HttpRequest.BodyPublishers.noBody())`);
  }

  // Headers
  for (const [k, v] of Object.entries(headers)) {
    if (k.toLowerCase() === "authorization" && input.authType === "basic") {
      lines.push(`            .header("Authorization", "Basic " + Base64.getEncoder().encodeToString("${input.authConfig.username}:${input.authConfig.password ?? ""}".getBytes()))`);
    } else {
      lines.push(`            .header("${k}", "${v}")`);
    }
  }

  lines.push("            .build();");
  lines.push("");

  // Send
  lines.push("        HttpResponse<String> response = client.send(");
  lines.push("            request, HttpResponse.BodyHandlers.ofString()");
  lines.push("        );");
  lines.push("");

  // Response
  lines.push("        // 응답 처리");
  lines.push('        System.out.println("Status: " + response.statusCode());');
  lines.push('        System.out.println("Body: " + response.body());');

  lines.push("    }");
  lines.push("}");

  return lines.join("\n");
}

// =====================
//  C# (HttpClient)
// =====================
export function generateCSharp(input: CodeGenInput): string {
  const lines: string[] = [];
  const headers = collectHeaders(input);
  const fullUrl = buildFullUrl(input.url, input.params);
  const sendBody = hasBody(input.method) && input.body;

  lines.push("using System;");
  lines.push("using System.Net.Http;");
  lines.push("using System.Net.Http.Headers;");
  lines.push("using System.Text;");
  lines.push("using System.Threading.Tasks;");
  lines.push("");
  lines.push("class Program");
  lines.push("{");
  lines.push("    static async Task Main(string[] args)");
  lines.push("    {");
  lines.push("        using var client = new HttpClient();");
  lines.push("");

  // Headers (except Content-Type & Authorization)
  for (const [k, v] of Object.entries(headers)) {
    const kl = k.toLowerCase();
    if (kl === "content-type") continue; // handled by StringContent
    if (kl === "authorization" && input.authType === "basic") {
      lines.push(`        var credentials = Convert.ToBase64String(Encoding.UTF8.GetBytes("${input.authConfig.username}:${input.authConfig.password ?? ""}"));`);
      lines.push(`        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Basic", credentials);`);
    } else if (kl === "authorization") {
      const parts = v.split(" ");
      if (parts.length === 2) {
        lines.push(`        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("${parts[0]}", "${parts[1]}");`);
      } else {
        lines.push(`        client.DefaultRequestHeaders.Add("${k}", "${v}");`);
      }
    } else {
      lines.push(`        client.DefaultRequestHeaders.Add("${k}", "${v}");`);
    }
  }
  lines.push("");

  // Body & content type
  const contentType = headers["Content-Type"] || headers["content-type"] || "application/json";

  if (sendBody) {
    const escaped = input.body.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\n/g, "\\n");
    lines.push(`        var json = "${escaped}";`);
    lines.push(`        var content = new StringContent(json, Encoding.UTF8, "${contentType}");`);
    lines.push("");
  }

  // Send
  const methodMap: Record<string, string> = {
    GET: "GetAsync",
    POST: "PostAsync",
    PUT: "PutAsync",
    DELETE: "DeleteAsync",
    PATCH: "PatchAsync",
  };

  const url = `"${fullUrl}"`;

  if (input.method === "GET") {
    lines.push(`        var response = await client.GetAsync(${url});`);
  } else if (input.method === "DELETE" && !sendBody) {
    lines.push(`        var response = await client.DeleteAsync(${url});`);
  } else if (methodMap[input.method] && sendBody) {
    lines.push(`        var response = await client.${methodMap[input.method]}(${url}, content);`);
  } else {
    lines.push(`        var request = new HttpRequestMessage(HttpMethod.${input.method.charAt(0) + input.method.slice(1).toLowerCase()}, ${url});`);
    if (sendBody) {
      lines.push("        request.Content = content;");
    }
    lines.push("        var response = await client.SendAsync(request);");
  }
  lines.push("");

  // Response
  lines.push("        // 응답 처리");
  lines.push("        var body = await response.Content.ReadAsStringAsync();");
  lines.push('        Console.WriteLine($"Status: {(int)response.StatusCode} {response.ReasonPhrase}");');
  lines.push('        Console.WriteLine($"Body: {body}");');

  lines.push("    }");
  lines.push("}");

  return lines.join("\n");
}

// =====================
//  cURL (Windows CMD 호환 — 한 줄 명령)
// =====================
export function generateCurl(input: CodeGenInput): string {
  const parts: string[] = [];
  const fullUrl = buildFullUrl(input.url, input.params);
  const headers = collectHeaders(input);
  const sendBody = hasBody(input.method) && input.body;

  parts.push(`curl -X ${input.method}`);
  parts.push(`"${fullUrl}"`);

  // Headers
  for (const [k, v] of Object.entries(headers)) {
    if (k.toLowerCase() === "authorization" && input.authType === "basic") {
      parts.push(`-u "${input.authConfig.username}:${input.authConfig.password ?? ""}"`);
    } else {
      parts.push(`-H "${k}: ${v}"`);
    }
  }

  // Body — Windows CMD는 작은따옴표를 지원하지 않으므로 큰따옴표 사용
  if (sendBody) {
    const escaped = input.body
      .replace(/\r?\n/g, "")   // 줄바꿈 제거
      .replace(/"/g, '\\"');   // 큰따옴표 이스케이프
    parts.push(`-d "${escaped}"`);
  }

  return parts.join(" ");
}

export type CodeLang = "curl" | "python" | "java" | "csharp";

export function generateCode(lang: CodeLang, input: CodeGenInput): string {
  switch (lang) {
    case "curl": return generateCurl(input);
    case "python": return generatePython(input);
    case "java": return generateJava(input);
    case "csharp": return generateCSharp(input);
  }
}
