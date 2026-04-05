import type { EnvVariable } from "@/types";

/**
 * Replace {{variable}} placeholders in text using environment variables.
 */
export function substituteEnvVars(text: string, variables: EnvVariable[]): string {
  return text.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    const found = variables.find((v) => v.key === key);
    return found ? found.value : match;
  });
}
