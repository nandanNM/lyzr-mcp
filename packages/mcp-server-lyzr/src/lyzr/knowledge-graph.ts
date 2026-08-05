/**
 * Knowledge Graph (v4) client — host: rag.
 * Shapes confirmed against the RAG OpenAPI spec (WebsiteParseInput,
 * TextTrainingRequest). JSON endpoints only — the multipart file-upload
 * variants are intentionally not wrapped here.
 */
import { LyzrHttp } from "./http.js";

/** Body for POST /v4/knowledge_graph/website/ (WebsiteParseInput). */
export interface WebsiteTrainInput {
  urls: string[];
  source?: string;
  max_crawl_pages?: number;
  max_crawl_depth?: number;
  dynamic_content_wait_secs?: number;
  actor?: string;
  crawler_type?: string;
  chunk_size?: number;
  chunk_overlap?: number;
  /** Any additional fields, merged into the request body. */
  extra_fields?: Record<string, unknown>;
}

/** Body for POST /v4/knowledge_graph/text/ and /text/task/ (TextTrainingRequest). */
export interface TextTrainInput {
  text: string;
  source: string;
  rag_id: string;
  schema_prompt?: string;
  extra_info?: Record<string, unknown>;
  /** Any additional fields, merged into the request body. */
  extra_fields?: Record<string, unknown>;
}

/** Merge the caller's typed fields with an optional extra_fields catch-all. */
const withExtras = <T extends { extra_fields?: Record<string, unknown> }>(
  input: T,
): Record<string, unknown> => {
  const { extra_fields, ...rest } = input;
  return { ...rest, ...(extra_fields ?? {}) };
};

export class KnowledgeGraphClient extends LyzrHttp {
  /** Crawl + ingest websites into the knowledge graph. POST /v4/knowledge_graph/website/?rag_id=... */
  trainWebsite(
    ragId: string,
    input: WebsiteTrainInput,
    signal?: AbortSignal,
  ): Promise<unknown> {
    return this.request<unknown>("POST", "/v4/knowledge_graph/website/", {
      params: { rag_id: ragId },
      body: withExtras(input),
      signal,
    });
  }

  /** Ingest text into the knowledge graph. POST /v4/knowledge_graph/text/ */
  trainText(input: TextTrainInput, signal?: AbortSignal): Promise<unknown> {
    return this.request<unknown>("POST", "/v4/knowledge_graph/text/", {
      body: withExtras(input),
      signal,
    });
  }

  /** Ingest text as an async task. POST /v4/knowledge_graph/text/task/ */
  trainTextTask(input: TextTrainInput, signal?: AbortSignal): Promise<unknown> {
    return this.request<unknown>("POST", "/v4/knowledge_graph/text/task/", {
      body: withExtras(input),
      signal,
    });
  }

  /** Fetch the knowledge graph. GET /v4/knowledge_graph/graph/?rag_id=...&limit=... */
  getGraph(
    ragId: string,
    limit?: number,
    signal?: AbortSignal,
  ): Promise<unknown> {
    return this.request<unknown>("GET", "/v4/knowledge_graph/graph/", {
      params: { rag_id: ragId, limit },
      signal,
    });
  }

  /** Deduplicate graph entities. POST /v4/knowledge_graph/{rag_id}/deduplicate/ */
  deduplicate(ragId: string, signal?: AbortSignal): Promise<unknown> {
    return this.request<unknown>(
      "POST",
      `/v4/knowledge_graph/${encodeURIComponent(ragId)}/deduplicate/`,
      { signal },
    );
  }

  /** Poll an async task. GET /v4/knowledge_graph/task/status/{task_id} */
  taskStatus(taskId: string, signal?: AbortSignal): Promise<unknown> {
    return this.request<unknown>(
      "GET",
      `/v4/knowledge_graph/task/status/${encodeURIComponent(taskId)}`,
      { signal },
    );
  }
}
