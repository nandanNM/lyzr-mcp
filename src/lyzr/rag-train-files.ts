/**
 * Lyzr RAG Train Files client (host: rag).
 * Covers multipart file-upload training endpoints: pdf, docx, txt, xlsx, pptx, image.
 */
import { LyzrHttp, LyzrApiError } from "./http.js";

export { LyzrApiError };

/** File to train + shared multipart training options. */
export interface TrainFileInput {
  data: Buffer | Blob;
  filename: string;
  mimeType?: string;
  chunk_size?: number;
  chunk_overlap?: number;
  parser_config?: string;
  extra_info?: string;
}

/** Options for pdf/docx/txt trains that also accept a data_parser. */
export interface TrainParsedFileInput extends TrainFileInput {
  data_parser?: string;
}

export class RagTrainFilesClient extends LyzrHttp {
  private async uploadTrainFile(
    path: string,
    ragId: string,
    input: TrainFileInput & { data_parser?: string },
    signal?: AbortSignal,
  ): Promise<unknown> {
    const form = new FormData();
    const blob =
      input.data instanceof Blob
        ? input.data
        : new Blob([input.data as unknown as ArrayBuffer], {
            type: input.mimeType,
          });
    form.append("file", blob, input.filename);
    if (input.data_parser !== undefined) {
      form.append("data_parser", input.data_parser);
    }
    if (input.chunk_size !== undefined) {
      form.append("chunk_size", String(input.chunk_size));
    }
    if (input.chunk_overlap !== undefined) {
      form.append("chunk_overlap", String(input.chunk_overlap));
    }
    if (input.parser_config !== undefined) {
      form.append("parser_config", input.parser_config);
    }
    if (input.extra_info !== undefined) {
      form.append("extra_info", input.extra_info);
    }

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

  /** Train a PDF file. POST /v3/train/pdf/ */
  trainPdf(
    ragId: string,
    input: TrainParsedFileInput,
    signal?: AbortSignal,
  ): Promise<unknown> {
    return this.uploadTrainFile("/v3/train/pdf/", ragId, input, signal);
  }

  /** Train a DOCX file. POST /v3/train/docx/ */
  trainDocx(
    ragId: string,
    input: TrainParsedFileInput,
    signal?: AbortSignal,
  ): Promise<unknown> {
    return this.uploadTrainFile("/v3/train/docx/", ragId, input, signal);
  }

  /** Train a plain text file. POST /v3/train/txt/ */
  trainTxtFile(
    ragId: string,
    input: TrainParsedFileInput,
    signal?: AbortSignal,
  ): Promise<unknown> {
    return this.uploadTrainFile("/v3/train/txt/", ragId, input, signal);
  }

  /** Train an XLSX file. POST /v3/train/xlsx/ */
  trainXlsx(
    ragId: string,
    input: TrainFileInput,
    signal?: AbortSignal,
  ): Promise<unknown> {
    return this.uploadTrainFile("/v3/train/xlsx/", ragId, input, signal);
  }

  /** Train a PPTX file. POST /v3/train/pptx/ */
  trainPptx(
    ragId: string,
    input: TrainFileInput,
    signal?: AbortSignal,
  ): Promise<unknown> {
    return this.uploadTrainFile("/v3/train/pptx/", ragId, input, signal);
  }

  /** Train an image file. POST /v3/train/image/ */
  trainImage(
    ragId: string,
    input: TrainFileInput,
    signal?: AbortSignal,
  ): Promise<unknown> {
    return this.uploadTrainFile("/v3/train/image/", ragId, input, signal);
  }
}
