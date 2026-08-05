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
          .describe(
            "Server-to-server auth token (sent as the x-server-token header) — the platform's " +
              "settings.server_auth_token secret, distinct from the caller's regular Lyzr API key.",
          ),
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
          .describe(
            "Server-to-server auth token (sent as the x-server-token header) — the platform's " +
              "settings.server_auth_token secret, distinct from the caller's regular Lyzr API key.",
          ),
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
  // Gated by verify_admin_token (Bearer PAGOS_ADMIN_TOKEN) — a separate secret from the caller's Lyzr API key, supplied via `admin_token`.

  const adminTokenSchema = z
    .string()
    .describe(
      "The platform's PAGOS_ADMIN_TOKEN, sent as 'Authorization: Bearer <admin_token>'. " +
        "This is a separate secret from your Lyzr API key — these admin routes do not accept the API key.",
    );

  server.registerTool(
    "lyzr_list_feature_flags_admin",
    {
      title: "List Feature Flags (Admin)",
      description: "List all feature flags with their gating configuration.",
      inputSchema: { admin_token: adminTokenSchema },
      annotations: {
        readOnlyHint: true,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ admin_token }, extra) =>
      txt(await client.listFeatureFlagsAdmin(admin_token, extra.signal)),
  );

  server.registerTool(
    "lyzr_create_feature_flag",
    {
      title: "Create Feature Flag",
      description: "Create a new feature flag.",
      inputSchema: {
        admin_token: adminTokenSchema,
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
    async ({ admin_token, ...rest }, extra) =>
      txt(await client.createFeatureFlag(admin_token, rest, extra.signal)),
  );

  server.registerTool(
    "lyzr_get_feature_flag_admin",
    {
      title: "Get Feature Flag (Admin)",
      description: "Fetch a single feature flag by key.",
      inputSchema: {
        admin_token: adminTokenSchema,
        key: z.string().describe("Feature flag key"),
      },
      annotations: {
        readOnlyHint: true,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ admin_token, key }, extra) =>
      txt(await client.getFeatureFlagAdmin(admin_token, key, extra.signal)),
  );

  server.registerTool(
    "lyzr_update_feature_flag",
    {
      title: "Update Feature Flag",
      description: "Update an existing feature flag's fields.",
      inputSchema: {
        admin_token: adminTokenSchema,
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
    async ({ admin_token, key, ...rest }, extra) =>
      txt(await client.updateFeatureFlag(admin_token, key, rest, extra.signal)),
  );

  server.registerTool(
    "lyzr_delete_feature_flag",
    {
      title: "Delete Feature Flag",
      description: "Permanently delete a feature flag by key.",
      inputSchema: {
        admin_token: adminTokenSchema,
        key: z.string().describe("Feature flag key"),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ admin_token, key }, extra) =>
      txt(await client.deleteFeatureFlag(admin_token, key, extra.signal)),
  );

  // NOTE: "Modules" tool set was removed — no such router exists in the backend; GET /v3/modules returns 405.

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
