/**
 * Misc: User Assets client (host: agent-prod).
 *
 * NOTE: this module previously also wrapped a "usage alerts" runner and a
 * "widget stream" chat endpoint. Neither /v3/usage-alerts/run nor
 * /v3/widget/stream/ exist anywhere in the backend (api/factory/v3 has no
 * such routers) and both 405 live against production. They were removed —
 * see git history if this needs to be resurrected once the backend actually
 * ships those routes.
 */
import { LyzrHttp, LyzrApiError, normalizeList } from "./http.js";

export { LyzrApiError };

/**
 * Matches api/factory/v3/user_assets/models.py::UserAssetType exactly.
 * There is no "a2a_agent" variant on the backend.
 */
export type UserAssetType =
  | "all"
  | "folder"
  | "agent"
  | "manager_agent"
  | "workflow";

/**
 * The backend (api/factory/v3/user_assets/endpoints.py) only accepts
 * page/limit/type (and `q` for search) — no sort_by, order, providers,
 * models, owners, is_active, has_schedule, has_trigger, tags, capabilities,
 * response_format, updated_within_days, or metadata_contains. Those extra
 * fields used to be sent as dead query params (silently ignored by FastAPI,
 * giving the false impression the filter was applied).
 */
export interface UserAssetListParams {
  page?: number;
  limit?: number;
  type?: UserAssetType;
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

export class MiscUsageWidgetUserAssetsClient extends LyzrHttp {
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
