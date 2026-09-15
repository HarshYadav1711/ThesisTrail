export type LlmProviderConfig = {
  readonly endpoint: string;
  readonly model: string;
  readonly apiKey: string;
};

/**
 * Read optional server-only OpenAI-compatible provider settings.
 * All three variables must be non-empty; otherwise interpretation uses fallback.
 * Never expose these values to the client.
 */
export function readLlmProviderConfig(
  env: Record<string, string | undefined> = process.env,
): LlmProviderConfig | null {
  const endpoint = env.THESISTRAIL_LLM_ENDPOINT?.trim() ?? "";
  const model = env.THESISTRAIL_LLM_MODEL?.trim() ?? "";
  const apiKey = env.THESISTRAIL_LLM_API_KEY?.trim() ?? "";

  if (!endpoint || !model || !apiKey) {
    return null;
  }

  let parsed: URL;
  try {
    parsed = new URL(endpoint);
  } catch {
    return null;
  }

  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    return null;
  }

  return { endpoint, model, apiKey };
}

export function isLlmConfigured(
  env: Record<string, string | undefined> = process.env,
): boolean {
  return readLlmProviderConfig(env) !== null;
}
