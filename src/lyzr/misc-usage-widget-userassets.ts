/**
 * Misc: Usage Alerts + Widget Stream + User Assets client (host: agent-prod).
 */
import { LyzrHttp, LyzrApiError, normalizeList } from "./http.js";

export { LyzrApiError };

export type UserAssetType =
  | "all"
  | "folder"
  | "agent"
  | "manager_agent"
  | "a2a_agent"
  | "workflow";

export interface UserAssetListParams {
  page?: number;
  limit?: number;
  type?: UserAssetType;
  sort_by?: "name" | "created_at" | "updated_at";
  order?: "asc" | "desc";
  providers?: string[];
  models?: string[];
  owners?: string[];
  is_active?: boolean;
  has_schedule?: boolean;
  has_trigger?: boolean;
  tags?: string[];
  capabilities?: string[];
  response_format?: string;
  updated_within_days?: number;
  metadata_contains?: string;
}

export interface SearchUserAssetsParams extends UserAssetListParams {
  q: string;
}

export interface UserAsset {
  [key: string]: unknown;
}

export interface UserAssetListResponse {
  assets: UserAsset[];
  total: number;
  page?: number;
  limit?: number;
  has_more?: boolean;
  [key: string]: unknown;
}

export interface WidgetStreamInput {
  message: string;
  session_id: string;
}

export class MiscUsageWidgetUserAssetsClient extends LyzrHttp {
  /** Run usage alert pass. POST /v3/usage-alerts/run */
  async runUsageAlerts(
    serverToken?: string,
    signal?: AbortSignal,
  ): Promise<unknown> {
    const res = await this.fetchImpl(this.buildUrl("/v3/usage-alerts/run"), {
      method: "POST",
      headers: this.headers(
        serverToken ? { "x-server-token": serverToken } : undefined,
      ),
      signal,
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new LyzrApiError(res.status, text);
    }
    const text = await res.text();
    return text ? JSON.parse(text) : {};
  }

  /** Widget stream chat (SSE). POST /v3/widget/stream/ Returns the full text. */
  async widgetStream(
    input: WidgetStreamInput,
    onChunk: (delta: string) => void,
    signal?: AbortSignal,
  ): Promise<string> {
    const res = await this.fetchImpl(this.buildUrl("/v3/widget/stream/"), {
      method: "POST",
      headers: this.headers({ Accept: "text/event-stream" }),
      body: JSON.stringify({
        message: input.message,
        session_id: input.session_id,
      }),
      signal,
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new LyzrApiError(res.status, text);
    }
    if (!res.body) {
      const text = await res.text();
      if (text) onChunk(text);
      return text;
    }

    let full = "";
    const handleLine = (line: string): boolean => {
      const trimmed = line.trim();
      if (!trimmed.startsWith("data:")) return false;
      const dataStr = trimmed.slice(5).trim();
      if (dataStr === "[DONE]") return true;
      let content = dataStr;
      try {
        const parsed = JSON.parse(dataStr) as Record<string, unknown>;
        content = String(parsed.content ?? parsed.delta ?? "");
      } catch {
        // plain-text chunk
      }
      if (content) {
        full += content;
        onChunk(content);
      }
      return false;
    };

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";
      for (const line of lines) {
        if (handleLine(line)) return full;
      }
    }
    if (buffer) handleLine(buffer);
    return full;
  }

  /** List filter facets for user assets. GET /v3/user-assets/filters */
  listUserAssetFilters(signal?: AbortSignal): Promise<unknown> {
    return this.request<unknown>("GET", "/v3/user-assets/filters", {
      signal,
    });
  }

  /** List user assets. GET /v3/user-assets/ */
  async listUserAssets(
    params: UserAssetListParams = {},
    signal?: AbortSignal,
  ): Promise<UserAssetListResponse> {
    const raw = await this.request<unknown>("GET", "/v3/user-assets/", {
      params: params as Record<string, unknown>,
      signal,
    });
    const list = normalizeList<UserAsset>(raw, "assets");
    if (raw && typeof raw === "object") {
      return {
        ...(raw as Record<string, unknown>),
        assets: list,
      } as UserAssetListResponse;
    }
    return { assets: list, total: list.length };
  }

  /** Search user assets. GET /v3/user-assets/search */
  async searchUserAssets(
    params: SearchUserAssetsParams,
    signal?: AbortSignal,
  ): Promise<UserAssetListResponse> {
    const raw = await this.request<unknown>("GET", "/v3/user-assets/search", {
      params: params as unknown as Record<string, unknown>,
      signal,
    });
    const list = normalizeList<UserAsset>(raw, "assets");
    if (raw && typeof raw === "object") {
      return {
        ...(raw as Record<string, unknown>),
        assets: list,
      } as UserAssetListResponse;
    }
    return { assets: list, total: list.length };
  }
}
