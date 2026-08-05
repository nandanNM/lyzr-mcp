/**
 * Platform admin client (host: agent) — credits, feature flags, modules, and
 * the aggregate features/modules endpoints surfaced to end users.
 * Endpoints/shapes confirmed against the platform OpenAPI schema.
 */
import { LyzrHttp } from "./http.js";

/** A single credit-cost definition, keyed by resource/action in the cache map. */
export interface Credit {
  _id?: string | null;
  resource: string;
  action: string;
  action_cost?: number;
  unit?: number;
  version?: number;
  is_active: boolean;
  pricing_tiers?: unknown[] | null;
  created_at?: string;
  updated_at?: string;
  [key: string]: unknown;
}

/** Sidebar/module gating shared by feature flags and modules. */
export interface GatingFields {
  enabled_for_roles?: string[] | null;
  enabled_for_plans?: string[] | null;
  enabled_for_envs?: string[] | null;
  is_visible?: boolean;
  is_accessible?: boolean;
}

/**
 * The `/v3/admin/feature-flags*` routes are gated by a completely separate
 * `verify_admin_token` dependency (api.factory.v3.feature_flags.endpoints /
 * app.py) that checks `Authorization: Bearer <PAGOS_ADMIN_TOKEN>` — a
 * platform secret, not the caller's regular Lyzr `x-api-key`. Callers must
 * supply that token explicitly; there is no way to derive it from the API key.
 */
export interface AdminAuth {
  /** The PAGOS_ADMIN_TOKEN bearer token required by the admin feature-flags routes. */
  adminToken: string;
}

export interface CreateFeatureFlagInput extends GatingFields {
  key: string;
  description: string;
  url: string;
}

export interface UpdateFeatureFlagInput {
  description?: string | null;
  enabled_for_roles?: string[] | null;
  enabled_for_plans?: string[] | null;
  enabled_for_envs?: string[] | null;
  is_visible?: boolean | null;
  is_accessible?: boolean | null;
}

export interface FeatureFlag extends GatingFields {
  id?: string | null;
  key: string;
  description: string;
  url: string;
  created_at?: string | null;
  updated_at?: string | null;
  [key: string]: unknown;
}

export interface FeatureFlagListResult {
  flags: FeatureFlag[];
  total: number;
}

export class PlatformAdminClient extends LyzrHttp {
  // ---- Credits ----

  /**
   * Get cached credits. GET /v3/credits/cache
   * Requires the `x-server-token` server-to-server auth token as a HEADER
   * (verify_server_token in api/factory/v3/credits/endpoints.py reads it via
   * `Header(None)`, not a query parameter) — this is the platform's
   * `settings.server_auth_token` secret, not the caller's Lyzr API key.
   */
  getCachedCredits(
    xServerToken?: string,
    signal?: AbortSignal,
  ): Promise<Record<string, Credit>> {
    return this.request<Record<string, Credit>>("GET", "/v3/credits/cache", {
      headers: xServerToken ? { "x-server-token": xServerToken } : undefined,
      signal,
    });
  }

  /** Refresh credit cache. POST /v3/credits/cache/refresh (also needs `x-server-token` as a header). */
  refreshCreditCache(
    xServerToken?: string,
    signal?: AbortSignal,
  ): Promise<unknown> {
    return this.request<unknown>("POST", "/v3/credits/cache/refresh", {
      headers: xServerToken ? { "x-server-token": xServerToken } : undefined,
      signal,
    });
  }

  // ---- Feature Flags (resolved, for the current caller) ----

  /** Get resolved feature flags. GET /v3/feature-flags */
  getFeatureFlags(signal?: AbortSignal): Promise<unknown> {
    return this.request<unknown>("GET", "/v3/feature-flags", { signal });
  }

  // ---- Feature Flags Admin ----

  /**
   * List feature flags. GET /v3/admin/feature-flags
   * Requires `adminToken` — this router only depends on `verify_admin_token`
   * (Authorization: Bearer <PAGOS_ADMIN_TOKEN>), not the regular `x-api-key`
   * auth used by every other endpoint in this client.
   */
  listFeatureFlagsAdmin(
    adminToken: string,
    signal?: AbortSignal,
  ): Promise<FeatureFlagListResult> {
    return this.request<FeatureFlagListResult>(
      "GET",
      "/v3/admin/feature-flags",
      { headers: { Authorization: `Bearer ${adminToken}` }, signal },
    );
  }

  /** Create a feature flag. POST /v3/admin/feature-flags (requires `adminToken`, see listFeatureFlagsAdmin). */
  createFeatureFlag(
    adminToken: string,
    input: CreateFeatureFlagInput,
    signal?: AbortSignal,
  ): Promise<unknown> {
    return this.request<unknown>("POST", "/v3/admin/feature-flags", {
      body: input,
      headers: { Authorization: `Bearer ${adminToken}` },
      signal,
    });
  }

  /** Get a feature flag. GET /v3/admin/feature-flags/{key} (requires `adminToken`, see listFeatureFlagsAdmin). */
  getFeatureFlagAdmin(
    adminToken: string,
    key: string,
    signal?: AbortSignal,
  ): Promise<FeatureFlag> {
    return this.request<FeatureFlag>(
      "GET",
      `/v3/admin/feature-flags/${encodeURIComponent(key)}`,
      { headers: { Authorization: `Bearer ${adminToken}` }, signal },
    );
  }

  /** Update a feature flag. PATCH /v3/admin/feature-flags/{key} (requires `adminToken`, see listFeatureFlagsAdmin). */
  updateFeatureFlag(
    adminToken: string,
    key: string,
    input: UpdateFeatureFlagInput,
    signal?: AbortSignal,
  ): Promise<FeatureFlag> {
    return this.request<FeatureFlag>(
      "PATCH",
      `/v3/admin/feature-flags/${encodeURIComponent(key)}`,
      { body: input, headers: { Authorization: `Bearer ${adminToken}` }, signal },
    );
  }

  /** Delete a feature flag. DELETE /v3/admin/feature-flags/{key} (requires `adminToken`, see listFeatureFlagsAdmin). */
  deleteFeatureFlag(
    adminToken: string,
    key: string,
    signal?: AbortSignal,
  ): Promise<unknown> {
    return this.request<unknown>(
      "DELETE",
      `/v3/admin/feature-flags/${encodeURIComponent(key)}`,
      { headers: { Authorization: `Bearer ${adminToken}` }, signal },
    );
  }

  // NOTE: A "Modules" admin/resolved section (`/v3/modules`, `/v3/admin/modules`)
  // previously existed here but was removed — no such router is registered in
  // the backend (app.py has no modules_router / include_router for /v3/modules
  // or /v3/admin/modules), and live calls confirm this: GET /v3/modules returns
  // 405 Method Not Allowed (nothing in the app matches those paths for GET).

  // ---- Features v3 (aggregate) ----

  /** Get features (aggregate feature-availability map). GET /v3/features/ */
  getFeatures(signal?: AbortSignal): Promise<Record<string, unknown>> {
    return this.request<Record<string, unknown>>("GET", "/v3/features/", {
      signal,
    });
  }
}
