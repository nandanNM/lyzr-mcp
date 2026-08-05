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
  .enum(["all", "folder", "agent", "manager_agent", "workflow"])
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
};

/** Register the User Assets tools. */
export const registerMiscUsageWidgetUserAssetsTools = (
  server: McpServer,
  client: MiscUsageWidgetUserAssetsClient,
) => {
  server.registerTool(
    "lyzr_list_user_assets",
    {
      title: "List User Assets",
      description:
        "List the caller's user assets (agents, folders, workflows, etc.) with pagination and type filtering.",
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
        "Search the caller's user assets by query string, with the same pagination and type filtering options as listing.",
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
