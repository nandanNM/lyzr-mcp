import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ToolIntegrationsClient } from "../lyzr/tools-v3-integrations.js";

const txt = (data: unknown) => ({
  content: [
    {
      type: "text" as const,
      text: typeof data === "string" ? data : JSON.stringify(data, null, 2),
    },
  ],
});

/** Register the Tools v3 integrations tools (Composio, MCP servers, credentials). */
export const registerToolIntegrationsTools = (
  server: McpServer,
  client: ToolIntegrationsClient,
) => {
  server.registerTool(
    "lyzr_get_composio_auth_config",
    {
      title: "Get Composio Auth Config",
      description: "Fetch the Composio auth config for a provider.",
      inputSchema: {
        provider_id: z.string().describe("Composio provider id"),
      },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ provider_id }, extra) =>
      txt(await client.getComposioAuthConfig(provider_id, extra.signal)),
  );

  server.registerTool(
    "lyzr_create_composio_auth_config",
    {
      title: "Create Composio Auth Config",
      description: "Create a Composio auth config for a provider.",
      inputSchema: {
        provider_id: z.string().describe("Composio provider id"),
        client_id: z.string().describe("OAuth client id"),
        client_secret: z.string().describe("OAuth client secret"),
        scopes: z
          .string()
          .optional()
          .describe("Space-separated OAuth scopes"),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async (args, extra) =>
      txt(await client.createComposioAuthConfig(args, extra.signal)),
  );

  server.registerTool(
    "lyzr_delete_composio_auth_config",
    {
      title: "Delete Composio Auth Config",
      description: "Delete the Composio auth config for a provider.",
      inputSchema: {
        provider_id: z.string().describe("Composio provider id"),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ provider_id }, extra) =>
      txt(await client.deleteComposioAuthConfig(provider_id, extra.signal)),
  );

  server.registerTool(
    "lyzr_delete_composio_connection",
    {
      title: "Delete Composio Connection",
      description: "Delete a Composio connection by id.",
      inputSchema: {
        connection_id: z.string().describe("Composio connection id"),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ connection_id }, extra) =>
      txt(await client.deleteComposioConnection(connection_id, extra.signal)),
  );

  server.registerTool(
    "lyzr_list_mcp_servers",
    {
      title: "List MCP Servers",
      description: "List MCP servers registered for the account.",
      inputSchema: {},
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async (_args, extra) => txt(await client.listMcpServers(extra.signal)),
  );

  server.registerTool(
    "lyzr_create_mcp_server",
    {
      title: "Create MCP Server",
      description: "Register a new MCP server (no-auth, api_key, or oauth).",
      inputSchema: {
        name: z.string().describe("MCP server name"),
        description: z
          .string()
          .optional()
          .describe("Optional server description"),
        config: z
          .object({
            auth_type: z
              .string()
              .describe("Auth type: no_auth, api_key, or oauth"),
            server_url: z.string().describe("MCP server URL"),
          })
          .catchall(z.unknown())
          .describe(
            "Auth configuration for the server (auth_type, server_url, plus auth-specific fields like api_key or oauth client_id/client_secret)",
          ),
        standard_server_id: z
          .string()
          .optional()
          .describe("Id of a standard/catalog server this maps to"),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async (args, extra) => txt(await client.createMcpServer(args, extra.signal)),
  );

  server.registerTool(
    "lyzr_initiate_mcp_oauth",
    {
      title: "Initiate MCP OAuth Flow",
      description: "Start the OAuth flow for an MCP server; returns an auth URL.",
      inputSchema: {
        server_id: z.string().describe("MCP server id"),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async ({ server_id }, extra) =>
      txt(await client.initiateMcpOauth(server_id, extra.signal)),
  );

  server.registerTool(
    "lyzr_get_mcp_oauth_status",
    {
      title: "Get MCP OAuth Status",
      description: "Check the status of an in-progress MCP OAuth flow.",
      inputSchema: {
        server_id: z.string().describe("MCP server id"),
        state: z.string().describe("OAuth state token returned by initiate"),
      },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ server_id, state }, extra) =>
      txt(await client.getMcpOauthStatus(server_id, state, extra.signal)),
  );

  server.registerTool(
    "lyzr_list_mcp_server_tools",
    {
      title: "List MCP Server Tools",
      description: "List the tools exposed by an MCP server.",
      inputSchema: {
        server_id: z.string().describe("MCP server id"),
      },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ server_id }, extra) =>
      txt(await client.listMcpServerTools(server_id, extra.signal)),
  );

  server.registerTool(
    "lyzr_list_mcp_server_resources",
    {
      title: "List MCP Server Resources",
      description: "List the resources exposed by an MCP server.",
      inputSchema: {
        server_id: z.string().describe("MCP server id"),
      },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ server_id }, extra) =>
      txt(await client.listMcpServerResources(server_id, extra.signal)),
  );

  server.registerTool(
    "lyzr_list_mcp_server_prompts",
    {
      title: "List MCP Server Prompts",
      description: "List the prompts exposed by an MCP server.",
      inputSchema: {
        server_id: z.string().describe("MCP server id"),
      },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ server_id }, extra) =>
      txt(await client.listMcpServerPrompts(server_id, extra.signal)),
  );

  server.registerTool(
    "lyzr_execute_mcp_tool",
    {
      title: "Execute MCP Tool",
      description: "Invoke a tool exposed by a registered MCP server.",
      inputSchema: {
        server_id: z.string().describe("MCP server id"),
        tool_name: z.string().describe("Name of the tool to invoke"),
        arguments: z
          .record(z.unknown())
          .optional()
          .describe("Arguments to pass to the tool"),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async (args, extra) => txt(await client.executeMcpTool(args, extra.signal)),
  );

  server.registerTool(
    "lyzr_get_mcp_server_agents",
    {
      title: "Get MCP Server Agents",
      description: "List agents that use a given MCP server.",
      inputSchema: {
        server_id: z.string().describe("MCP server id"),
      },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ server_id }, extra) =>
      txt(await client.getMcpServerAgents(server_id, extra.signal)),
  );

  server.registerTool(
    "lyzr_delete_mcp_server",
    {
      title: "Delete MCP Server",
      description: "Delete a registered MCP server.",
      inputSchema: {
        server_id: z.string().describe("MCP server id"),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ server_id }, extra) =>
      txt(await client.deleteMcpServer(server_id, extra.signal)),
  );

  server.registerTool(
    "lyzr_create_static_tool_credential",
    {
      title: "Create Static Tool Credential",
      description: "Create a static (non-OAuth) tool credential.",
      inputSchema: {
        credential_name: z.string().describe("Name for the credential"),
        user_id: z.string().describe("Owning user id"),
        provider_uuid: z.string().describe("Provider identifier"),
        credentials: z
          .record(z.unknown())
          .describe("Credential key/value payload, e.g. { api_key: ... }"),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async (args, extra) =>
      txt(await client.createStaticToolCredential(args, extra.signal)),
  );

  server.registerTool(
    "lyzr_create_oauth_tool_credential",
    {
      title: "Create OAuth Tool Credential",
      description: "Create an OAuth tool credential for a provider.",
      inputSchema: {
        credential_name: z.string().describe("Name for the credential"),
        user_id: z.string().describe("Owning user id"),
        provider_uuid: z.string().describe("Provider identifier"),
        redirect_url: z.string().optional().describe("OAuth redirect URL"),
        grant_type: z
          .enum(["authorization_code", "client_credentials"])
          .optional()
          .describe("OAuth grant type (default authorization_code)"),
        tenant_id: z.string().optional().describe("Tenant id, if applicable"),
        token_url: z.string().optional().describe("OAuth token URL"),
        client_id: z.string().optional().describe("OAuth client id"),
        client_secret: z.string().optional().describe("OAuth client secret"),
        scope: z.string().optional().describe("OAuth scope string"),
        credentials: z
          .record(z.unknown())
          .optional()
          .describe("Additional credential payload"),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async (args, extra) =>
      txt(await client.createOauthToolCredential(args, extra.signal)),
  );

  server.registerTool(
    "lyzr_refresh_tool_credential_status",
    {
      title: "Refresh Tool Credential Status",
      description: "Refresh/recheck the status of a tool credential.",
      inputSchema: {
        credential_id: z.string().describe("Tool credential id"),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ credential_id }, extra) =>
      txt(await client.refreshToolCredentialStatus(credential_id, extra.signal)),
  );

  server.registerTool(
    "lyzr_is_tool_credential_test_supported",
    {
      title: "Is Tool Credential Test Supported",
      description: "Check whether a tool credential supports test invocation.",
      inputSchema: {
        credential_id: z.string().describe("Tool credential id"),
      },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ credential_id }, extra) =>
      txt(
        await client.isToolCredentialTestSupported(credential_id, extra.signal),
      ),
  );

  server.registerTool(
    "lyzr_test_tool_credential",
    {
      title: "Test Tool Credential",
      description: "Run a live test of a tool credential.",
      inputSchema: {
        credential_id: z.string().describe("Tool credential id"),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async ({ credential_id }, extra) =>
      txt(await client.testToolCredential(credential_id, extra.signal)),
  );

  server.registerTool(
    "lyzr_get_credential_agents",
    {
      title: "Get Credential Agents",
      description: "List agents that use a given tool credential.",
      inputSchema: {
        credential_id: z.string().describe("Tool credential id"),
        provider_uuid: z
          .string()
          .optional()
          .describe("Optional provider id filter"),
      },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ credential_id, provider_uuid }, extra) =>
      txt(
        await client.getCredentialAgents(
          credential_id,
          provider_uuid,
          extra.signal,
        ),
      ),
  );

  server.registerTool(
    "lyzr_delete_tool_credential",
    {
      title: "Delete Tool Credential",
      description: "Delete a tool credential by id.",
      inputSchema: {
        credential_id: z.string().describe("Tool credential id"),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ credential_id }, extra) =>
      txt(await client.deleteToolCredential(credential_id, extra.signal)),
  );

  server.registerTool(
    "lyzr_get_connected_accounts",
    {
      title: "Get Connected Accounts",
      description: "List a user's connected tool accounts/credentials.",
      inputSchema: {
        user_id: z.string().describe("User id"),
      },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ user_id }, extra) =>
      txt(await client.getConnectedAccounts(user_id, extra.signal)),
  );

  server.registerTool(
    "lyzr_bulk_delete_tool_credentials",
    {
      title: "Bulk Delete Tool Credentials",
      description: "Delete multiple tool credentials by id in one call.",
      inputSchema: {
        credential_ids: z
          .array(z.string())
          .min(1)
          .describe("Tool credential ids to delete"),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async ({ credential_ids }, extra) =>
      txt(await client.bulkDeleteToolCredentials(credential_ids, extra.signal)),
  );
};
