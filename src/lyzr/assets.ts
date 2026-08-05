/**
 * Lyzr Assets client (host: rag).
 * Covers uploading, listing, fetching, and deleting assets, plus parse-status.
 */
import { LyzrHttp, LyzrApiError, normalizeList } from "./http.js";

export { LyzrApiError };

/** One file to upload: raw bytes + filename + mime type. */
export interface AssetFileInput {
  data: Buffer | Blob;
  filename: string;
  mimeType?: string;
}

/** Query params accepted by the upload endpoint. */
export interface UploadAssetParams {
  parser_provider?: string;
  parsing_mode?: string;
  enable_vlm?: boolean;
  vlm_provider?: string;
  vlm_model?: string;
  extract_tables?: boolean;
  describe_images?: boolean;
  chunking_strategy?: string;
  start_page?: number;
  end_page?: number;
  /** JSON string: {"provider":"standard|advanced","rag_id":"...","label_pages":false,"extract_text":true,"config":{}} */
  parse_config?: string;
}

export interface AssetUploadResult {
  [key: string]: unknown;
}

export interface MultiAssetUploadResponse {
  results: AssetUploadResult[];
  total_files: number;
  successful_uploads: number;
  failed_uploads: number;
  [key: string]: unknown;
}

export interface AssetResponse {
  asset_id: string;
  file_name: string;
  type?: string;
  url?: string | null;
  s3_uri?: string | null;
  created_at?: string;
  user_id?: string | null;
  file_size?: number;
  mime_type?: string;
  is_queryable?: boolean | null;
  parsing_status?: string | null;
  parsing_error?: string | null;
  [key: string]: unknown;
}

export interface AssetListResponse {
  assets: AssetResponse[];
  total: number;
  page?: number;
  limit?: number;
  [key: string]: unknown;
}

export interface DeleteAssetResponse {
  message: string;
  asset_id: string;
  [key: string]: unknown;
}

export interface ListAssetsParams {
  page?: number;
  limit?: number;
}

export class AssetsClient extends LyzrHttp {
  /** Upload one or more assets (multipart/form-data). POST /v3/assets/upload */
  async uploadAssets(
    files: AssetFileInput[],
    params?: UploadAssetParams,
    signal?: AbortSignal,
  ): Promise<MultiAssetUploadResponse> {
    if (!files.length) {
      throw new Error("uploadAssets requires at least one file");
    }
    const form = new FormData();
    for (const f of files) {
      const blob =
        f.data instanceof Blob
          ? f.data
          : new Blob([f.data as unknown as ArrayBuffer], { type: f.mimeType });
      form.append("files", blob, f.filename);
    }
    if (params?.parse_config !== undefined) {
      form.append("parse_config", params.parse_config);
    }

    const queryParams: Record<string, unknown> = {
      parser_provider: params?.parser_provider,
      parsing_mode: params?.parsing_mode,
      enable_vlm: params?.enable_vlm,
      vlm_provider: params?.vlm_provider,
      vlm_model: params?.vlm_model,
      extract_tables: params?.extract_tables,
      describe_images: params?.describe_images,
      chunking_strategy: params?.chunking_strategy,
      start_page: params?.start_page,
      end_page: params?.end_page,
    };

    const res = await this.fetchImpl(
      this.buildUrl("/v3/assets/upload", queryParams),
      {
        method: "POST",
        headers: { "x-api-key": this.apiKey, Accept: "application/json" },
        body: form,
        signal,
      },
    );
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new LyzrApiError(res.status, text);
    }
    const text = await res.text();
    return (text ? JSON.parse(text) : {}) as MultiAssetUploadResponse;
  }

  /** Resolve an asset by its RAG document source. GET /v3/assets/resolve-by-source */
  resolveAssetBySource(
    ragId: string,
    source: string,
    signal?: AbortSignal,
  ): Promise<AssetResponse> {
    return this.request<AssetResponse>("GET", "/v3/assets/resolve-by-source", {
      params: { rag_id: ragId, source },
      signal,
    });
  }

  /** Get an asset's raw content. GET /v3/assets/{asset_id}/raw */
  getAssetRaw(assetId: string, signal?: AbortSignal): Promise<unknown> {
    return this.request<unknown>(
      "GET",
      `/v3/assets/${encodeURIComponent(assetId)}/raw`,
      { signal },
    );
  }

  /** Get an asset by id. GET /v3/assets/{asset_id} */
  getAsset(assetId: string, signal?: AbortSignal): Promise<AssetResponse> {
    return this.request<AssetResponse>(
      "GET",
      `/v3/assets/${encodeURIComponent(assetId)}`,
      { signal },
    );
  }

  /** Delete an asset by id. DELETE /v3/assets/{asset_id} */
  deleteAsset(
    assetId: string,
    signal?: AbortSignal,
  ): Promise<DeleteAssetResponse> {
    return this.request<DeleteAssetResponse>(
      "DELETE",
      `/v3/assets/${encodeURIComponent(assetId)}`,
      { signal },
    );
  }

  /** List assets, paginated. GET /v3/assets/ */
  async listAssets(
    params?: ListAssetsParams,
    signal?: AbortSignal,
  ): Promise<AssetListResponse> {
    const raw = await this.request<unknown>("GET", "/v3/assets/", {
      params: { page: params?.page, limit: params?.limit },
      signal,
    });
    if (raw && typeof raw === "object" && "assets" in (raw as object)) {
      return raw as AssetListResponse;
    }
    return {
      assets: normalizeList<AssetResponse>(raw, "assets"),
      total: 0,
    };
  }

  /** Get an asset's parse status. GET /v3/assets/{asset_id}/parse-status */
  getAssetParseStatus(assetId: string, signal?: AbortSignal): Promise<unknown> {
    return this.request<unknown>(
      "GET",
      `/v3/assets/${encodeURIComponent(assetId)}/parse-status`,
      { signal },
    );
  }

  /** Update an asset's parsing status. PATCH /v3/assets/{asset_id}/parsing-status */
  updateParsingStatus(
    assetId: string,
    update: Record<string, unknown>,
    signal?: AbortSignal,
  ): Promise<unknown> {
    return this.request<unknown>(
      "PATCH",
      `/v3/assets/${encodeURIComponent(assetId)}/parsing-status`,
      { body: update, signal },
    );
  }
}
