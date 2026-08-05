import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { type SharingClient, ACCESS_LEVELS } from "../lyzr/sharing.js";

const txt = (data: unknown) => ({
  content: [
    {
      type: "text" as const,
      text: typeof data === "string" ? data : JSON.stringify(data, null, 2),
    },
  ],
});

const accessLevel = z.enum(ACCESS_LEVELS);

const sharedUserSchema = z.object({
  user_id: z.string().describe("User id to share with"),
  email: z.string().optional().describe("User's email"),
  access_level: accessLevel
    .optional()
    .describe(
      `Access level granted to this user. One of: ${ACCESS_LEVELS.join(", ")}`,
    ),
});

/** Register the Sharing (access-control groups) tools. */
export const registerSharingTools = (
  server: McpServer,
  sharing: SharingClient,
) => {
  server.registerTool(
    "lyzr_sharing_create_group",
    {
      title: "Create Sharing Group",
      description:
        "Create a sharing group rooted at a resource, controlling who can access it.",
      inputSchema: {
        root_resource_id: z.string().describe("Id of the root resource"),
        root_resource_type: z
          .string()
          .describe("Type of the root resource, e.g. agent, superflow"),
        access_level: accessLevel
          .optional()
          .describe(
            `Default access level (default private). One of: ${ACCESS_LEVELS.join(", ")}. ` +
              `Use "organisation" here (not a separate field) to grant access to the whole org.`,
          ),
        shared_with: z
          .array(sharedUserSchema)
          .optional()
          .describe("Users to share the group with"),
        agent_ids: z
          .array(z.string())
          .optional()
          .describe("Agent ids included under this group"),
        superflow_ids: z
          .array(z.string())
          .optional()
          .describe("Superflow ids included under this group"),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async (args, extra) => txt(await sharing.createGroup(args, extra.signal)),
  );

  server.registerTool(
    "lyzr_sharing_list_groups",
    {
      title: "List Sharing Groups",
      description: "List sharing groups, paginated.",
      inputSchema: {
        page: z
          .number()
          .int()
          .min(1)
          .optional()
          .describe("Page number (default 1)"),
        limit: z
          .number()
          .int()
          .min(1)
          .optional()
          .describe("Page size (default 10)"),
      },
      annotations: {
        readOnlyHint: true,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async (args, extra) => txt(await sharing.listGroups(args, extra.signal)),
  );

  server.registerTool(
    "lyzr_sharing_get_group",
    {
      title: "Get Sharing Group",
      description: "Fetch a sharing group by id.",
      inputSchema: { group_id: z.string().describe("Sharing group id") },
      annotations: {
        readOnlyHint: true,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ group_id }, extra) =>
      txt(await sharing.getGroup(group_id, extra.signal)),
  );

  server.registerTool(
    "lyzr_sharing_update_group",
    {
      title: "Update Sharing Group",
      description: "Update a sharing group's access levels or shared users.",
      inputSchema: {
        group_id: z.string().describe("Sharing group id"),
        access_level: accessLevel
          .optional()
          .describe(
            `New default access level. One of: ${ACCESS_LEVELS.join(", ")}. ` +
              `Use "organisation" here (not a separate field) for org-wide access.`,
          ),
        shared_with: z
          .array(sharedUserSchema)
          .optional()
          .describe("Replacement list of users to share with"),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ group_id, ...body }, extra) =>
      txt(await sharing.updateGroup(group_id, body, extra.signal)),
  );

  server.registerTool(
    "lyzr_sharing_delete_group",
    {
      title: "Delete Sharing Group",
      description: "Permanently delete a sharing group by id.",
      inputSchema: { group_id: z.string().describe("Sharing group id") },
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ group_id }, extra) =>
      txt(await sharing.deleteGroup(group_id, extra.signal)),
  );

  server.registerTool(
    "lyzr_sharing_share_group",
    {
      title: "Share Group With Users",
      description: "Add or update the users a sharing group is shared with.",
      inputSchema: {
        group_id: z.string().describe("Sharing group id"),
        shared_with: z
          .array(sharedUserSchema)
          .min(1)
          .describe("Users to share the group with"),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async ({ group_id, shared_with }, extra) =>
      txt(await sharing.shareGroup(group_id, { shared_with }, extra.signal)),
  );

  server.registerTool(
    "lyzr_sharing_refresh_group",
    {
      title: "Refresh Sharing Group",
      description: "Refresh a sharing group's cached shared-resource index.",
      inputSchema: { group_id: z.string().describe("Sharing group id") },
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async ({ group_id }, extra) =>
      txt(await sharing.refreshGroup(group_id, extra.signal)),
  );

  server.registerTool(
    "lyzr_sharing_get_resource_groups",
    {
      title: "Get Resource's Sharing Groups",
      description: "List the sharing groups a given resource belongs to.",
      inputSchema: {
        resource_type: z
          .string()
          .describe("Resource type, e.g. agent, superflow"),
        resource_id: z.string().describe("Resource id"),
        root_tree: z
          .boolean()
          .optional()
          .describe("Whether to include the full root tree (default false)"),
      },
      annotations: {
        readOnlyHint: true,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ resource_type, resource_id, root_tree }, extra) =>
      txt(
        await sharing.getResourceGroups(
          resource_type,
          resource_id,
          root_tree,
          extra.signal,
        ),
      ),
  );

  server.registerTool(
    "lyzr_sharing_reconcile_indexes",
    {
      title: "Reconcile Sharing Indexes",
      description: "Trigger a reconciliation pass over all sharing indexes.",
      inputSchema: {},
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async (_args, extra) => txt(await sharing.reconcileIndexes(extra.signal)),
  );

  server.registerTool(
    "lyzr_sharing_check_access",
    {
      title: "Check Shared Access",
      description:
        "Check whether a user (via their org) has the required access level to a resource.",
      inputSchema: {
        resource_type: z
          .string()
          .describe("Resource type, e.g. agent, superflow"),
        resource_id: z.string().describe("Resource id"),
        user_id: z.string().describe("User id to check access for"),
        org_id: z.string().describe("Organisation id"),
        required_access: accessLevel
          .optional()
          .describe(
            `Minimum access level required (default read). One of: ${ACCESS_LEVELS.join(", ")}`,
          ),
      },
      annotations: {
        readOnlyHint: true,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async (args, extra) => txt(await sharing.checkAccess(args, extra.signal)),
  );

  server.registerTool(
    "lyzr_sharing_list_accessible",
    {
      title: "List Accessible Resources",
      description:
        "List resources of a given type that a user (via their org) has shared access to.",
      inputSchema: {
        resource_type: z
          .string()
          .describe("Resource type, e.g. agent, superflow"),
        user_id: z
          .string()
          .describe("User id to list accessible resources for"),
        org_id: z.string().describe("Organisation id"),
      },
      annotations: {
        readOnlyHint: true,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async (args, extra) =>
      txt(await sharing.listAccessible(args, extra.signal)),
  );
};
