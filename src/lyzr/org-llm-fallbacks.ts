/**
 * Lyzr Org LLM Fallbacks client.
 * Manages the org-wide ordered list of LLM fallback entries used when a
 * primary model fails.
 */
import { LyzrHttp } from "./http.js";

export interface FallbackEntry {
  priority: number;
  provider_id: string;
  model: string;
  credential_id: string;
  [key: string]: unknown;
}

export interface UpdateOrgLlmFallbacksInput {
  fallbacks: FallbackEntry[];
}

export interface OrgLlmFallbacksResult {
  fallbacks?: FallbackEntry[];
  [key: string]: unknown;
}

export class OrgLlmFallbacksClient extends LyzrHttp {
  /** Get org LLM fallbacks. GET /v3/org/llm-fallbacks */
  async getLlmFallbacks(
    signal?: AbortSignal,
  ): Promise<OrgLlmFallbacksResult> {
    return this.request<OrgLlmFallbacksResult>(
      "GET",
      "/v3/org/llm-fallbacks",
      { signal },
    );
  }

  /** Update org LLM fallbacks. PUT /v3/org/llm-fallbacks */
  async updateLlmFallbacks(
    input: UpdateOrgLlmFallbacksInput,
    signal?: AbortSignal,
  ): Promise<OrgLlmFallbacksResult> {
    return this.request<OrgLlmFallbacksResult>(
      "PUT",
      "/v3/org/llm-fallbacks",
      { body: input, signal },
    );
  }
}
