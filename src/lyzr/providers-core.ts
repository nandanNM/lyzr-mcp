/**
 * Providers client — host: agent.
 * Endpoints/shapes confirmed against the Lyzr providers OpenAPI tag.
 */
import { LyzrHttp, normalizeList } from "./http.js";

export interface CreateProviderInput {
  provider_id: string;
  type: string;
  form?: Record<string, unknown> | null;
  meta_data: Record<string, unknown>;
}

export interface CreateLyzrProviderInput {
  type: string;
  provider_id: string;
  meta_data: Record<string, unknown>;
}

export interface UpdateProviderInput {
  type: string;
  form: Record<string, unknown>;
  meta_data: Record<string, unknown>;
}

export interface Provider {
  provider_id?: string;
  type?: string;
  form?: Record<string, unknown>;
  meta_data?: Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: unknown;
}

export interface GetProvidersByTypeParams {
  provider_type: string;
  page?: number;
  limit?: number;
}

export interface GetToolsActionsParams {
  provider_identifier: string;
  tool_source?: string;
  app_id?: string;
}

export interface AciCreateCustomAppInput {
  app_json: Record<string, unknown>;
  functions_json: Record<string, unknown>[];
  secrets?: Record<string, string> | null;
  skip_dry_run?: boolean;
}

export interface AciCreateOrgWideToolInput {
  app_json: Record<string, unknown>;
  functions_json: Record<string, unknown>[];
  secrets?: Record<string, string> | null;
  form?: Record<string, unknown> | null;
  skip_dry_run?: boolean;
}

export class ProvidersCoreClient extends LyzrHttp {
  /** Create a provider. POST /v3/providers/ */
  createProvider(
    input: CreateProviderInput,
    signal?: AbortSignal,
  ): Promise<Provider> {
    return this.request<Provider>("POST", "/v3/providers/", {
      body: input,
      signal,
    });
  }

  /** Create a Lyzr-managed provider. POST /v3/providers/lyzr */
  createLyzrProvider(
    input: CreateLyzrProviderInput,
    signal?: AbortSignal,
  ): Promise<Provider> {
    return this.request<Provider>("POST", "/v3/providers/lyzr", {
      body: input,
      signal,
    });
  }

  /** List providers by type. GET /v3/providers/type */
  async getProvidersByType(
    params: GetProvidersByTypeParams,
    signal?: AbortSignal,
  ): Promise<Provider[]> {
    const raw = await this.request<unknown>("GET", "/v3/providers/type", {
      params: {
        provider_type: params.provider_type,
        page: params.page,
        limit: params.limit,
      },
      signal,
    });
    return normalizeList<Provider>(raw, "providers");
  }

  /** Update a provider. PUT /v3/providers/{provider_id} */
  updateProvider(
    providerId: string,
    input: UpdateProviderInput,
    signal?: AbortSignal,
  ): Promise<Provider> {
    return this.request<Provider>(
      "PUT",
      `/v3/providers/${encodeURIComponent(providerId)}`,
      { body: input, signal },
    );
  }

  /** Delete a provider. DELETE /v3/providers/{provider_id} */
  deleteProvider(providerId: string, signal?: AbortSignal): Promise<unknown> {
    return this.request<unknown>(
      "DELETE",
      `/v3/providers/${encodeURIComponent(providerId)}`,
      { signal },
    );
  }

  /** Get a provider by id. GET /v3/providers/{provider_id} */
  getProvider(providerId: string, signal?: AbortSignal): Promise<Provider> {
    return this.request<Provider>(
      "GET",
      `/v3/providers/${encodeURIComponent(providerId)}`,
      { signal },
    );
  }

  /** Get the Composio action limit. GET /v3/providers/tools/composio-action-limit */
  getComposioActionLimit(signal?: AbortSignal): Promise<unknown> {
    return this.request<unknown>(
      "GET",
      "/v3/providers/tools/composio-action-limit",
      { signal },
    );
  }

  /** List tool actions for a provider. GET /v3/providers/tools/actions/{provider_identifier} */
  getToolsActions(
    params: GetToolsActionsParams,
    signal?: AbortSignal,
  ): Promise<unknown> {
    return this.request<unknown>(
      "GET",
      `/v3/providers/tools/actions/${encodeURIComponent(params.provider_identifier)}`,
      {
        params: {
          tool_source: params.tool_source,
          app_id: params.app_id,
        },
        signal,
      },
    );
  }

  /** List all tools. GET /v3/providers/tools/all */
  getAllTools(signal?: AbortSignal): Promise<unknown> {
    return this.request<unknown>("GET", "/v3/providers/tools/all", {
      signal,
    });
  }

  /** Delete an ACI custom app. DELETE /v3/providers/aci/custom-apps/{app_id} */
  deleteAciCustomApp(appId: string, signal?: AbortSignal): Promise<unknown> {
    return this.request<unknown>(
      "DELETE",
      `/v3/providers/aci/custom-apps/${encodeURIComponent(appId)}`,
      { signal },
    );
  }

  /** Create an ACI custom app. POST /v3/providers/aci/custom-apps */
  createAciCustomApp(
    input: AciCreateCustomAppInput,
    signal?: AbortSignal,
  ): Promise<unknown> {
    return this.request<unknown>("POST", "/v3/providers/aci/custom-apps", {
      body: input,
      signal,
    });
  }

  /** List Lyzr ACI tools. GET /v3/providers/lyzr/aci-tools */
  listLyzrAciTools(signal?: AbortSignal): Promise<unknown> {
    return this.request<unknown>("GET", "/v3/providers/lyzr/aci-tools", {
      signal,
    });
  }

  /** Create a Lyzr org-wide ACI tool. POST /v3/providers/lyzr/aci-tools */
  createLyzrAciTool(
    input: AciCreateOrgWideToolInput,
    signal?: AbortSignal,
  ): Promise<unknown> {
    return this.request<unknown>("POST", "/v3/providers/lyzr/aci-tools", {
      body: input,
      signal,
    });
  }

  /** Delete a Lyzr ACI tool. DELETE /v3/providers/lyzr/aci-tools/{provider_id} */
  deleteLyzrAciTool(
    providerId: string,
    signal?: AbortSignal,
  ): Promise<unknown> {
    return this.request<unknown>(
      "DELETE",
      `/v3/providers/lyzr/aci-tools/${encodeURIComponent(providerId)}`,
      { signal },
    );
  }

  /** Resolve an LLM credential (internal). GET /v3/providers/internal/resolve-llm-credential */
  resolveLlmCredential(
    params: { credential_id?: string; provider_id?: string },
    signal?: AbortSignal,
  ): Promise<unknown> {
    return this.request<unknown>(
      "GET",
      "/v3/providers/internal/resolve-llm-credential",
      {
        params: {
          credential_id: params.credential_id,
          provider_id: params.provider_id,
        },
        signal,
      },
    );
  }
}
