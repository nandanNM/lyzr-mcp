/**
 * KB Sync — Connector-Credential Pairs client — host: rag.
 * Endpoints/shapes confirmed against the RAG OpenAPI schema.
 */
import { LyzrHttp, normalizeList } from "./http.js";

export interface CcPairCreateInput {
  connector_id: number;
  credential_id: string;
  name?: string | null;
  rag_id?: string | null;
}

export class KbSyncCcPairsClient extends LyzrHttp {
  /** List connector-credential pairs. GET /v3/kb-sync/cc-pairs/ */
  async listCcPairs(signal?: AbortSignal): Promise<unknown[]> {
    const raw = await this.request<unknown>("GET", "/v3/kb-sync/cc-pairs/", {
      signal,
    });
    return normalizeList(raw, "cc_pairs");
  }

  /** Create a connector-credential pair. POST /v3/kb-sync/cc-pairs/ */
  createCcPair(
    input: CcPairCreateInput,
    signal?: AbortSignal,
  ): Promise<unknown> {
    return this.request<unknown>("POST", "/v3/kb-sync/cc-pairs/", {
      body: input,
      signal,
    });
  }

  /** Get a connector-credential pair. GET /v3/kb-sync/cc-pairs/{cc_pair_id}/ */
  getCcPair(ccPairId: number, signal?: AbortSignal): Promise<unknown> {
    return this.request<unknown>(
      "GET",
      `/v3/kb-sync/cc-pairs/${encodeURIComponent(ccPairId)}/`,
      { signal },
    );
  }

  /** Pause a connector-credential pair. PATCH /v3/kb-sync/cc-pairs/{cc_pair_id}/pause/ */
  pauseCcPair(ccPairId: number, signal?: AbortSignal): Promise<unknown> {
    return this.request<unknown>(
      "PATCH",
      `/v3/kb-sync/cc-pairs/${encodeURIComponent(ccPairId)}/pause/`,
      { signal },
    );
  }

  /** Resume a connector-credential pair. PATCH /v3/kb-sync/cc-pairs/{cc_pair_id}/resume/ */
  resumeCcPair(ccPairId: number, signal?: AbortSignal): Promise<unknown> {
    return this.request<unknown>(
      "PATCH",
      `/v3/kb-sync/cc-pairs/${encodeURIComponent(ccPairId)}/resume/`,
      { signal },
    );
  }

  /** Trigger a sync run. POST /v3/kb-sync/cc-pairs/{cc_pair_id}/sync/ */
  triggerSync(ccPairId: number, signal?: AbortSignal): Promise<unknown> {
    return this.request<unknown>(
      "POST",
      `/v3/kb-sync/cc-pairs/${encodeURIComponent(ccPairId)}/sync/`,
      { signal },
    );
  }

  /** Get sync status. GET /v3/kb-sync/cc-pairs/{cc_pair_id}/status/ */
  getSyncStatus(ccPairId: number, signal?: AbortSignal): Promise<unknown> {
    return this.request<unknown>(
      "GET",
      `/v3/kb-sync/cc-pairs/${encodeURIComponent(ccPairId)}/status/`,
      { signal },
    );
  }

  /** List index attempts for a pair. GET /v3/kb-sync/cc-pairs/{cc_pair_id}/attempts/?limit=...&offset=... */
  async listAttempts(
    ccPairId: number,
    opts?: { limit?: number; offset?: number },
    signal?: AbortSignal,
  ): Promise<unknown[]> {
    const raw = await this.request<unknown>(
      "GET",
      `/v3/kb-sync/cc-pairs/${encodeURIComponent(ccPairId)}/attempts/`,
      {
        params: { limit: opts?.limit, offset: opts?.offset },
        signal,
      },
    );
    return normalizeList(raw, "attempts");
  }

  /** Get an index attempt. GET /v3/kb-sync/cc-pairs/{cc_pair_id}/attempts/{attempt_id}/ */
  getAttempt(
    ccPairId: number,
    attemptId: number,
    signal?: AbortSignal,
  ): Promise<unknown> {
    return this.request<unknown>(
      "GET",
      `/v3/kb-sync/cc-pairs/${encodeURIComponent(ccPairId)}/attempts/${encodeURIComponent(attemptId)}/`,
      { signal },
    );
  }

  /** Cancel an index attempt. DELETE /v3/kb-sync/cc-pairs/{cc_pair_id}/attempts/{attempt_id}/cancel/ */
  cancelAttempt(
    ccPairId: number,
    attemptId: number,
    signal?: AbortSignal,
  ): Promise<unknown> {
    return this.request<unknown>(
      "DELETE",
      `/v3/kb-sync/cc-pairs/${encodeURIComponent(ccPairId)}/attempts/${encodeURIComponent(attemptId)}/cancel/`,
      { signal },
    );
  }
}
