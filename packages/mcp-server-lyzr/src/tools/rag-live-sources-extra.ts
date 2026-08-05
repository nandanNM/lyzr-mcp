import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { LiveSourcesExtraClient } from "../lyzr/rag-live-sources-extra.js";

const txt = (data: unknown) => ({
  content: [
    {
      type: "text" as const,
      text: typeof data === "string" ? data : JSON.stringify(data, null, 2),
    },
  ],
});

/** Register the Live Sources Extra (browse/webhooks/sync-permissions) tools. */
export const registerLiveSourcesExtraTools = (
  server: McpServer,
  client: LiveSourcesExtraClient,
) => {
  server.registerTool(
    "lyzr_livesource_ext_sync_permissions",
    {
      title: "Sync Live Source Permissions",
      description:
        "Sync access permissions for a live source (e.g. re-check SharePoint ACLs).",
      inputSchema: {
        rag_id: z.string().describe("Knowledge base (RAG) id"),
        live_source_id: z.string().describe("Live source id"),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ rag_id, live_source_id }, extra) =>
      txt(await client.syncPermissions(rag_id, live_source_id, extra.signal)),
  );

  server.registerTool(
    "lyzr_livesource_ext_browse_sites",
    {
      title: "Browse SharePoint Sites",
      description: "List SharePoint sites accessible via a stored credential.",
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
    "lyzr_livesource_ext_browse_drives",
    {
      title: "Browse SharePoint Drives",
      description: "List drives within a SharePoint site.",
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
    "lyzr_livesource_ext_browse_children",
    {
      title: "Browse SharePoint Drive Children",
      description: "List files/folders within a SharePoint drive folder.",
      inputSchema: {
        credential_id: z
          .string()
          .describe("ACI credential_id for SharePoint auth"),
        site_url: z.string().describe("SharePoint site URL"),
        drive_name: z.string().describe("Drive name (e.g. 'Shared Documents')"),
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
    "lyzr_livesource_ext_validate_access",
    {
      title: "Validate SharePoint Site Access",
      description:
        "Validate that a credential has access to the given SharePoint site/drive URLs.",
      inputSchema: {
        credential_id: z
          .string()
          .describe("ACI credential_id for SharePoint auth"),
        site_urls: z
          .array(z.string())
          .min(1)
          .describe("SharePoint site/drive URLs to validate"),
      },
      annotations: {
        readOnlyHint: true,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ credential_id, site_urls }, extra) =>
      txt(
        await client.validateAccess({ credential_id, site_urls }, extra.signal),
      ),
  );

  server.registerTool(
    "lyzr_livesource_ext_webhook_get",
    {
      title: "Live Source Webhook Validation",
      description:
        "Webhook subscription validation handshake for live source notifications.",
      inputSchema: {},
      annotations: {
        readOnlyHint: true,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async (_args, extra) =>
      txt(await client.getWebhookNotifications(extra.signal)),
  );

  server.registerTool(
    "lyzr_livesource_ext_webhook_post",
    {
      title: "Live Source Webhook Notification",
      description:
        "Send a live source webhook notification payload (e.g. from a SharePoint change feed).",
      inputSchema: {
        payload: z.record(z.unknown()).describe("Webhook notification payload"),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async ({ payload }, extra) =>
      txt(await client.postWebhookNotification(payload, extra.signal)),
  );
};
