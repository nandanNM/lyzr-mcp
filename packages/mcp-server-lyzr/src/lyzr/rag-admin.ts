/**
 * Knowledge Base (RAG) admin client — host: rag.
 * Covers config update, bulk delete, document training, and document
 * lifecycle operations (delete / delete-by-filter / metadata / reset).
 * Endpoints/shapes confirmed against the RAG OpenAPI spec.
 */
import { LyzrHttp } from "./http.js";

export class RagAdminClient extends LyzrHttp {
  /** Update a KB config. PUT /v3/rag/{config_id}/ (arbitrary object body). */
  updateConfig(
    configId: string,
    fields: Record<string, unknown>,
    signal?: AbortSignal,
  ): Promise<unknown> {
    return this.request<unknown>(
      "PUT",
      `/v3/rag/${encodeURIComponent(configId)}/`,
      { body: fields, signal },
    );
  }

  /** Bulk-delete KB configs. POST /v3/rag/bulk-delete/ body { config_ids }. */
  bulkDelete(configIds: string[], signal?: AbortSignal): Promise<unknown> {
    return this.request<unknown>("POST", "/v3/rag/bulk-delete/", {
      body: { config_ids: configIds },
      signal,
    });
  }

  /** Train documents. POST /v3/rag/train/{rag_id}/ — body is an ARRAY. */
  trainDocuments(
    ragId: string,
    documents: Record<string, unknown>[],
    signal?: AbortSignal,
  ): Promise<unknown> {
    return this.request<unknown>(
      "POST",
      `/v3/rag/train/${encodeURIComponent(ragId)}/`,
      { body: documents, signal },
    );
  }

  /** Delete documents by id. DELETE /v3/rag/{rag_id}/docs/ — body is an ARRAY. */
  deleteDocs(
    ragId: string,
    docs: string[],
    signal?: AbortSignal,
  ): Promise<unknown> {
    return this.request<unknown>(
      "DELETE",
      `/v3/rag/${encodeURIComponent(ragId)}/docs/`,
      { body: docs, signal },
    );
  }

  /** Delete documents by filter. DELETE /v3/rag/{rag_id}/docs/filter/ (object body). */
  deleteDocsByFilter(
    ragId: string,
    body: Record<string, unknown>,
    signal?: AbortSignal,
  ): Promise<unknown> {
    return this.request<unknown>(
      "DELETE",
      `/v3/rag/${encodeURIComponent(ragId)}/docs/filter/`,
      { body, signal },
    );
  }

  /** Update document metadata. PATCH /v3/rag/{rag_id}/docs/metadata/ (object body). */
  updateDocsMetadata(
    ragId: string,
    body: Record<string, unknown>,
    signal?: AbortSignal,
  ): Promise<unknown> {
    return this.request<unknown>(
      "PATCH",
      `/v3/rag/${encodeURIComponent(ragId)}/docs/metadata/`,
      { body, signal },
    );
  }

  /** Reset a KB — clear all documents. DELETE /v3/rag/{rag_id}/reset/ (no body). */
  reset(ragId: string, signal?: AbortSignal): Promise<unknown> {
    return this.request<unknown>(
      "DELETE",
      `/v3/rag/${encodeURIComponent(ragId)}/reset/`,
      { signal },
    );
  }
}
