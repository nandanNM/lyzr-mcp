import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { KbSyncLegacyClient } from "../lyzr/kb-sync-oauth-legacy.js";

const txt = (data: unknown) => ({
  content: [
    {
      type: "text" as const,
      text: typeof data === "string" ? data : JSON.stringify(data, null, 2),
    },
  ],
});

/** Register the legacy KB Sync OAuth / Browse / Webhooks tools. */
export const registerKbSyncOauthLegacyTools = (
  server: McpServer,
  client: KbSyncLegacyClient,
) => {
  // --- OAuth ---

  server.registerTool(
    "lyzr_kb_sync_sharepoint_oauth_exchange",
    {
      title: "SharePoint OAuth Exchange (Deprecated)",
      description:
        "[deprecated] Exchange a SharePoint OAuth authorization code.",
      inputSchema: {},
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async (_args, extra) => txt(await client.sharepointOauthExchange(extra.signal)),
  );

  server.registerTool(
    "lyzr_kb_sync_sharepoint_oauth_callback",
    {
      title: "SharePoint OAuth Callback (Deprecated)",
      description: "[deprecated] Handle the SharePoint OAuth callback.",
      inputSchema: {},
      annotations: {
        readOnlyHint: true,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async (_args, extra) => txt(await client.sharepointOauthCallback(extra.signal)),
  );

  server.registerTool(
    "lyzr_kb_sync_sharepoint_oauth_authorize",
    {
      title: "SharePoint OAuth Authorize (Deprecated)",
      description: "[deprecated] Get the SharePoint OAuth authorize URL.",
      inputSchema: {},
      annotations: {
        readOnlyHint: true,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async (_args, extra) => txt(await client.sharepointOauthAuthorize(extra.signal)),
  );

  // --- Browse ---

  server.registerTool(
    "lyzr_kb_sync_browse_sites",
    {
      title: "Browse SharePoint Sites (Deprecated)",
      description: "[deprecated] Browse available SharePoint sites.",
      inputSchema: {
        credential_id: z
          .string()
          .describe("ACI credential_id for SharePoint auth"),
      },
      annotations: {
        readOnlyHint: true,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ credential_id }, extra) =>
      txt(await client.browseSites(credential_id, extra.signal)),
  );

  server.registerTool(
    "lyzr_kb_sync_browse_drives",
    {
      title: "Browse SharePoint Drives (Deprecated)",
      description: "[deprecated] Browse drives within a SharePoint site.",
      inputSchema: {
        credential_id: z
          .string()
          .describe("ACI credential_id for SharePoint auth"),
        site_url: z.string().describe("SharePoint site URL"),
      },
      annotations: {
        readOnlyHint: true,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ credential_id, site_url }, extra) =>
      txt(await client.browseDrives(credential_id, site_url, extra.signal)),
  );

  server.registerTool(
    "lyzr_kb_sync_browse_children",
    {
      title: "Browse SharePoint Drive Children (Deprecated)",
      description:
        "[deprecated] Browse files/folders within a SharePoint drive path.",
      inputSchema: {
        credential_id: z
          .string()
          .describe("ACI credential_id for SharePoint auth"),
        site_url: z.string().describe("SharePoint site URL"),
        drive_name: z
          .string()
          .describe("Drive name (e.g. 'Shared Documents')"),
        folder_path: z
          .string()
          .optional()
          .describe("Folder path relative to drive root"),
      },
      annotations: {
        readOnlyHint: true,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ credential_id, site_url, drive_name, folder_path }, extra) =>
      txt(
        await client.browseChildren(
          credential_id,
          site_url,
          drive_name,
          folder_path,
          extra.signal,
        ),
      ),
  );

  server.registerTool(
    "lyzr_kb_sync_validate_site_access",
    {
      title: "Validate SharePoint Site Access (Deprecated)",
      description:
        "[deprecated] Validate that a credential has access to the given SharePoint site/drive URLs.",
      inputSchema: {
        credential_id: z
          .string()
          .describe("ACI credential_id for SharePoint auth"),
        site_urls: z
          .array(z.string())
          .describe("SharePoint site/drive URLs to validate"),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ credential_id, site_urls }, extra) =>
      txt(
        await client.validateSiteAccess(
          { credential_id, site_urls },
          extra.signal,
        ),
      ),
  );

  // --- Webhooks ---

  server.registerTool(
    "lyzr_kb_sync_webhook_validation",
    {
      title: "KB Sync Webhook Validation (Deprecated)",
      description: "[deprecated] Webhook validation handshake endpoint.",
      inputSchema: {},
      annotations: {
        readOnlyHint: true,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async (_args, extra) => txt(await client.webhookValidation(extra.signal)),
  );

  server.registerTool(
    "lyzr_kb_sync_webhook_notification",
    {
      title: "KB Sync Webhook Notification (Deprecated)",
      description:
        "[deprecated] Receive a KB Sync webhook notification payload.",
      inputSchema: {
        payload: z
          .record(z.unknown())
          .optional()
          .describe("Raw webhook notification payload"),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async ({ payload }, extra) =>
      txt(await client.webhookNotification(payload, extra.signal)),
  );
};
