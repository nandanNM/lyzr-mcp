/**
 * RAG Misc/Extra client — host: rag.
 * Covers Lyzr Extract, the one leftover Lyzr Rag doc-content endpoint, and Source Auth.
 */
import { LyzrHttp, LyzrApiError } from "./http.js";

export { LyzrApiError };

/** Input for the multipart /v3/extract/ endpoint: either a file or full_text/file_url. */
export interface ExtractInput {
  /** Raw file bytes to extract from (mutually exclusive with fullText/fileUrl). */
  data?: Buffer | Blob;
  filename?: string;
  mimeType?: string;
  /** Extract directly from provided text instead of a file. */
  fullText?: string;
  /** Extract from a file at this URL instead of uploading bytes. */
  fileUrl?: string;
  /** JSON-schema-like string describing what to extract. */
  extractionSchema: string;
  target?: string;
  tier?: string;
  annotate?: boolean;
  chunkSize?: number;
  chunkOverlap?: number;
  parserConfig?: string;
  /** JSON string of extra metadata. */
  extraInfo?: string;
}

export interface DocumentChunk {
  [key: string]: unknown;
}

export interface DocumentContentResponse {
  rag_id: string;
  source: string;
  doc_type: string;
  chunk_count: number;
  chunks: DocumentChunk[];
  uploaded_at?: string | null;
  uploaded_by?: string | null;
  updated_at?: string | null;
  updated_by?: string | null;
  [key: string]: unknown;
}

export class RagMiscExtraClient extends LyzrHttp {
  /** Extract structured data from a file, URL, or text. POST /v3/extract/ */
  async extract(input: ExtractInput, signal?: AbortSignal): Promise<unknown> {
    const form = new FormData();
    if (input.data !== undefined) {
      const blob =
        input.data instanceof Blob
          ? input.data
          : new Blob([input.data as unknown as ArrayBuffer], {
              type: input.mimeType,
            });
      form.append("file", blob, input.filename ?? "file");
    }
    if (input.fullText !== undefined) form.append("full_text", input.fullText);
    if (input.fileUrl !== undefined) form.append("file_url", input.fileUrl);
    form.append("extraction_schema", input.extractionSchema);
    if (input.target !== undefined) form.append("target", input.target);
    if (input.tier !== undefined) form.append("tier", input.tier);
    if (input.annotate !== undefined)
      form.append("annotate", String(input.annotate));
    if (input.chunkSize !== undefined)
      form.append("chunk_size", String(input.chunkSize));
    if (input.chunkOverlap !== undefined)
      form.append("chunk_overlap", String(input.chunkOverlap));
    if (input.parserConfig !== undefined)
      form.append("parser_config", input.parserConfig);
    if (input.extraInfo !== undefined)
      form.append("extra_info", input.extraInfo);

    const res = await this.fetchImpl(this.buildUrl("/v3/extract/"), {
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

  /** Get the full stored content of a document's source. GET /v3/rag/{rag_id}/docs/content/ */
  getDocContent(
    ragId: string,
    source: string,
    limit?: number,
    signal?: AbortSignal,
  ): Promise<DocumentContentResponse> {
    return this.request<DocumentContentResponse>(
      "GET",
      `/v3/rag/${encodeURIComponent(ragId)}/docs/content/`,
      { params: { source, limit }, signal },
    );
  }

  /** Get source-auth connection status for a RAG's configured sources. GET /v3/rag/{rag_id}/source-auth/status */
  getSourceAuthStatus(ragId: string, signal?: AbortSignal): Promise<unknown> {
    return this.request<unknown>(
      "GET",
      `/v3/rag/${encodeURIComponent(ragId)}/source-auth/status`,
      { signal },
    );
  }

  /** Start SharePoint sign-in for a RAG. GET /v3/rag/{rag_id}/source-auth/sharepoint/authorize */
  sharepointAuthorize(
    ragId: string,
    redirectUrl: string,
    signal?: AbortSignal,
  ): Promise<unknown> {
    return this.request<unknown>(
      "GET",
      `/v3/rag/${encodeURIComponent(ragId)}/source-auth/sharepoint/authorize`,
      { params: { redirect_url: redirectUrl }, signal },
    );
  }

  /** ACI hand-off callback for source auth. GET /v3/rag/source-auth/aci-handoff */
  aciHandoff(state: string, signal?: AbortSignal): Promise<unknown> {
    return this.request<unknown>("GET", "/v3/rag/source-auth/aci-handoff", {
      params: { state },
      signal,
    });
  }
}
