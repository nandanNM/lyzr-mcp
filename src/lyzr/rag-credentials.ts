/**
 * RAG Credentials + Live Sources client — host: rag.
 * Shapes confirmed against the RAG service OpenAPI (v3/credentials + v3/rag/live-sources).
 */
import { LyzrHttp } from "./http.js";

/** Body for POST /v3/credentials/ (CredentialCreate). */
export interface CreateCredentialInput {
  name: string;
  provider_id: string;
  credentials: Record<string, unknown>;
  scope?: "personal" | "org";
  type?: string;
  meta_data?: Record<string, unknown>;
  /** Any additional provider-specific fields, merged into the body. */
  extra_fields?: Record<string, unknown>;
}

/** Body for PUT /v3/credentials/{credential_id}/ (CredentialUpdate). */
export interface UpdateCredentialInput {
  name?: string;
  credentials?: Record<string, unknown>;
  scope?: "personal" | "org";
  metadata?: Record<string, unknown>;
  /** Any additional fields, merged into the body. */
  extra_fields?: Record<string, unknown>;
}

/** Body for POST /v3/rag/{rag_id}/live-sources/ (AddLiveSourceRequest). */
export interface AddLiveSourceInput {
  source_type: string;
  name: string;
  connector_specific_config?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  kb_sync_credential_id?: string;
  permissions_enabled?: boolean;
  /** Any additional fields, merged into the body. */
  extra_fields?: Record<string, unknown>;
}

/** Merge an optional `extra_fields` bag into the rest of a body object. */
const withExtra = (
  rest: Record<string, unknown>,
  extra?: Record<string, unknown>,
): Record<string, unknown> => ({ ...rest, ...(extra ?? {}) });

export class RagCredentialsClient extends LyzrHttp {
  // ---- Credentials ---------------------------------------------------------

  /** Create a credential. POST /v3/credentials/ */
  createCredential(
    input: CreateCredentialInput,
    signal?: AbortSignal,
  ): Promise<unknown> {
    const { extra_fields, ...rest } = input;
    return this.request<unknown>("POST", "/v3/credentials/", {
      body: withExtra(rest, extra_fields),
      signal,
    });
  }

  /** List credentials. GET /v3/credentials/ */
  listCredentials(signal?: AbortSignal): Promise<unknown> {
    return this.request<unknown>("GET", "/v3/credentials/", { signal });
  }

  /** Get a credential. GET /v3/credentials/{credential_id}/ */
  getCredential(credentialId: string, signal?: AbortSignal): Promise<unknown> {
    return this.request<unknown>(
      "GET",
      `/v3/credentials/${encodeURIComponent(credentialId)}/`,
      { signal },
    );
  }

  /** Update a credential. PUT /v3/credentials/{credential_id}/ */
  updateCredential(
    credentialId: string,
    input: UpdateCredentialInput,
    signal?: AbortSignal,
  ): Promise<unknown> {
    const { extra_fields, ...rest } = input;
    return this.request<unknown>(
      "PUT",
      `/v3/credentials/${encodeURIComponent(credentialId)}/`,
      { body: withExtra(rest, extra_fields), signal },
    );
  }

  /** Delete a credential. DELETE /v3/credentials/{credential_id}/ */
  deleteCredential(
    credentialId: string,
    signal?: AbortSignal,
  ): Promise<unknown> {
    return this.request<unknown>(
      "DELETE",
      `/v3/credentials/${encodeURIComponent(credentialId)}/`,
      { signal },
    );
  }

  // ---- Live Sources --------------------------------------------------------

  /** List credentials available for live sources. GET /v3/rag/live-sources/credentials/ */
  listLiveSourceCredentials(signal?: AbortSignal): Promise<unknown> {
    return this.request<unknown>("GET", "/v3/rag/live-sources/credentials/", {
      signal,
    });
  }

  /** Add a live source to a KB. POST /v3/rag/{rag_id}/live-sources/ */
  addLiveSource(
    ragId: string,
    input: AddLiveSourceInput,
    signal?: AbortSignal,
  ): Promise<unknown> {
    const { extra_fields, ...rest } = input;
    return this.request<unknown>(
      "POST",
      `/v3/rag/${encodeURIComponent(ragId)}/live-sources/`,
      { body: withExtra(rest, extra_fields), signal },
    );
  }

  /** List live sources for a KB. GET /v3/rag/{rag_id}/live-sources/ */
  listLiveSources(ragId: string, signal?: AbortSignal): Promise<unknown> {
    return this.request<unknown>(
      "GET",
      `/v3/rag/${encodeURIComponent(ragId)}/live-sources/`,
      { signal },
    );
  }

  /** Get a live source. GET /v3/rag/{rag_id}/live-sources/{live_source_id}/ */
  getLiveSource(
    ragId: string,
    liveSourceId: string,
    signal?: AbortSignal,
  ): Promise<unknown> {
    return this.request<unknown>(
      "GET",
      `/v3/rag/${encodeURIComponent(ragId)}/live-sources/${encodeURIComponent(liveSourceId)}/`,
      { signal },
    );
  }

  /** Remove a live source. DELETE /v3/rag/{rag_id}/live-sources/{live_source_id}/ */
  removeLiveSource(
    ragId: string,
    liveSourceId: string,
    signal?: AbortSignal,
  ): Promise<unknown> {
    return this.request<unknown>(
      "DELETE",
      `/v3/rag/${encodeURIComponent(ragId)}/live-sources/${encodeURIComponent(liveSourceId)}/`,
      { signal },
    );
  }

  /** Trigger a sync. POST /v3/rag/{rag_id}/live-sources/{live_source_id}/sync/ */
  syncLiveSource(
    ragId: string,
    liveSourceId: string,
    signal?: AbortSignal,
  ): Promise<unknown> {
    return this.request<unknown>(
      "POST",
      `/v3/rag/${encodeURIComponent(ragId)}/live-sources/${encodeURIComponent(liveSourceId)}/sync/`,
      { signal },
    );
  }

  /** Pause a live source. PATCH /v3/rag/{rag_id}/live-sources/{live_source_id}/pause/ */
  pauseLiveSource(
    ragId: string,
    liveSourceId: string,
    signal?: AbortSignal,
  ): Promise<unknown> {
    return this.request<unknown>(
      "PATCH",
      `/v3/rag/${encodeURIComponent(ragId)}/live-sources/${encodeURIComponent(liveSourceId)}/pause/`,
      { signal },
    );
  }

  /** Resume a live source. PATCH /v3/rag/{rag_id}/live-sources/{live_source_id}/resume/ */
  resumeLiveSource(
    ragId: string,
    liveSourceId: string,
    signal?: AbortSignal,
  ): Promise<unknown> {
    return this.request<unknown>(
      "PATCH",
      `/v3/rag/${encodeURIComponent(ragId)}/live-sources/${encodeURIComponent(liveSourceId)}/resume/`,
      { signal },
    );
  }

  /** Repoint a live source to a new credential. POST /v3/rag/{rag_id}/live-sources/{live_source_id}/repoint/ */
  repointLiveSource(
    ragId: string,
    liveSourceId: string,
    newCredentialId: string,
    signal?: AbortSignal,
  ): Promise<unknown> {
    return this.request<unknown>(
      "POST",
      `/v3/rag/${encodeURIComponent(ragId)}/live-sources/${encodeURIComponent(liveSourceId)}/repoint/`,
      { body: { new_credential_id: newCredentialId }, signal },
    );
  }
}
