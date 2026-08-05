/**
 * Knowledge Graph Neo4j + base multipart client — host: rag.
 * Covers the base (non-namespaced) Neo4j-training endpoints and all
 * /v4/knowledge_graph/neo4j/* variants not already covered by
 * KnowledgeGraphClient (which owns the plain website/text/graph/dedup/task
 * endpoints). Shapes confirmed against the RAG OpenAPI spec
 * (Body_train_neo4j_*, WebsiteParseInput, TextTrainingRequest).
 */
import { LyzrHttp, LyzrApiError } from "./http.js";

export { LyzrApiError };

/** One file to upload for Neo4j training: raw bytes + filename + mime type. */
export interface Neo4jTrainFileInput {
  data: Buffer | Blob;
  filename: string;
  mimeType?: string;
  /** Allowed nodes and relationships for the knowledge graph. */
  schema_prompt?: string;
  /** Extra info as a JSON string (default "{}"). */
  extra_info?: string;
}

/** Body for the website Neo4j-training endpoints (WebsiteParseInput). */
export interface Neo4jWebsiteTrainInput {
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

/** Body for the text Neo4j-training endpoints (TextTrainingRequest). */
export interface Neo4jTextTrainInput {
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

/** Build the multipart form for a Neo4j file-training request. */
const buildNeo4jForm = (input: Neo4jTrainFileInput): FormData => {
  const form = new FormData();
  const blob =
    input.data instanceof Blob
      ? input.data
      : new Blob([input.data as unknown as ArrayBuffer], {
          type: input.mimeType,
        });
  form.append("file", blob, input.filename);
  if (input.schema_prompt !== undefined) {
    form.append("schema_prompt", input.schema_prompt);
  }
  if (input.extra_info !== undefined) {
    form.append("extra_info", input.extra_info);
  }
  return form;
};

export class KnowledgeGraphExtraClient extends LyzrHttp {
  /** Upload a file to train the Neo4j knowledge graph. POST /v4/knowledge_graph/?rag_id=... */
  async trainNeo4jFile(
    ragId: string,
    input: Neo4jTrainFileInput,
    signal?: AbortSignal,
  ): Promise<unknown> {
    return this.postMultipart("/v4/knowledge_graph/", ragId, input, signal);
  }

  /** Upload a file to train the Neo4j knowledge graph (namespaced). POST /v4/knowledge_graph/neo4j/?rag_id=... */
  async trainNeo4jFileNs(
    ragId: string,
    input: Neo4jTrainFileInput,
    signal?: AbortSignal,
  ): Promise<unknown> {
    return this.postMultipart(
      "/v4/knowledge_graph/neo4j/",
      ragId,
      input,
      signal,
    );
  }

  /** Upload a file to train the Neo4j knowledge graph as an async task. POST /v4/knowledge_graph/task/?rag_id=... */
  async trainNeo4jFileTask(
    ragId: string,
    input: Neo4jTrainFileInput,
    signal?: AbortSignal,
  ): Promise<unknown> {
    return this.postMultipart(
      "/v4/knowledge_graph/task/",
      ragId,
      input,
      signal,
    );
  }

  /** Upload a file to train the Neo4j knowledge graph as an async task (namespaced). POST /v4/knowledge_graph/neo4j/task/?rag_id=... */
  async trainNeo4jFileTaskNs(
    ragId: string,
    input: Neo4jTrainFileInput,
    signal?: AbortSignal,
  ): Promise<unknown> {
    return this.postMultipart(
      "/v4/knowledge_graph/neo4j/task/",
      ragId,
      input,
      signal,
    );
  }

  /** Shared multipart POST helper for the Neo4j file-training endpoints. */
  private async postMultipart(
    path: string,
    ragId: string,
    input: Neo4jTrainFileInput,
    signal?: AbortSignal,
  ): Promise<unknown> {
    const form = buildNeo4jForm(input);
    const res = await this.fetchImpl(this.buildUrl(path, { rag_id: ragId }), {
      method: "POST",
      headers: { "x-api-key": this.apiKey, Accept: "application/json" },
      body: form,
      signal,
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new LyzrApiError(res.status, text);
    }
    const text = await res.text();
    return text ? JSON.parse(text) : {};
  }

  /** Crawl + ingest websites into the Neo4j knowledge graph (namespaced). POST /v4/knowledge_graph/neo4j/website/?rag_id=... */
  trainNeo4jWebsite(
    ragId: string,
    input: Neo4jWebsiteTrainInput,
    signal?: AbortSignal,
  ): Promise<unknown> {
    return this.request<unknown>("POST", "/v4/knowledge_graph/neo4j/website/", {
      params: { rag_id: ragId },
      body: withExtras(input),
      signal,
    });
  }

  /** Ingest text into the Neo4j knowledge graph (namespaced). POST /v4/knowledge_graph/neo4j/text/ */
  trainNeo4jText(
    input: Neo4jTextTrainInput,
    signal?: AbortSignal,
  ): Promise<unknown> {
    return this.request<unknown>("POST", "/v4/knowledge_graph/neo4j/text/", {
      body: withExtras(input),
      signal,
    });
  }

  /** Ingest text into the Neo4j knowledge graph as an async task (namespaced). POST /v4/knowledge_graph/neo4j/text/task/ */
  trainNeo4jTextTask(
    input: Neo4jTextTrainInput,
    signal?: AbortSignal,
  ): Promise<unknown> {
    return this.request<unknown>(
      "POST",
      "/v4/knowledge_graph/neo4j/text/task/",
      { body: withExtras(input), signal },
    );
  }

  /** Fetch the Neo4j knowledge graph. GET /v4/knowledge_graph/neo4j/graph/?rag_id=...&limit=... */
  getNeo4jGraph(
    ragId: string,
    limit?: number,
    signal?: AbortSignal,
  ): Promise<unknown> {
    return this.request<unknown>("GET", "/v4/knowledge_graph/neo4j/graph/", {
      params: { rag_id: ragId, limit },
      signal,
    });
  }

  /** Deduplicate Neo4j graph entities. POST /v4/knowledge_graph/neo4j/{rag_id}/deduplicate/ */
  deduplicateNeo4j(ragId: string, signal?: AbortSignal): Promise<unknown> {
    return this.request<unknown>(
      "POST",
      `/v4/knowledge_graph/neo4j/${encodeURIComponent(ragId)}/deduplicate/`,
      { signal },
    );
  }
}
