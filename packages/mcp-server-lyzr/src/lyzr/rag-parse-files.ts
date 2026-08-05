/**
 * Lyzr Parse (file endpoints) client — host: rag.
 * Multipart file-parsing endpoints not covered by RagClient (website/website_apify/text).
 */
import { LyzrHttp, LyzrApiError } from "./http.js";

export { LyzrApiError };

/** One file to parse: raw bytes + filename + mime type. */
export interface ParseFileInput {
  data: Buffer | Blob;
  filename: string;
  mimeType?: string;
}

/** Shared optional chunking/parser fields accepted by most parse endpoints. */
export interface ParseDocFields {
  data_parser?: string;
  chunk_size?: number;
  chunk_overlap?: number;
  parser_config?: string;
  s3_key?: string;
  s3_bucket?: string;
  /** JSON string, default "{}" */
  extra_info?: string;
}

export interface ParseCsvFields {
  source_column: string;
  /** JSON string, default "{}" */
  extra_info?: string;
}

export interface ParseChunkFields {
  chunk_size?: number;
  chunk_overlap?: number;
  parser_config?: string;
  /** JSON string, default "{}" */
  extra_info?: string;
}

export class RagParseFilesClient extends LyzrHttp {
  private async multipartPost(
    path: string,
    file: ParseFileInput,
    fields: Record<string, unknown>,
    signal?: AbortSignal,
  ): Promise<unknown> {
    const form = new FormData();
    const blob =
      file.data instanceof Blob
        ? file.data
        : new Blob([file.data as unknown as ArrayBuffer], {
            type: file.mimeType,
          });
    form.append("file", blob, file.filename);
    for (const [key, value] of Object.entries(fields)) {
      if (value === undefined) continue;
      form.append(key, String(value));
    }

    const res = await this.fetchImpl(this.buildUrl(path), {
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

  /** Parse a PDF file. POST /v3/parse/pdf/ */
  parsePdf(
    file: ParseFileInput,
    fields?: ParseDocFields,
    signal?: AbortSignal,
  ): Promise<unknown> {
    return this.multipartPost("/v3/parse/pdf/", file, { ...fields }, signal);
  }

  /** Parse a DOCX file. POST /v3/parse/docx/ */
  parseDocx(
    file: ParseFileInput,
    fields?: ParseDocFields,
    signal?: AbortSignal,
  ): Promise<unknown> {
    return this.multipartPost("/v3/parse/docx/", file, { ...fields }, signal);
  }

  /** Parse a TXT file. POST /v3/parse/txt/ */
  parseTxt(
    file: ParseFileInput,
    fields?: ParseDocFields,
    signal?: AbortSignal,
  ): Promise<unknown> {
    return this.multipartPost("/v3/parse/txt/", file, { ...fields }, signal);
  }

  /** Parse a CSV file. POST /v3/parse/csv/ */
  parseCsv(
    file: ParseFileInput,
    fields: ParseCsvFields,
    signal?: AbortSignal,
  ): Promise<unknown> {
    return this.multipartPost("/v3/parse/csv/", file, { ...fields }, signal);
  }

  /** Parse an XLSX file. POST /v3/parse/xlsx/ */
  parseXlsx(
    file: ParseFileInput,
    fields?: ParseChunkFields,
    signal?: AbortSignal,
  ): Promise<unknown> {
    return this.multipartPost("/v3/parse/xlsx/", file, { ...fields }, signal);
  }

  /** Parse a PPTX file. POST /v3/parse/pptx/ */
  parsePptx(
    file: ParseFileInput,
    fields?: ParseChunkFields,
    signal?: AbortSignal,
  ): Promise<unknown> {
    return this.multipartPost("/v3/parse/pptx/", file, { ...fields }, signal);
  }

  /** Parse an image file. POST /v3/parse/image/ */
  parseImage(
    file: ParseFileInput,
    fields?: ParseChunkFields,
    signal?: AbortSignal,
  ): Promise<unknown> {
    return this.multipartPost("/v3/parse/image/", file, { ...fields }, signal);
  }
}
