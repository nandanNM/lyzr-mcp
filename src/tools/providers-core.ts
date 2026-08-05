import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { ProvidersCoreClient } from "../lyzr/providers-core.js";

const txt = (data: unknown) => ({
  content: [
    {
      type: "text" as const,
      text: typeof data === "string" ? data : JSON.stringify(data, null, 2),
    },
  ],
});

/** Register the core Providers tools. */
export const registerProvidersCoreTools = (
  server: McpServer,
  client: ProvidersCoreClient,
) => {
  server.registerTool(
    "lyzr_create_provider",
    {
      title: "Create Provider",
      description: "Create a new provider connection.",
      inputSchema: {
        provider_id: z.string().describe("The provider's identifier"),
        type: z.string().describe("The provider type"),
        form: z
          .record(z.unknown())
          .optional()
          .describe("Provider form fields/config"),
        meta_data: z
          .record(z.unknown())
          .describe("Arbitrary metadata for the provider"),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async (args, extra) => txt(await client.createProvider(args, extra.signal)),
  );

  server.registerTool(
    "lyzr_create_lyzr_provider",
    {
      title: "Create Lyzr Provider",
      description: "Create a new Lyzr-managed provider connection.",
      inputSchema: {
        type: z.string().describe("The provider type"),
        provider_id: z.string().describe("The provider's identifier"),
        meta_data: z
          .record(z.unknown())
          .describe("Arbitrary metadata for the provider"),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async (args, extra) =>
      txt(await client.createLyzrProvider(args, extra.signal)),
  );

  server.registerTool(
    "lyzr_get_providers_by_type",
    {
      title: "Get Providers By Type",
      description: "List providers of a given type, paginated.",
      inputSchema: {
        provider_type: z.string().describe("The provider type to filter by"),
        page: z
          .number()
          .int()
          .min(1)
          .optional()
          .describe("Page number (starting from 1)"),
        limit: z
          .number()
          .int()
          .min(1)
          .max(100)
          .optional()
          .describe("Items per page"),
      },
      annotations: {
        readOnlyHint: true,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async (args, extra) =>
      txt(await client.getProvidersByType(args, extra.signal)),
  );

  server.registerTool(
    "lyzr_update_provider",
    {
      title: "Update Provider",
      description: "Update an existing provider's form/metadata.",
      inputSchema: {
        provider_id: z.string().describe("The provider id to update"),
        type: z.string().describe("The provider type"),
        form: z.record(z.unknown()).describe("Provider form fields/config"),
        meta_data: z
          .record(z.unknown())
          .describe("Arbitrary metadata for the provider"),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ provider_id, ...updates }, extra) =>
      txt(await client.updateProvider(provider_id, updates, extra.signal)),
  );

  server.registerTool(
    "lyzr_delete_provider",
    {
      title: "Delete Provider",
      description: "Permanently delete a provider by id.",
      inputSchema: {
        provider_id: z.string().describe("The provider id to delete"),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ provider_id }, extra) =>
      txt(await client.deleteProvider(provider_id, extra.signal)),
  );

  server.registerTool(
    "lyzr_get_provider",
    {
      title: "Get Provider",
      description: "Fetch a provider by id.",
      inputSchema: {
        provider_id: z.string().describe("The provider id to fetch"),
      },
      annotations: {
        readOnlyHint: true,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ provider_id }, extra) =>
      txt(await client.getProvider(provider_id, extra.signal)),
  );

  server.registerTool(
    "lyzr_get_composio_action_limit",
    {
      title: "Get Composio Action Limit",
      description: "Get the current Composio action usage/limit.",
      inputSchema: {},
      annotations: {
        readOnlyHint: true,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async (_args, extra) =>
      txt(await client.getComposioActionLimit(extra.signal)),
  );

  server.registerTool(
    "lyzr_get_tools_actions",
    {
      title: "Get Tools Actions",
      description: "List available tool actions for a provider.",
      inputSchema: {
        provider_identifier: z
          .string()
          .describe("The provider identifier to list actions for"),
        tool_source: z
          .string()
          .optional()
          .describe("Tool source (for backward compatibility)"),
        app_id: z
          .string()
          .optional()
          .describe("App ID (for backward compatibility with ACI)"),
      },
      annotations: {
        readOnlyHint: true,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async (args, extra) =>
      txt(await client.getToolsActions(args, extra.signal)),
  );

  server.registerTool(
    "lyzr_get_all_tools",
    {
      title: "Get All Tools",
      description: "List all tools available across providers.",
      inputSchema: {},
      annotations: {
        readOnlyHint: true,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async (_args, extra) => txt(await client.getAllTools(extra.signal)),
  );

  server.registerTool(
    "lyzr_delete_aci_custom_app",
    {
      title: "Delete ACI Custom App",
      description: "Permanently delete an ACI custom app by id.",
      inputSchema: {
        app_id: z.string().describe("The ACI custom app id to delete"),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ app_id }, extra) =>
      txt(await client.deleteAciCustomApp(app_id, extra.signal)),
  );

  server.registerTool(
    "lyzr_create_aci_custom_app",
    {
      title: "Create ACI Custom App",
      description: "Create a new ACI custom app with its functions.",
      inputSchema: {
        app_json: z.record(z.unknown()).describe("The app definition"),
        functions_json: z
          .array(z.record(z.unknown()))
          .describe("The app's function definitions"),
        secrets: z
          .record(z.string())
          .optional()
          .describe("Secret key/value pairs required by the app"),
        skip_dry_run: z
          .boolean()
          .optional()
          .describe("Skip the dry run validation (default true)"),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async (args, extra) =>
      txt(await client.createAciCustomApp(args, extra.signal)),
  );

  server.registerTool(
    "lyzr_list_lyzr_aci_tools",
    {
      title: "List Lyzr ACI Tools",
      description: "List org-wide Lyzr ACI tools.",
      inputSchema: {},
      annotations: {
        readOnlyHint: true,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async (_args, extra) => txt(await client.listLyzrAciTools(extra.signal)),
  );

  server.registerTool(
    "lyzr_create_lyzr_aci_tool",
    {
      title: "Create Lyzr ACI Tool",
      description: "Create a new org-wide Lyzr ACI tool.",
      inputSchema: {
        app_json: z.record(z.unknown()).describe("The app definition"),
        functions_json: z
          .array(z.record(z.unknown()))
          .describe("The app's function definitions"),
        secrets: z
          .record(z.string())
          .optional()
          .describe("Secret key/value pairs required by the app"),
        form: z
          .record(z.unknown())
          .optional()
          .describe("Provider form fields/config"),
        skip_dry_run: z
          .boolean()
          .optional()
          .describe("Skip the dry run validation (default true)"),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async (args, extra) =>
      txt(await client.createLyzrAciTool(args, extra.signal)),
  );

  server.registerTool(
    "lyzr_delete_lyzr_aci_tool",
    {
      title: "Delete Lyzr ACI Tool",
      description: "Permanently delete a Lyzr ACI tool by provider id.",
      inputSchema: {
        provider_id: z.string().describe("The provider id to delete"),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ provider_id }, extra) =>
      txt(await client.deleteLyzrAciTool(provider_id, extra.signal)),
  );
};
