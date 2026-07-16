/**
 * RAG content client — host: rag.
 * Wraps the standalone parse/classify endpoints (no knowledge base required).
 * Shapes confirmed against the RAG service OpenAPI spec.
 */
import { LyzrHttp } from "./http.js";

export interface WebsiteParseInput {
  url: string;
  chunk_size?: number;
  chunk_overlap?: number;
  parser_config?: string;
  extra_info?: string;
  /** Any additional body fields, merged into the request body. */
  extra_fields?: Record<string, unknown>;
}

export interface TextParseInput {
  text: string;
  chunk_size?: number;
  chunk_overlap?: number;
  parser_config?: string;
  extra_info?: string;
  /** Any additional body fields, merged into the request body. */
  extra_fields?: Record<string, unknown>;
}

export interface ClassifyRule {
  /** The label/category name returned when this rule matches. */
  type: string;
  /** Natural-language description of when this rule applies. */
  description: string;
}

export interface ClassifyInput {
  text: string;
  rules: ClassifyRule[];
  /** Any additional body fields, merged into the request body. */
  extra_fields?: Record<string, unknown>;
}

export class RagContentClient extends LyzrHttp {
  /** Parse a website into chunks. POST /v3/parse/website/ */
  parseWebsite(
    input: WebsiteParseInput,
    signal?: AbortSignal,
  ): Promise<unknown> {
    const { extra_fields, ...rest } = input;
    return this.request<unknown>("POST", "/v3/parse/website/", {
      body: { ...rest, ...(extra_fields ?? {}) },
      signal,
    });
  }

  /** Parse a website via Apify. POST /v3/parse/website_apify/ */
  parseWebsiteApify(
    input: WebsiteParseInput,
    signal?: AbortSignal,
  ): Promise<unknown> {
    const { extra_fields, ...rest } = input;
    return this.request<unknown>("POST", "/v3/parse/website_apify/", {
      body: { ...rest, ...(extra_fields ?? {}) },
      signal,
    });
  }

  /** Parse raw text into chunks. POST /v3/parse/text/ */
  parseText(input: TextParseInput, signal?: AbortSignal): Promise<unknown> {
    const { extra_fields, ...rest } = input;
    return this.request<unknown>("POST", "/v3/parse/text/", {
      body: { ...rest, ...(extra_fields ?? {}) },
      signal,
    });
  }

  /** Classify text against a set of rules. POST /v3/classify/ */
  classify(input: ClassifyInput, signal?: AbortSignal): Promise<unknown> {
    const { extra_fields, ...rest } = input;
    return this.request<unknown>("POST", "/v3/classify/", {
      body: { ...rest, ...(extra_fields ?? {}) },
      signal,
    });
  }
}
