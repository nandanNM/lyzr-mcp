/**
 * Lyzr Tools v3 core client (host: agent-prod).
 * Covers OpenAPI tool CRUD, ACI configurations/connections, bulk delete, and
 * agent stale-connections lookup.
 */
import { LyzrHttp, LyzrApiError, normalizeList } from "./http.js";

export { LyzrApiError };

export interface CreateOpenApiToolInput {
  tool_set_name: string;
  openapi_schema: Record<string, unknown>;
  default_headers?: Record<string, unknown> | null;
  default_query_params?: Record<string, unknown> | null;
  default_body_params?: Record<string, unknown> | null;
  endpoint_defaults?: Record<string, unknown> | null;
  enhance_descriptions?: boolean | null;
  openai_api_key?: string | null;
  user_id?: string | null;
}

export interface Tool {
  tool_id?: string;
  id?: string;
  tool_set_name?: string;
  [key: string]: unknown;
}

export interface AciSecuritySchemeOverride {
  [key: string]: unknown;
}

export interface CreateAciConfigurationInput {
  app_id: string;
  security_scheme?: string;
  security_scheme_overrides?: AciSecuritySchemeOverride | null;
}

export class ToolsV3CoreClient extends LyzrHttp {
  /** List the caller's tools. GET /v3/tools/ */
  listTools(signal?: AbortSignal): Promise<Tool[]> {
    return this.request<unknown>("GET", "/v3/tools/", { signal }).then((raw) =>
      normalizeList<Tool>(raw, "tools"),
    );
  }

  /** Create an OpenAPI tool. POST /v3/tools/ */
  createTool(
    input: CreateOpenApiToolInput,
    signal?: AbortSignal,
  ): Promise<Tool> {
    return this.request<Tool>("POST", "/v3/tools/", { body: input, signal });
  }

  /** Get a tool by id. GET /v3/tools/{tool_id} */
  getTool(toolId: string, signal?: AbortSignal): Promise<Tool> {
    return this.request<Tool>("GET", `/v3/tools/${toolId}`, { signal });
  }

  /** Update a tool by id. PUT /v3/tools/{tool_id} */
  updateTool(
    toolId: string,
    update: Record<string, unknown>,
    signal?: AbortSignal,
  ): Promise<Tool> {
    return this.request<Tool>("PUT", `/v3/tools/${toolId}`, {
      body: update,
      signal,
    });
  }

  /** Delete a tool by id. DELETE /v3/tools/{tool_id} */
  deleteTool(toolId: string, signal?: AbortSignal): Promise<unknown> {
    return this.request<unknown>("DELETE", `/v3/tools/${toolId}`, { signal });
  }

  /** List ACI configurations. GET /v3/tools/aci/configurations */
  listAciConfigurations(signal?: AbortSignal): Promise<unknown[]> {
    return this.request<unknown>("GET", "/v3/tools/aci/configurations", {
      signal,
    }).then((raw) => normalizeList<unknown>(raw, "configurations"));
  }

  /** Create an ACI configuration. POST /v3/tools/aci/configurations */
  createAciConfiguration(
    input: CreateAciConfigurationInput,
    signal?: AbortSignal,
  ): Promise<unknown> {
    return this.request<unknown>("POST", "/v3/tools/aci/configurations", {
      body: input,
      signal,
    });
  }

  /** Delete an ACI configuration. DELETE /v3/tools/aci/configurations/{app_id} */
  deleteAciConfiguration(
    appId: string,
    signal?: AbortSignal,
  ): Promise<unknown> {
    return this.request<unknown>(
      "DELETE",
      `/v3/tools/aci/configurations/${appId}`,
      { signal },
    );
  }

  /** Bulk delete tools. POST /v3/tools/bulk-delete */
  bulkDeleteTools(
    toolIds: string[],
    signal?: AbortSignal,
  ): Promise<unknown> {
    return this.request<unknown>("POST", "/v3/tools/bulk-delete", {
      body: { tool_ids: toolIds },
      signal,
    });
  }

  /** Delete an ACI connected account. DELETE /v3/tools/aci/connect/{linked_account_id} */
  deleteAciConnection(
    linkedAccountId: string,
    signal?: AbortSignal,
  ): Promise<unknown> {
    return this.request<unknown>(
      "DELETE",
      `/v3/tools/aci/connect/${linkedAccountId}`,
      { signal },
    );
  }

  /** List all tools for the current user. GET /v3/tools/all/user */
  listAllUserTools(signal?: AbortSignal): Promise<unknown[]> {
    return this.request<unknown>("GET", "/v3/tools/all/user", {
      signal,
    }).then((raw) => normalizeList<unknown>(raw, "tools"));
  }

  /** Get an agent's stale tool connections. GET /v3/tools/agents/{agent_id}/stale-connections */
  getAgentStaleConnections(
    agentId: string,
    userId: string,
    signal?: AbortSignal,
  ): Promise<unknown> {
    return this.request<unknown>(
      "GET",
      `/v3/tools/agents/${agentId}/stale-connections`,
      { params: { user_id: userId }, signal },
    );
  }
}
