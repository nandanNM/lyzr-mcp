import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ToolsV3CoreClient } from "../lyzr/tools-v3-core.js";

const txt = (data: unknown) => ({
  content: [
    {
      type: "text" as const,
      text: typeof data === "string" ? data : JSON.stringify(data, null, 2),
    },
  ],
});

/** Register the Tools v3 core tools (OpenAPI tools, ACI configs/connections, stale connections). */
export const registerToolsV3CoreTools = (
  server: McpServer,
  client: ToolsV3CoreClient,
) => {
  server.registerTool(
    "lyzr_list_tools",
    {
      title: "List Tools",
      description: "List the caller's registered tools.",
      inputSchema: {},
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async (_args, extra) => txt(await client.listTools(extra.signal)),
  );

  server.registerTool(
    "lyzr_create_tool",
    {
      title: "Create Tool",
      description:
        "Create a new OpenAPI-based tool from an OpenAPI schema. Returns the created tool.",
      inputSchema: {
        tool_set_name: z.string().describe("Name for the tool set"),
        openapi_schema: z
          .record(z.unknown())
          .describe("The OpenAPI schema (as a JSON object) describing the tool's endpoints"),
        default_headers: z
          .record(z.unknown())
          .nullable()
          .optional()
          .describe("Default headers applied to every call"),
        default_query_params: z
          .record(z.unknown())
          .nullable()
          .optional()
          .describe("Default query params applied to every call"),
        default_body_params: z
          .record(z.unknown())
          .nullable()
          .optional()
          .describe("Default body params applied to every call"),
        endpoint_defaults: z
          .record(z.unknown())
          .nullable()
          .optional()
          .describe("Per-endpoint default overrides"),
        enhance_descriptions: z
          .boolean()
          .nullable()
          .optional()
          .describe("Whether to use an LLM to enhance endpoint descriptions (default false)"),
        openai_api_key: z
          .string()
          .nullable()
          .optional()
          .describe("OpenAI API key, required if enhance_descriptions is true"),
        user_id: z.string().nullable().optional().describe("Owning user id"),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async (args, extra) => txt(await client.createTool(args, extra.signal)),
  );

  server.registerTool(
    "lyzr_get_tool",
    {
      title: "Get Tool",
      description: "Fetch a tool by id.",
      inputSchema: {
        tool_id: z.string().describe("The tool id to fetch"),
      },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ tool_id }, extra) =>
      txt(await client.getTool(tool_id, extra.signal)),
  );

  server.registerTool(
    "lyzr_update_tool",
    {
      title: "Update Tool",
      description: "Update fields on an existing tool by id.",
      inputSchema: {
        tool_id: z.string().describe("The tool id to update"),
        update: z
          .record(z.unknown())
          .describe("Fields to update on the tool"),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ tool_id, update }, extra) => {
      const result = await client.updateTool(tool_id, update, extra.signal);
      return {
        content: [
          {
            type: "text" as const,
            text: `Updated tool \`${tool_id}\`.\n\n${JSON.stringify(result, null, 2)}`,
          },
        ],
      };
    },
  );

  server.registerTool(
    "lyzr_delete_tool",
    {
      title: "Delete Tool",
      description: "Delete a tool by id.",
      inputSchema: {
        tool_id: z.string().describe("The tool id to delete"),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ tool_id }, extra) => {
      const result = await client.deleteTool(tool_id, extra.signal);
      return {
        content: [
          {
            type: "text" as const,
            text: `Deleted tool \`${tool_id}\`.\n\n${JSON.stringify(result, null, 2)}`,
          },
        ],
      };
    },
  );

  server.registerTool(
    "lyzr_bulk_delete_tools",
    {
      title: "Bulk Delete Tools",
      description: "Delete multiple tools by id in one call.",
      inputSchema: {
        tool_ids: z
          .array(z.string())
          .describe("List of tool ids to delete"),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async ({ tool_ids }, extra) => {
      const result = await client.bulkDeleteTools(tool_ids, extra.signal);
      return {
        content: [
          {
            type: "text" as const,
            text: `Deleted ${tool_ids.length} tool(s).\n\n${JSON.stringify(result, null, 2)}`,
          },
        ],
      };
    },
  );

  server.registerTool(
    "lyzr_list_all_user_tools",
    {
      title: "List All User Tools",
      description: "List all tools available to the current user.",
      inputSchema: {},
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async (_args, extra) => txt(await client.listAllUserTools(extra.signal)),
  );

  server.registerTool(
    "lyzr_get_agent_stale_connections",
    {
      title: "Get Agent Stale Connections",
      description:
        "Get an agent's stale tool connections (connections that need reauthorization).",
      inputSchema: {
        agent_id: z.string().describe("The agent id"),
        user_id: z.string().describe("The user id that owns the agent"),
      },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ agent_id, user_id }, extra) =>
      txt(
        await client.getAgentStaleConnections(agent_id, user_id, extra.signal),
      ),
  );

  server.registerTool(
    "lyzr_list_aci_configurations",
    {
      title: "List ACI Configurations",
      description: "List ACI (Aipolabs Composio-alternative) app configurations.",
      inputSchema: {},
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async (_args, extra) =>
      txt(await client.listAciConfigurations(extra.signal)),
  );

  server.registerTool(
    "lyzr_create_aci_configuration",
    {
      title: "Create ACI Configuration",
      description: "Create an ACI app configuration for a given app id.",
      inputSchema: {
        app_id: z.string().describe("The ACI app id to configure"),
        security_scheme: z
          .string()
          .optional()
          .describe("Security scheme to use (default oauth2)"),
        security_scheme_overrides: z
          .record(z.unknown())
          .nullable()
          .optional()
          .describe("Overrides for the security scheme configuration"),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async (args, extra) =>
      txt(await client.createAciConfiguration(args, extra.signal)),
  );

  server.registerTool(
    "lyzr_delete_aci_configuration",
    {
      title: "Delete ACI Configuration",
      description: "Delete an ACI app configuration by app id.",
      inputSchema: {
        app_id: z.string().describe("The ACI app id whose configuration to delete"),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ app_id }, extra) => {
      const result = await client.deleteAciConfiguration(app_id, extra.signal);
      return {
        content: [
          {
            type: "text" as const,
            text: `Deleted ACI configuration for app \`${app_id}\`.\n\n${JSON.stringify(result, null, 2)}`,
          },
        ],
      };
    },
  );

  server.registerTool(
    "lyzr_delete_aci_connection",
    {
      title: "Delete ACI Connection",
      description: "Delete an ACI linked account connection by its id.",
      inputSchema: {
        linked_account_id: z
          .string()
          .describe("The linked account id whose connection to delete"),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ linked_account_id }, extra) => {
      const result = await client.deleteAciConnection(
        linked_account_id,
        extra.signal,
      );
      return {
        content: [
          {
            type: "text" as const,
            text: `Deleted ACI connection \`${linked_account_id}\`.\n\n${JSON.stringify(result, null, 2)}`,
          },
        ],
      };
    },
  );
};
