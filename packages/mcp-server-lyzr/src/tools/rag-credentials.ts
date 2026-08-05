import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { RagCredentialsClient } from "../lyzr/rag-credentials.js";

const txt = (d: unknown) => ({
  content: [
    {
      type: "text" as const,
      text: typeof d === "string" ? d : JSON.stringify(d, null, 2),
    },
  ],
});

/** Register the RAG Credentials + Live Sources tools. */
export const registerRagCredentialsTools = (
  server: McpServer,
  client: RagCredentialsClient,
) => {
  // ---- Credentials ---------------------------------------------------------

  server.registerTool(
    "lyzr_credential_create",
    {
      title: "Create Credential",
      description: "Create a new credential. Returns the created credential.",
      inputSchema: {
        name: z.string().describe("Human-friendly credential name"),
        provider_id: z.string().describe("Provider id this credential is for"),
        credentials: z
          .record(z.string(), z.any())
          .describe("Provider-specific credential fields (key/value)"),
        scope: z
          .enum(["personal", "org"])
          .optional()
          .describe("Visibility: 'personal' (you) or 'org' (default personal)"),
        type: z.string().optional().describe("Optional credential type"),
        meta_data: z
          .record(z.string(), z.any())
          .optional()
          .describe("Optional metadata"),
        extra_fields: z
          .record(z.string(), z.any())
          .optional()
          .describe("Any additional fields, merged into the request body"),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async (args, extra) =>
      txt(await client.createCredential(args, extra.signal)),
  );

  server.registerTool(
    "lyzr_credential_list",
    {
      title: "List Credentials",
      description: "List all credentials.",
      inputSchema: {},
      annotations: {
        readOnlyHint: true,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async (_args, extra) => txt(await client.listCredentials(extra.signal)),
  );

  server.registerTool(
    "lyzr_credential_get",
    {
      title: "Get Credential",
      description: "Fetch a credential by id.",
      inputSchema: { credential_id: z.string().describe("Credential id") },
      annotations: {
        readOnlyHint: true,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ credential_id }, extra) =>
      txt(await client.getCredential(credential_id, extra.signal)),
  );

  server.registerTool(
    "lyzr_credential_update",
    {
      title: "Update Credential",
      description: "Update an existing credential. All fields optional.",
      inputSchema: {
        credential_id: z.string().describe("Credential id to update"),
        name: z.string().optional().describe("New credential name"),
        credentials: z
          .record(z.string(), z.any())
          .optional()
          .describe("New provider-specific credential fields"),
        scope: z
          .enum(["personal", "org"])
          .optional()
          .describe("Visibility: 'personal' or 'org'"),
        metadata: z
          .record(z.string(), z.any())
          .optional()
          .describe("New metadata"),
        extra_fields: z
          .record(z.string(), z.any())
          .optional()
          .describe("Any additional fields, merged into the request body"),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ credential_id, ...body }, extra) =>
      txt(await client.updateCredential(credential_id, body, extra.signal)),
  );

  server.registerTool(
    "lyzr_credential_delete",
    {
      title: "Delete Credential",
      description: "Permanently delete a credential by id.",
      inputSchema: { credential_id: z.string().describe("Credential id") },
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ credential_id }, extra) =>
      txt(await client.deleteCredential(credential_id, extra.signal)),
  );

  // ---- Live Sources --------------------------------------------------------

  server.registerTool(
    "lyzr_livesource_list_credentials",
    {
      title: "List Live Source Credentials",
      description: "List credentials available for use with live sources.",
      inputSchema: {},
      annotations: {
        readOnlyHint: true,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async (_args, extra) =>
      txt(await client.listLiveSourceCredentials(extra.signal)),
  );

  server.registerTool(
    "lyzr_livesource_add",
    {
      title: "Add Live Source",
      description:
        "Add a live source to a knowledge base. Returns the created live source.",
      inputSchema: {
        rag_id: z.string().describe("Knowledge base id"),
        source_type: z
          .string()
          .describe("Source type: 'google_drive', 'sharepoint', or 'website'"),
        name: z.string().describe("User-friendly name for this live source"),
        connector_specific_config: z
          .record(z.string(), z.any())
          .optional()
          .describe("Connector-specific configuration"),
        metadata: z
          .record(z.string(), z.any())
          .optional()
          .describe("Custom metadata stored on every indexed chunk"),
        kb_sync_credential_id: z
          .string()
          .optional()
          .describe(
            "ACI credential_id — required for sharepoint/google_drive, ignored for website",
          ),
        permissions_enabled: z
          .boolean()
          .optional()
          .describe(
            "Require per-user sign-in for document access (default false)",
          ),
        extra_fields: z
          .record(z.string(), z.any())
          .optional()
          .describe("Any additional fields, merged into the request body"),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async ({ rag_id, ...body }, extra) =>
      txt(await client.addLiveSource(rag_id, body, extra.signal)),
  );

  server.registerTool(
    "lyzr_livesource_list",
    {
      title: "List Live Sources",
      description: "List live sources for a knowledge base.",
      inputSchema: { rag_id: z.string().describe("Knowledge base id") },
      annotations: {
        readOnlyHint: true,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ rag_id }, extra) =>
      txt(await client.listLiveSources(rag_id, extra.signal)),
  );

  server.registerTool(
    "lyzr_livesource_get",
    {
      title: "Get Live Source",
      description: "Fetch a live source by id.",
      inputSchema: {
        rag_id: z.string().describe("Knowledge base id"),
        live_source_id: z.string().describe("Live source id"),
      },
      annotations: {
        readOnlyHint: true,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ rag_id, live_source_id }, extra) =>
      txt(await client.getLiveSource(rag_id, live_source_id, extra.signal)),
  );

  server.registerTool(
    "lyzr_livesource_remove",
    {
      title: "Remove Live Source",
      description: "Permanently remove a live source from a knowledge base.",
      inputSchema: {
        rag_id: z.string().describe("Knowledge base id"),
        live_source_id: z.string().describe("Live source id"),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ rag_id, live_source_id }, extra) =>
      txt(await client.removeLiveSource(rag_id, live_source_id, extra.signal)),
  );

  server.registerTool(
    "lyzr_livesource_sync",
    {
      title: "Sync Live Source",
      description: "Trigger a sync for a live source.",
      inputSchema: {
        rag_id: z.string().describe("Knowledge base id"),
        live_source_id: z.string().describe("Live source id"),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async ({ rag_id, live_source_id }, extra) =>
      txt(await client.syncLiveSource(rag_id, live_source_id, extra.signal)),
  );

  server.registerTool(
    "lyzr_livesource_pause",
    {
      title: "Pause Live Source",
      description: "Pause syncing for a live source.",
      inputSchema: {
        rag_id: z.string().describe("Knowledge base id"),
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
      txt(await client.pauseLiveSource(rag_id, live_source_id, extra.signal)),
  );

  server.registerTool(
    "lyzr_livesource_resume",
    {
      title: "Resume Live Source",
      description: "Resume syncing for a paused live source.",
      inputSchema: {
        rag_id: z.string().describe("Knowledge base id"),
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
      txt(await client.resumeLiveSource(rag_id, live_source_id, extra.signal)),
  );

  server.registerTool(
    "lyzr_livesource_repoint",
    {
      title: "Repoint Live Source",
      description:
        "Repoint a live source to a new credential. Existing webhook subscriptions are re-created.",
      inputSchema: {
        rag_id: z.string().describe("Knowledge base id"),
        live_source_id: z.string().describe("Live source id"),
        new_credential_id: z
          .string()
          .min(1)
          .describe("ACI credential_id (UUID) to repoint to"),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async ({ rag_id, live_source_id, new_credential_id }, extra) =>
      txt(
        await client.repointLiveSource(
          rag_id,
          live_source_id,
          new_credential_id,
          extra.signal,
        ),
      ),
  );
};
