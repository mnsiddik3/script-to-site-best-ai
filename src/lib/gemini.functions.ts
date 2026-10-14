import { createServerFn } from '@tanstack/react-start';

const INTERACTIONS_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/interactions';

interface GeminiProxyInput {
  apiKey: string;
  model: string;
  input: Array<Record<string, unknown>>;
}

interface GeminiProxyResult {
  ok: boolean;
  status: number;
  bodyText: string;
}

// Browser -> Google direct calls fail with "Failed to fetch" (CORS preflight
// on the Interactions API). Proxy through the server instead. The user-owned
// API key is only used for this single upstream call and is never stored.
export const callGeminiInteraction = createServerFn({ method: 'POST' })
  .inputValidator((data: GeminiProxyInput) => {
    if (!data || typeof data.apiKey !== 'string' || !data.apiKey.trim()) {
      throw new Error('API key is required');
    }
    if (typeof data.model !== 'string' || !data.model.trim()) {
      throw new Error('Model is required');
    }
    if (!Array.isArray(data.input)) {
      throw new Error('Input is required');
    }
    return data;
  })
  .handler(async ({ data }): Promise<GeminiProxyResult> => {
    try {
      const response = await fetch(INTERACTIONS_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': data.apiKey,
        },
        body: JSON.stringify({ model: data.model, input: data.input }),
      });

      const bodyText = await response.text();
      return { ok: response.ok, status: response.status, bodyText };
    } catch (error) {
      return {
        ok: false,
        status: 0,
        bodyText: JSON.stringify({
          error: {
            message: error instanceof Error ? error.message : 'Upstream request failed',
            status: 'UPSTREAM_NETWORK_ERROR',
          },
        }),
      };
    }
  });
