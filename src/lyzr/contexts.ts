/**
 * Lyzr Contexts client (host: agent-prod / rag — same base as agent v3 API).
 * Contexts are named key/value strings usable as shared config/state.
 */
import { LyzrHttp, LyzrApiError, normalizeList } from "./http.js";

export { LyzrApiError };

export interface CreateContextInput {
  name: string;
  value: string;
}

export interface UpdateContextInput {
  name?: string;
  value?: string;
}

export interface ContextResponse {
  _id: string;
  name: string;
  value: string;
  created_at: string;
  updated_at: string;
  [key: string]: unknown;
}

export class ContextsClient extends LyzrHttp {
  /** Create a context. POST /v3/contexts/ */
  createContext(
    input: CreateContextInput,
    signal?: AbortSignal,
  ): Promise<Record<string, unknown>> {
    return this.request<Record<string, unknown>>("POST", "/v3/contexts/", {
      body: input,
      signal,
    });
  }

  /** List contexts. GET /v3/contexts/ */
  async listContexts(
    params?: { skip?: number; limit?: number },
    signal?: AbortSignal,
  ): Promise<ContextResponse[]> {
    const raw = await this.request<unknown>("GET", "/v3/contexts/", {
      params,
      signal,
    });
    return normalizeList<ContextResponse>(raw, "contexts");
  }

  /** Get contexts count. GET /v3/contexts/count */
  getContextsCount(signal?: AbortSignal): Promise<Record<string, unknown>> {
    return this.request<Record<string, unknown>>(
      "GET",
      "/v3/contexts/count",
      { signal },
    );
  }

  /** Get context usage. GET /v3/contexts/{context_id}/usage */
  getContextUsage(
    contextId: string,
    signal?: AbortSignal,
  ): Promise<Record<string, unknown>> {
    return this.request<Record<string, unknown>>(
      "GET",
      `/v3/contexts/${encodeURIComponent(contextId)}/usage`,
      { signal },
    );
  }

  /** Get one context. GET /v3/contexts/{context_id} */
  getContext(
    contextId: string,
    signal?: AbortSignal,
  ): Promise<ContextResponse> {
    return this.request<ContextResponse>(
      "GET",
      `/v3/contexts/${encodeURIComponent(contextId)}`,
      { signal },
    );
  }

  /** Update a context. PUT /v3/contexts/{context_id} */
  updateContext(
    contextId: string,
    input: UpdateContextInput,
    signal?: AbortSignal,
  ): Promise<Record<string, unknown>> {
    return this.request<Record<string, unknown>>(
      "PUT",
      `/v3/contexts/${encodeURIComponent(contextId)}`,
      { body: input, signal },
    );
  }

  /** Delete a context. DELETE /v3/contexts/{context_id} */
  deleteContext(
    contextId: string,
    signal?: AbortSignal,
  ): Promise<Record<string, unknown>> {
    return this.request<Record<string, unknown>>(
      "DELETE",
      `/v3/contexts/${encodeURIComponent(contextId)}`,
      { signal },
    );
  }

  /** Get a context by name (internal, requires api_key query param). GET /v3/contexts/internal/name/{context_name} */
  getContextByNameInternal(
    contextName: string,
    apiKey: string,
    signal?: AbortSignal,
  ): Promise<unknown> {
    return this.request<unknown>(
      "GET",
      `/v3/contexts/internal/name/${encodeURIComponent(contextName)}`,
      { params: { api_key: apiKey }, signal },
    );
  }

  /** Get a context's value by name (internal, requires api_key query param). GET /v3/contexts/internal/value/{context_name} */
  getContextValueInternal(
    contextName: string,
    apiKey: string,
    signal?: AbortSignal,
  ): Promise<unknown> {
    return this.request<unknown>(
      "GET",
      `/v3/contexts/internal/value/${encodeURIComponent(contextName)}`,
      { params: { api_key: apiKey }, signal },
    );
  }

  /** Get multiple context values by name (internal, requires api_key query param). POST /v3/contexts/internal/batch-values */
  getMultipleContextValuesInternal(
    contextNames: string[],
    apiKey: string,
    signal?: AbortSignal,
  ): Promise<unknown> {
    return this.request<unknown>(
      "POST",
      "/v3/contexts/internal/batch-values",
      { params: { api_key: apiKey }, body: contextNames, signal },
    );
  }
}
