/**
 * Knowledge Base (RAG) client — host: rag-prod.
 * Endpoints/shapes confirmed against the lyzr-adk SDK.
 */
import { LyzrHttp, normalizeList } from "./http.js";

/** Vector-store alias -> API credential_id + provider display name (from the SDK). */
const VECTOR_STORE_MAP: Record<
  string,
  { credentialId: string; provider: string }
> = {
  qdrant: { credentialId: "lyzr_qdrant_2", provider: "Qdrant [Lyzr 2]" },
  weaviate: { credentialId: "lyzr_weaviate", provider: "Weaviate [Lyzr]" },
  pg_vector: { credentialId: "lyzr_pg_vector", provider: "PG-Vector [Lyzr]" },
  "pg-vector": { credentialId: "lyzr_pg_vector", provider: "PG-Vector [Lyzr]" },
  pgvector: { credentialId: "lyzr_pg_vector", provider: "PG-Vector [Lyzr]" },
  milvus: { credentialId: "lyzr_milvus", provider: "Milvus [Lyzr]" },
  neptune: { credentialId: "lyzr_neptune", provider: "Amazon Neptune [Lyzr]" },
  "amazon-neptune": {
    credentialId: "lyzr_neptune",
    provider: "Amazon Neptune [Lyzr]",
  },
};

export const KNOWN_VECTOR_STORES = [
  "qdrant",
  "weaviate",
  "pg_vector",
  "milvus",
  "neptune",
];

export interface CreateKbInput {
  name: string; // lowercase/numbers/underscores only
  vector_store?: string;
  embedding_model?: string;
  llm_model?: string;
  description?: string;
}

const randomSuffix = (): string =>
  Math.random()
    .toString(36)
    .replace(/[^a-z0-9]/g, "")
    .slice(0, 4)
    .padEnd(4, "0");

export class RagClient extends LyzrHttp {
  /** Create a knowledge base. POST /v3/rag/ */
  createKb(input: CreateKbInput, signal?: AbortSignal): Promise<unknown> {
    const store = (input.vector_store ?? "qdrant").trim().toLowerCase();
    const resolved = VECTOR_STORE_MAP[store];
    if (!resolved) {
      throw new Error(
        `Unknown vector store "${input.vector_store}". Valid: ${KNOWN_VECTOR_STORES.join(", ")}`,
      );
    }
    if (!/^[a-z0-9_]+$/.test(input.name)) {
      throw new Error(
        `Knowledge base name must be lowercase letters, numbers, and underscores only (got "${input.name}").`,
      );
    }
    const payload: Record<string, unknown> = {
      name: input.name,
      collection_name: `${input.name}${randomSuffix()}`,
      vector_db_credential_id: resolved.credentialId,
      vector_store_provider: resolved.provider,
      embedding_model: input.embedding_model ?? "text-embedding-3-large",
      embedding_credential_id: "lyzr_openai",
      llm_model: input.llm_model ?? "gpt-4o",
      llm_credential_id: "lyzr_openai",
      semantic_data_model: false,
    };
    if (input.description !== undefined)
      payload.description = input.description;
    return this.request<unknown>("POST", "/v3/rag/", { body: payload, signal });
  }

  /** Get a KB. GET /v3/rag/{kb_id}/ */
  getKb(kbId: string, signal?: AbortSignal): Promise<unknown> {
    return this.request<unknown>(
      "GET",
      `/v3/rag/${encodeURIComponent(kbId)}/`,
      {
        signal,
      },
    );
  }

  /** List KBs for a user. GET /v3/rag/user/{user_id}/ */
  async listKbs(userId: string, signal?: AbortSignal): Promise<unknown[]> {
    const raw = await this.request<unknown>(
      "GET",
      `/v3/rag/user/${encodeURIComponent(userId)}/`,
      { signal },
    );
    return normalizeList(raw, "knowledge_bases");
  }

  /** Update a KB. PUT /v3/rag/{kb_id}/ */
  updateKb(
    kbId: string,
    fields: Record<string, unknown>,
    signal?: AbortSignal,
  ): Promise<unknown> {
    return this.request<unknown>(
      "PUT",
      `/v3/rag/${encodeURIComponent(kbId)}/`,
      {
        body: fields,
        signal,
      },
    );
  }

  /** Delete a KB. DELETE /v3/rag/{kb_id}/ */
  deleteKb(kbId: string, signal?: AbortSignal): Promise<unknown> {
    return this.request<unknown>(
      "DELETE",
      `/v3/rag/${encodeURIComponent(kbId)}/`,
      { signal },
    );
  }

  /** Ingest text chunks. POST /v3/train/text/?rag_id=... */
  trainText(
    ragId: string,
    texts: string[],
    signal?: AbortSignal,
  ): Promise<unknown> {
    return this.request<unknown>("POST", "/v3/train/text/", {
      params: { rag_id: ragId },
      body: { data: texts.map((text) => ({ text })) },
      signal,
    });
  }

  /** Crawl + ingest websites. POST /v3/train/website/?rag_id=... */
  trainWebsite(
    ragId: string,
    urls: string[],
    signal?: AbortSignal,
  ): Promise<unknown> {
    return this.request<unknown>("POST", "/v3/train/website/", {
      params: { rag_id: ragId },
      body: { urls, source: "website" },
      signal,
    });
  }

  /** Query/retrieve. GET /v3/rag/{rag_id}/retrieve/?query=...&top_k=... */
  query(
    ragId: string,
    query: string,
    topK?: number,
    signal?: AbortSignal,
  ): Promise<unknown> {
    return this.request<unknown>(
      "GET",
      `/v3/rag/${encodeURIComponent(ragId)}/retrieve/`,
      { params: { query, top_k: topK }, signal },
    );
  }

  /** List documents in a KB. GET /v3/rag/documents/{rag_id}/ */
  listDocuments(ragId: string, signal?: AbortSignal): Promise<unknown> {
    return this.request<unknown>(
      "GET",
      `/v3/rag/documents/${encodeURIComponent(ragId)}/`,
      { signal },
    );
  }
}
