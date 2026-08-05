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

/** Extra sidebar/module fields on top of the shared gating fields. */
export interface ModuleExtraFields {
  name?: string | null;
  icon?: string | null;
  route?: string | null;
  order?: number | null;
  sub_routes?: unknown[] | null;
  section?: string | null;
  heading?: string | null;
  type?: string | null;
  external?: boolean | null;
  action_id?: string | null;
  badge?: string | null;
  subtitle?: string | null;
  is_new?: boolean | null;
  beta?: boolean | null;
  blocked?: boolean | null;
  upgrade_description?: string | null;
  config?: Record<string, unknown> | null;
  use_tracking?: boolean | null;
}

export interface CreateModuleInput extends GatingFields, ModuleExtraFields {
  key: string;
  description: string;
  url: string;
}

export interface UpdateModuleInput extends ModuleExtraFields {
  description?: string | null;
  enabled_for_roles?: string[] | null;
  enabled_for_plans?: string[] | null;
  enabled_for_envs?: string[] | null;
  is_visible?: boolean | null;
  is_accessible?: boolean | null;
}

export interface Module extends GatingFields, ModuleExtraFields {
  id?: string | null;
  key: string;
  description: string;
  url: string;
  created_at?: string | null;
  updated_at?: string | null;
  [key: string]: unknown;
}

export interface ModuleListResult {
  modules: Module[];
  total: number;
  flags: Module[];
}

export class PlatformAdminClient extends LyzrHttp {
  // ---- Credits ----

  /** Get cached credits. GET /v3/credits/cache */
  getCachedCredits(
    xServerToken?: string,
    signal?: AbortSignal,
  ): Promise<Record<string, Credit>> {
    return this.request<Record<string, Credit>>("GET", "/v3/credits/cache", {
      params: xServerToken ? { "x-server-token": xServerToken } : undefined,
      signal,
    });
  }

  /** Refresh credit cache. POST /v3/credits/cache/refresh */
  refreshCreditCache(
    xServerToken?: string,
    signal?: AbortSignal,
  ): Promise<unknown> {
    return this.request<unknown>("POST", "/v3/credits/cache/refresh", {
      params: xServerToken ? { "x-server-token": xServerToken } : undefined,
      signal,
    });
  }

  // ---- Feature Flags (resolved, for the current caller) ----

  /** Get resolved feature flags. GET /v3/feature-flags */
  getFeatureFlags(signal?: AbortSignal): Promise<unknown> {
    return this.request<unknown>("GET", "/v3/feature-flags", { signal });
  }

  // ---- Feature Flags Admin ----

  /** List feature flags. GET /v3/admin/feature-flags */
  listFeatureFlagsAdmin(signal?: AbortSignal): Promise<FeatureFlagListResult> {
    return this.request<FeatureFlagListResult>(
      "GET",
      "/v3/admin/feature-flags",
      { signal },
    );
  }

  /** Create a feature flag. POST /v3/admin/feature-flags */
  createFeatureFlag(
    input: CreateFeatureFlagInput,
    signal?: AbortSignal,
  ): Promise<unknown> {
    return this.request<unknown>("POST", "/v3/admin/feature-flags", {
      body: input,
      signal,
    });
  }

  /** Get a feature flag. GET /v3/admin/feature-flags/{key} */
  getFeatureFlagAdmin(key: string, signal?: AbortSignal): Promise<FeatureFlag> {
    return this.request<FeatureFlag>(
      "GET",
      `/v3/admin/feature-flags/${encodeURIComponent(key)}`,
      { signal },
    );
  }

  /** Update a feature flag. PATCH /v3/admin/feature-flags/{key} */
  updateFeatureFlag(
    key: string,
    input: UpdateFeatureFlagInput,
    signal?: AbortSignal,
  ): Promise<FeatureFlag> {
    return this.request<FeatureFlag>(
      "PATCH",
      `/v3/admin/feature-flags/${encodeURIComponent(key)}`,
      { body: input, signal },
    );
  }

  /** Delete a feature flag. DELETE /v3/admin/feature-flags/{key} */
  deleteFeatureFlag(key: string, signal?: AbortSignal): Promise<unknown> {
    return this.request<unknown>(
      "DELETE",
      `/v3/admin/feature-flags/${encodeURIComponent(key)}`,
      { signal },
    );
  }

  // ---- Modules (resolved, for the current caller) ----

  /** Get resolved modules (sidebar). GET /v3/modules */
  getModules(signal?: AbortSignal): Promise<unknown> {
    return this.request<unknown>("GET", "/v3/modules", { signal });
  }

  // ---- Modules Admin ----

  /** List modules. GET /v3/admin/modules */
  listModulesAdmin(signal?: AbortSignal): Promise<ModuleListResult> {
    return this.request<ModuleListResult>("GET", "/v3/admin/modules", {
      signal,
    });
  }

  /** Create a module. POST /v3/admin/modules */
  createModule(
    input: CreateModuleInput,
    signal?: AbortSignal,
  ): Promise<unknown> {
    return this.request<unknown>("POST", "/v3/admin/modules", {
      body: input,
      signal,
    });
  }

  /** Get a module. GET /v3/admin/modules/{key} */
  getModuleAdmin(key: string, signal?: AbortSignal): Promise<Module> {
    return this.request<Module>(
      "GET",
      `/v3/admin/modules/${encodeURIComponent(key)}`,
      { signal },
    );
  }

  /** Update a module. PATCH /v3/admin/modules/{key} */
  updateModule(
    key: string,
    input: UpdateModuleInput,
    signal?: AbortSignal,
  ): Promise<Module> {
    return this.request<Module>(
      "PATCH",
      `/v3/admin/modules/${encodeURIComponent(key)}`,
      { body: input, signal },
    );
  }

  /** Delete a module. DELETE /v3/admin/modules/{key} */
  deleteModule(key: string, signal?: AbortSignal): Promise<unknown> {
    return this.request<unknown>(
      "DELETE",
      `/v3/admin/modules/${encodeURIComponent(key)}`,
      { signal },
    );
  }

  // ---- Features v3 (aggregate) ----

  /** Get features (aggregate feature-availability map). GET /v3/features/ */
  getFeatures(signal?: AbortSignal): Promise<Record<string, unknown>> {
    return this.request<Record<string, unknown>>("GET", "/v3/features/", {
      signal,
    });
  }
}
