/**
 * Lyzr Tools v3 — integrations client (host: agent-prod).
 * Covers Composio auth-configs/connections, MCP servers, MCP tool execution,
 * and tool credentials (static + OAuth). The sibling ToolsClient owns the
 * plain CRUD/ACI-config half of Tools v3.
 */
import { LyzrHttp, LyzrApiError, normalizeList } from "./http.js";

export { LyzrApiError };

export interface ComposioCreateAuthConfigInput {
  provider_id: string;
  client_id: string;
  client_secret: string;
  scopes?: string | null;
}

export interface MCPServerConfig {
  auth_type: string;
  server_url: string;
  [key: string]: unknown;
}

export interface MCPServerCreateInput {
  name: string;
  description?: string | null;
  config: MCPServerConfig;
  standard_server_id?: string | null;
}

export interface MCPServerResponse {
  id: string;
  name: string;
  description?: string | null;
  auth_type: string;
  server_url: string;
  server_type: string;
  standard_server_id?: string | null;
  created_at: string;
  updated_at: string;
  has_active_token?: boolean | null;
  is_owner?: boolean | null;
  access_level?: string | null;
  is_shared?: boolean | null;
  [key: string]: unknown;
}

export interface OAuthInitiateResponse {
  auth_url: string;
  state: string;
  expires_at: string;
  [key: string]: unknown;
}

export interface OAuthStatusResponse {
  status: string;
  error?: string | null;
  server_id?: string | null;
  [key: string]: unknown;
}

export interface ToolExecuteInput {
  server_id: string;
  tool_name: string;
  arguments?: Record<string, unknown> | null;
}

export interface ToolExecuteResponse {
  server_id: string;
  tool_name: string;
  result: Record<string, unknown>[];
  success: boolean;
  error?: string | null;
  [key: string]: unknown;
}

export interface CreateStaticToolCredentialInput {
  credential_name: string;
  user_id: string;
  provider_uuid: string;
  credentials: Record<string, unknown>;
}

export interface CreateOAuthToolCredentialInput {
  credential_name: string;
  user_id: string;
  provider_uuid: string;
  redirect_url?: string | null;
  grant_type?: "authorization_code" | "client_credentials";
  tenant_id?: string | null;
  token_url?: string | null;
  client_id?: string | null;
  client_secret?: string | null;
  scope?: string | null;
  credentials?: Record<string, unknown> | null;
}

export class ToolIntegrationsClient extends LyzrHttp {
  /** Handle a Composio webhook callback. POST /v3/tools/webhooks/composio */
  handleComposioWebhook(
    headers: {
      "webhook-id"?: string;
      "webhook-timestamp"?: string;
      "webhook-signature"?: string;
    } = {},
    signal?: AbortSignal,
  ): Promise<unknown> {
    return this.request<unknown>("POST", "/v3/tools/webhooks/composio", {
      params: headers as Record<string, unknown>,
      signal,
    });
  }

  /** Get a Composio auth config for a provider. GET /v3/tools/composio/auth-configs/{provider_id} */
  getComposioAuthConfig(
    providerId: string,
    signal?: AbortSignal,
  ): Promise<unknown> {
    return this.request<unknown>(
      "GET",
      `/v3/tools/composio/auth-configs/${encodeURIComponent(providerId)}`,
      { signal },
    );
  }

  /** Create a Composio auth config. POST /v3/tools/composio/auth-configs */
  createComposioAuthConfig(
    input: ComposioCreateAuthConfigInput,
    signal?: AbortSignal,
  ): Promise<unknown> {
    return this.request<unknown>("POST", "/v3/tools/composio/auth-configs", {
      body: input,
      signal,
    });
  }

  /** Delete a Composio auth config. DELETE /v3/tools/composio/auth-configs/{provider_id} */
  deleteComposioAuthConfig(
    providerId: string,
    signal?: AbortSignal,
  ): Promise<unknown> {
    return this.request<unknown>(
      "DELETE",
      `/v3/tools/composio/auth-configs/${encodeURIComponent(providerId)}`,
      { signal },
    );
  }

  /** Delete a Composio connection. DELETE /v3/tools/composio/connections/{connection_id} */
  deleteComposioConnection(
    connectionId: string,
    signal?: AbortSignal,
  ): Promise<unknown> {
    return this.request<unknown>(
      "DELETE",
      `/v3/tools/composio/connections/${encodeURIComponent(connectionId)}`,
      { signal },
    );
  }

  /** List MCP servers. GET /v3/tools/mcp/servers */
  async listMcpServers(signal?: AbortSignal): Promise<MCPServerResponse[]> {
    const raw = await this.request<unknown>("GET", "/v3/tools/mcp/servers", {
      signal,
    });
    return normalizeList<MCPServerResponse>(raw, "servers");
  }

  /** Create an MCP server. POST /v3/tools/mcp/servers */
  createMcpServer(
    input: MCPServerCreateInput,
    signal?: AbortSignal,
  ): Promise<MCPServerResponse> {
    return this.request<MCPServerResponse>("POST", "/v3/tools/mcp/servers", {
      body: input,
      signal,
    });
  }

  /** Initiate the OAuth flow for an MCP server. POST /v3/tools/mcp/servers/{server_id}/oauth/initiate */
  initiateMcpOauth(
    serverId: string,
    signal?: AbortSignal,
  ): Promise<OAuthInitiateResponse> {
    return this.request<OAuthInitiateResponse>(
      "POST",
      `/v3/tools/mcp/servers/${encodeURIComponent(serverId)}/oauth/initiate`,
      { signal },
    );
  }

  /** Get the OAuth status for an MCP server. GET /v3/tools/mcp/servers/{server_id}/oauth/status */
  getMcpOauthStatus(
    serverId: string,
    state: string,
    signal?: AbortSignal,
  ): Promise<OAuthStatusResponse> {
    return this.request<OAuthStatusResponse>(
      "GET",
      `/v3/tools/mcp/servers/${encodeURIComponent(serverId)}/oauth/status`,
      { params: { state }, signal },
    );
  }

  /** List tools exposed by an MCP server. GET /v3/tools/mcp/servers/{server_id}/tools */
  listMcpServerTools(serverId: string, signal?: AbortSignal): Promise<unknown> {
    return this.request<unknown>(
      "GET",
      `/v3/tools/mcp/servers/${encodeURIComponent(serverId)}/tools`,
      { signal },
    );
  }

  /** List resources exposed by an MCP server. GET /v3/tools/mcp/servers/{server_id}/resources */
  listMcpServerResources(
    serverId: string,
    signal?: AbortSignal,
  ): Promise<unknown> {
    return this.request<unknown>(
      "GET",
      `/v3/tools/mcp/servers/${encodeURIComponent(serverId)}/resources`,
      { signal },
    );
  }

  /** List prompts exposed by an MCP server. GET /v3/tools/mcp/servers/{server_id}/prompts */
  listMcpServerPrompts(
    serverId: string,
    signal?: AbortSignal,
  ): Promise<unknown> {
    return this.request<unknown>(
      "GET",
      `/v3/tools/mcp/servers/${encodeURIComponent(serverId)}/prompts`,
      { signal },
    );
  }

  /** Execute a tool on an MCP server. POST /v3/tools/mcp/tools/execute */
  executeMcpTool(
    input: ToolExecuteInput,
    signal?: AbortSignal,
  ): Promise<ToolExecuteResponse> {
    return this.request<ToolExecuteResponse>(
      "POST",
      "/v3/tools/mcp/tools/execute",
      { body: input, signal },
    );
  }

  /** List agents using an MCP server. GET /v3/tools/mcp/servers/{server_id}/agents */
  getMcpServerAgents(serverId: string, signal?: AbortSignal): Promise<unknown> {
    return this.request<unknown>(
      "GET",
      `/v3/tools/mcp/servers/${encodeURIComponent(serverId)}/agents`,
      { signal },
    );
  }

  /** Delete an MCP server. DELETE /v3/tools/mcp/servers/{server_id} */
  deleteMcpServer(serverId: string, signal?: AbortSignal): Promise<unknown> {
    return this.request<unknown>(
      "DELETE",
      `/v3/tools/mcp/servers/${encodeURIComponent(serverId)}`,
      { signal },
    );
  }

  /** Create a static tool credential. POST /v3/tools/credentials/static */
  createStaticToolCredential(
    input: CreateStaticToolCredentialInput,
    signal?: AbortSignal,
  ): Promise<unknown> {
    return this.request<unknown>("POST", "/v3/tools/credentials/static", {
      body: input,
      signal,
    });
  }

  /** Create an OAuth tool credential. POST /v3/tools/credentials/oauth */
  createOauthToolCredential(
    input: CreateOAuthToolCredentialInput,
    signal?: AbortSignal,
  ): Promise<unknown> {
    return this.request<unknown>("POST", "/v3/tools/credentials/oauth", {
      body: input,
      signal,
    });
  }

  /** Refresh a tool credential's status. PATCH /v3/tools/credentials/{credential_id}/status */
  refreshToolCredentialStatus(
    credentialId: string,
    signal?: AbortSignal,
  ): Promise<unknown> {
    return this.request<unknown>(
      "PATCH",
      `/v3/tools/credentials/${encodeURIComponent(credentialId)}/status`,
      { signal },
    );
  }

  /** Check whether testing is supported for a credential. GET /v3/tools/credentials/{credential_id}/test/supported */
  isToolCredentialTestSupported(
    credentialId: string,
    signal?: AbortSignal,
  ): Promise<unknown> {
    return this.request<unknown>(
      "GET",
      `/v3/tools/credentials/${encodeURIComponent(credentialId)}/test/supported`,
      { signal },
    );
  }

  /** Test a tool credential. POST /v3/tools/credentials/{credential_id}/test */
  testToolCredential(
    credentialId: string,
    signal?: AbortSignal,
  ): Promise<unknown> {
    return this.request<unknown>(
      "POST",
      `/v3/tools/credentials/${encodeURIComponent(credentialId)}/test`,
      { signal },
    );
  }

  /** List agents using a tool credential. GET /v3/tools/credentials/{credential_id}/agents */
  getCredentialAgents(
    credentialId: string,
    providerUuid?: string,
    signal?: AbortSignal,
  ): Promise<unknown> {
    return this.request<unknown>(
      "GET",
      `/v3/tools/credentials/${encodeURIComponent(credentialId)}/agents`,
      { params: { provider_uuid: providerUuid }, signal },
    );
  }

  /** Delete a tool credential. DELETE /v3/tools/credentials/{credential_id} */
  deleteToolCredential(
    credentialId: string,
    signal?: AbortSignal,
  ): Promise<unknown> {
    return this.request<unknown>(
      "DELETE",
      `/v3/tools/credentials/${encodeURIComponent(credentialId)}`,
      { signal },
    );
  }

  /** Get connected accounts (tool credentials) for a user. GET /v3/tools/credentials/connected_accounts */
  getConnectedAccounts(userId: string, signal?: AbortSignal): Promise<unknown> {
    return this.request<unknown>(
      "GET",
      "/v3/tools/credentials/connected_accounts",
      { params: { user_id: userId }, signal },
    );
  }

  /** Bulk delete tool credentials. POST /v3/tools/credentials/bulk-delete */
  bulkDeleteToolCredentials(
    credentialIds: string[],
    signal?: AbortSignal,
  ): Promise<unknown> {
    return this.request<unknown>("POST", "/v3/tools/credentials/bulk-delete", {
      body: { credential_ids: credentialIds },
      signal,
    });
  }
}
