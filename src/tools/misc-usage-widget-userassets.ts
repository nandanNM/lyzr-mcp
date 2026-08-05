import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { MiscUsageWidgetUserAssetsClient } from "../lyzr/misc-usage-widget-userassets.js";

const txt = (data: unknown) => ({
  content: [
    {
      type: "text" as const,
      text: typeof data === "string" ? data : JSON.stringify(data, null, 2),
    },
  ],
});

const userAssetTypeEnum = z
  .enum(["all", "folder", "agent", "manager_agent", "a2a_agent", "workflow"])
  .describe("Filter by asset type");

const listFilterFields = {
  page: z.number().int().min(1).optional().describe("Page number (default 1)"),
  limit: z
    .number()
    .int()
    .min(1)
    .max(100)
    .optional()
    .describe("Items per page (default 10)"),
  type: userAssetTypeEnum.optional(),
  sort_by: z
    .enum(["name", "created_at", "updated_at"])
    .optional()
    .describe("Sort field (default updated_at)"),
  order: z
    .enum(["asc", "desc"])
    .optional()
    .describe("Sort direction (default desc)"),
  providers: z
    .array(z.string())
    .optional()
    .describe("Filter by LLM provider id"),
  models: z.array(z.string()).optional().describe("Filter by model name"),
  owners: z
    .array(z.string())
    .optional()
    .describe("Filter by owner (created_by)"),
  is_active: z.boolean().optional().describe("Filter by active/inactive"),
  has_schedule: z
    .boolean()
    .optional()
    .describe(
      "Only agents with a schedule. Note: schedules are keyed to the owner's api_key, so agents shared to you are excluded from the results while this filter is active, even if they have a schedule.",
    ),
  has_trigger: z
    .boolean()
    .optional()
    .describe(
      "Only agents with a webhook trigger. Note: triggers are keyed to the owner's api_key, so agents shared to you are excluded from the results while this filter is active, even if they have a trigger.",
    ),
  tags: z.array(z.string()).optional().describe("Filter by custom tags"),
  capabilities: z
    .array(z.string())
    .optional()
    .describe(
      "Filter by capability: knowledge_base, tools, responsible_ai, memory",
    ),
  response_format: z
    .string()
    .optional()
    .describe("Response format: text | json"),
  updated_within_days: z
    .number()
    .int()
    .min(1)
    .optional()
    .describe("Only assets updated within the last N days"),
  metadata_contains: z
    .string()
    .optional()
    .describe("Substring match against custom metadata"),
};

/** Register the Usage Alerts + Widget Stream + User Assets tools. */
export const registerMiscUsageWidgetUserAssetsTools = (
  server: McpServer,
  client: MiscUsageWidgetUserAssetsClient,
) => {
  server.registerTool(
    "lyzr_run_usage_alerts",
    {
      title: "Run Usage Alert Pass",
      description:
        "Trigger a usage alert evaluation pass on the server. Optionally pass a server token header.",
      inputSchema: {
        x_server_token: z
          .string()
          .optional()
          .describe("Optional x-server-token header value"),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async ({ x_server_token }, extra) =>
      txt(await client.runUsageAlerts(x_server_token, extra.signal)),
  );

  server.registerTool(
    "lyzr_widget_stream",
    {
      title: "Widget Stream Chat",
      description:
        "Send a message to the pre-configured embeddable widget agent and stream back the response. No agent_id or credentials are accepted — the target agent is fixed server-side.",
      inputSchema: {
        message: z
          .string()
          .min(1)
          .max(4000)
          .describe("Message to send to the widget agent"),
        session_id: z.string().describe("Session id for the conversation"),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async ({ message, session_id }, extra) => {
      let full = "";
      full = await client.widgetStream(
        { message, session_id },
        () => {},
        extra.signal,
      );
      return txt(full);
    },
  );

  server.registerTool(
    "lyzr_list_user_asset_filters",
    {
      title: "List User Asset Filter Facets",
      description:
        "List the available filter facets (providers, models, owners, tags, etc.) for user assets.",
      inputSchema: {},
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async (_args, extra) =>
      txt(await client.listUserAssetFilters(extra.signal)),
  );

  server.registerTool(
    "lyzr_list_user_assets",
    {
      title: "List User Assets",
      description:
        "List the caller's user assets (agents, folders, workflows, etc.) with filtering, sorting, and pagination.",
      inputSchema: listFilterFields,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async (args, extra) => txt(await client.listUserAssets(args, extra.signal)),
  );

  server.registerTool(
    "lyzr_search_user_assets",
    {
      title: "Search User Assets",
      description:
        "Search the caller's user assets by query string, with the same filtering, sorting, and pagination options as listing.",
      inputSchema: {
        q: z.string().min(1).describe("Search query"),
        ...listFilterFields,
      },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async (args, extra) =>
      txt(await client.searchUserAssets(args, extra.signal)),
  );
};
