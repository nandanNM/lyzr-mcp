import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { PlatformAdminClient } from "../lyzr/platform-admin.js";

const txt = (data: unknown) => ({
  content: [
    {
      type: "text" as const,
      text: typeof data === "string" ? data : JSON.stringify(data, null, 2),
    },
  ],
});

const gatingSchema = {
  enabled_for_roles: z
    .array(z.string())
    .nullable()
    .optional()
    .describe("Roles this is enabled for, or null for all roles"),
  enabled_for_plans: z
    .array(z.string())
    .nullable()
    .optional()
    .describe("Plans this is enabled for, or null for all plans"),
  enabled_for_envs: z
    .array(z.string())
    .nullable()
    .optional()
    .describe("Environments this is enabled for, or null for all envs"),
};

/**
 * Registers platform admin tools: credits, feature flags, modules, and the
 * aggregate features/modules endpoints.
 */
export const registerPlatformAdminTools = (
  server: McpServer,
  client: PlatformAdminClient,
) => {
  // ---- Credits ----

  server.registerTool(
    "lyzr_get_cached_credits",
    {
      title: "Get Cached Credits",
      description: "Fetch the cached credit-cost map keyed by resource/action.",
      inputSchema: {
        x_server_token: z
          .string()
          .optional()
          .describe("Optional server-to-server auth token"),
      },
      annotations: {
        readOnlyHint: true,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ x_server_token }, extra) =>
      txt(await client.getCachedCredits(x_server_token, extra.signal)),
  );

  server.registerTool(
    "lyzr_refresh_credit_cache",
    {
      title: "Refresh Credit Cache",
      description: "Force a refresh of the server-side credit-cost cache.",
      inputSchema: {
        x_server_token: z
          .string()
          .optional()
          .describe("Optional server-to-server auth token"),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async ({ x_server_token }, extra) =>
      txt(await client.refreshCreditCache(x_server_token, extra.signal)),
  );

  // ---- Feature Flags (resolved) ----

  server.registerTool(
    "lyzr_get_feature_flags",
    {
      title: "Get Feature Flags",
      description:
        "Get the resolved feature flags applicable to the current caller.",
      inputSchema: {},
      annotations: {
        readOnlyHint: true,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async (_args, extra) => txt(await client.getFeatureFlags(extra.signal)),
  );

  // ---- Feature Flags Admin ----

  server.registerTool(
    "lyzr_list_feature_flags_admin",
    {
      title: "List Feature Flags (Admin)",
      description: "List all feature flags with their gating configuration.",
      inputSchema: {},
      annotations: {
        readOnlyHint: true,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async (_args, extra) =>
      txt(await client.listFeatureFlagsAdmin(extra.signal)),
  );

  server.registerTool(
    "lyzr_create_feature_flag",
    {
      title: "Create Feature Flag",
      description: "Create a new feature flag.",
      inputSchema: {
        key: z.string().describe("Unique flag key"),
        description: z.string().describe("Human-readable description"),
        url: z.string().describe("URL/route this flag gates"),
        ...gatingSchema,
        is_visible: z
          .boolean()
          .optional()
          .describe("Whether the flag is visible (default false)"),
        is_accessible: z
          .boolean()
          .optional()
          .describe("Whether the flag is accessible (default false)"),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async (args, extra) =>
      txt(await client.createFeatureFlag(args, extra.signal)),
  );

  server.registerTool(
    "lyzr_get_feature_flag_admin",
    {
      title: "Get Feature Flag (Admin)",
      description: "Fetch a single feature flag by key.",
      inputSchema: { key: z.string().describe("Feature flag key") },
      annotations: {
        readOnlyHint: true,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ key }, extra) =>
      txt(await client.getFeatureFlagAdmin(key, extra.signal)),
  );

  server.registerTool(
    "lyzr_update_feature_flag",
    {
      title: "Update Feature Flag",
      description: "Update an existing feature flag's fields.",
      inputSchema: {
        key: z.string().describe("Feature flag key"),
        description: z
          .string()
          .nullable()
          .optional()
          .describe("Human-readable description"),
        ...gatingSchema,
        is_visible: z.boolean().nullable().optional(),
        is_accessible: z.boolean().nullable().optional(),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async ({ key, ...rest }, extra) =>
      txt(await client.updateFeatureFlag(key, rest, extra.signal)),
  );

  server.registerTool(
    "lyzr_delete_feature_flag",
    {
      title: "Delete Feature Flag",
      description: "Permanently delete a feature flag by key.",
      inputSchema: { key: z.string().describe("Feature flag key") },
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ key }, extra) =>
      txt(await client.deleteFeatureFlag(key, extra.signal)),
  );

  // ---- Modules (resolved) ----

  server.registerTool(
    "lyzr_get_modules",
    {
      title: "Get Modules",
      description:
        "Get the resolved sidebar modules (nav + footer) for the current caller.",
      inputSchema: {},
      annotations: {
        readOnlyHint: true,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async (_args, extra) => txt(await client.getModules(extra.signal)),
  );

  // ---- Modules Admin ----

  server.registerTool(
    "lyzr_list_modules_admin",
    {
      title: "List Modules (Admin)",
      description: "List all sidebar modules with their configuration.",
      inputSchema: {},
      annotations: {
        readOnlyHint: true,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async (_args, extra) => txt(await client.listModulesAdmin(extra.signal)),
  );

  server.registerTool(
    "lyzr_create_module",
    {
      title: "Create Module",
      description: "Create a new sidebar module.",
      inputSchema: {
        key: z.string().describe("Unique module key"),
        description: z.string().describe("Human-readable description"),
        url: z.string().describe("URL/route this module points to"),
        ...gatingSchema,
        is_visible: z.boolean().optional().describe("Default true"),
        is_accessible: z.boolean().optional().describe("Default true"),
        name: z.string().nullable().optional().describe("Display name"),
        icon: z.string().nullable().optional().describe("Icon identifier"),
        route: z.string().nullable().optional().describe("Frontend route"),
        order: z.number().int().nullable().optional().describe("Sort order"),
        section: z.string().nullable().optional().describe("Sidebar section"),
        heading: z.string().nullable().optional().describe("Section heading"),
        type: z.string().nullable().optional().describe("Item type"),
        external: z
          .boolean()
          .nullable()
          .optional()
          .describe("Whether this links externally"),
        action_id: z.string().nullable().optional().describe("Action id"),
        badge: z.string().nullable().optional().describe("Badge text"),
        subtitle: z.string().nullable().optional().describe("Subtitle text"),
        is_new: z.boolean().nullable().optional().describe("Show 'new' badge"),
        beta: z.boolean().nullable().optional().describe("Show 'beta' badge"),
        blocked: z
          .boolean()
          .nullable()
          .optional()
          .describe("Whether this module is blocked"),
        upgrade_description: z
          .string()
          .nullable()
          .optional()
          .describe("Upgrade prompt text when blocked"),
        config: z
          .record(z.unknown())
          .nullable()
          .optional()
          .describe("Arbitrary extra config"),
        use_tracking: z
          .boolean()
          .optional()
          .describe("Whether to track usage (default false)"),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async (args, extra) => txt(await client.createModule(args, extra.signal)),
  );

  server.registerTool(
    "lyzr_get_module_admin",
    {
      title: "Get Module (Admin)",
      description: "Fetch a single sidebar module by key.",
      inputSchema: { key: z.string().describe("Module key") },
      annotations: {
        readOnlyHint: true,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ key }, extra) =>
      txt(await client.getModuleAdmin(key, extra.signal)),
  );

  server.registerTool(
    "lyzr_update_module",
    {
      title: "Update Module",
      description: "Update an existing sidebar module's fields.",
      inputSchema: {
        key: z.string().describe("Module key"),
        description: z.string().nullable().optional(),
        ...gatingSchema,
        is_visible: z.boolean().nullable().optional(),
        is_accessible: z.boolean().nullable().optional(),
        name: z.string().nullable().optional(),
        icon: z.string().nullable().optional(),
        route: z.string().nullable().optional(),
        order: z.number().int().nullable().optional(),
        section: z.string().nullable().optional(),
        heading: z.string().nullable().optional(),
        type: z.string().nullable().optional(),
        external: z.boolean().nullable().optional(),
        action_id: z.string().nullable().optional(),
        badge: z.string().nullable().optional(),
        subtitle: z.string().nullable().optional(),
        is_new: z.boolean().nullable().optional(),
        beta: z.boolean().nullable().optional(),
        blocked: z.boolean().nullable().optional(),
        upgrade_description: z.string().nullable().optional(),
        config: z.record(z.unknown()).nullable().optional(),
        use_tracking: z.boolean().nullable().optional(),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async ({ key, ...rest }, extra) =>
      txt(await client.updateModule(key, rest, extra.signal)),
  );

  server.registerTool(
    "lyzr_delete_module",
    {
      title: "Delete Module",
      description: "Permanently delete a sidebar module by key.",
      inputSchema: { key: z.string().describe("Module key") },
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ key }, extra) => txt(await client.deleteModule(key, extra.signal)),
  );

  // ---- Features v3 (aggregate) ----

  server.registerTool(
    "lyzr_get_features",
    {
      title: "Get Features",
      description:
        "Get the aggregate feature-availability map for the current caller.",
      inputSchema: {},
      annotations: {
        readOnlyHint: true,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async (_args, extra) => txt(await client.getFeatures(extra.signal)),
  );
};
