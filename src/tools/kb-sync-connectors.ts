import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { KbSyncConnectorsClient } from "../lyzr/kb-sync-connectors.js";

const txt = (data: unknown) => ({
  content: [
    {
      type: "text" as const,
      text: typeof data === "string" ? data : JSON.stringify(data, null, 2),
    },
  ],
});

/** Register the KB Sync connectors + credentials tools. */
export const registerKbSyncConnectorsTools = (
  server: McpServer,
  client: KbSyncConnectorsClient,
) => {
  server.registerTool(
    "lyzr_kbsync_connector_list",
    {
      title: "List KB Sync Connectors",
      description: "List all KB Sync connectors.",
      inputSchema: {},
      annotations: {
        readOnlyHint: true,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async (_args, extra) => txt(await client.listConnectors(extra.signal)),
  );

  server.registerTool(
    "lyzr_kbsync_connector_create",
    {
      title: "Create KB Sync Connector",
      description: "Create a new KB Sync connector for a document source.",
      inputSchema: {
        name: z.string().describe("Connector name"),
        source: z
          .string()
          .describe(
            "Document source type (e.g. google_drive, confluence, notion)",
          ),
        connector_specific_config: z
          .record(z.unknown())
          .describe("Connector-specific configuration object"),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async ({ name, source, connector_specific_config }, extra) =>
      txt(
        await client.createConnector(
          { name, source, connector_specific_config },
          extra.signal,
        ),
      ),
  );

  server.registerTool(
    "lyzr_kbsync_connector_get",
    {
      title: "Get KB Sync Connector",
      description: "Fetch a KB Sync connector by id.",
      inputSchema: {
        connector_id: z.number().int().describe("The connector id"),
      },
      annotations: {
        readOnlyHint: true,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ connector_id }, extra) =>
      txt(await client.getConnector(connector_id, extra.signal)),
  );

  server.registerTool(
    "lyzr_kbsync_connector_update",
    {
      title: "Update KB Sync Connector",
      description:
        "Update a KB Sync connector's name, config, or disabled state.",
      inputSchema: {
        connector_id: z.number().int().describe("The connector id to update"),
        name: z.string().optional().describe("New connector name"),
        connector_specific_config: z
          .record(z.unknown())
          .optional()
          .describe("Replacement connector-specific configuration object"),
        disabled: z
          .boolean()
          .optional()
          .describe("Whether the connector should be disabled"),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ connector_id, ...fields }, extra) =>
      txt(await client.updateConnector(connector_id, fields, extra.signal)),
  );

  server.registerTool(
    "lyzr_kbsync_connector_delete",
    {
      title: "Delete KB Sync Connector",
      description: "Permanently delete a KB Sync connector by id.",
      inputSchema: {
        connector_id: z.number().int().describe("The connector id to delete"),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ connector_id }, extra) =>
      txt(await client.deleteConnector(connector_id, extra.signal)),
  );

  server.registerTool(
    "lyzr_kbsync_credential_list",
    {
      title: "List KB Sync Credentials",
      description:
        "List KB Sync connector credentials (distinct from the general RAG credentials system).",
      inputSchema: {},
      annotations: {
        readOnlyHint: true,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async (_args, extra) =>
      txt(await client.listKbSyncCredentials(extra.signal)),
  );

  server.registerTool(
    "lyzr_kbsync_credential_create",
    {
      title: "Create KB Sync Credential",
      description:
        "Create a KB Sync connector credential (distinct from the general RAG credentials system).",
      inputSchema: {
        credential_json: z
          .record(z.unknown())
          .describe("Credential data for the connector's source"),
        scope: z
          .string()
          .optional()
          .describe(
            "Credential visibility: 'personal' (only you) or 'org' (all users in your org). Default personal.",
          ),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async ({ credential_json, scope }, extra) =>
      txt(
        await client.createKbSyncCredential(
          { credential_json, scope },
          extra.signal,
        ),
      ),
  );
};
