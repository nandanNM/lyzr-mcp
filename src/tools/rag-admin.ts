import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { RagAdminClient } from "../lyzr/rag-admin.js";

const txt = (d: unknown) => ({
  content: [
    {
      type: "text" as const,
      text: typeof d === "string" ? d : JSON.stringify(d, null, 2),
    },
  ],
});

/** Register the Knowledge Base (RAG) admin tools. */
export const registerRagAdminTools = (
  server: McpServer,
  client: RagAdminClient,
) => {
  server.registerTool(
    "lyzr_kb_update",
    {
      title: "Update Knowledge Base Config",
      description:
        "Update a knowledge base config by id. Provide the fields to change via extra_fields.",
      inputSchema: {
        config_id: z.string().describe("Knowledge base / RAG config id"),
        extra_fields: z
          .record(z.string(), z.any())
          .optional()
          .describe("Config fields to update (merged into the request body)"),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ config_id, extra_fields }, extra) =>
      txt(
        await client.updateConfig(config_id, { ...extra_fields }, extra.signal),
      ),
  );

  server.registerTool(
    "lyzr_kb_bulk_delete",
    {
      title: "Bulk Delete Knowledge Bases",
      description: "Permanently delete multiple knowledge base configs by id.",
      inputSchema: {
        config_ids: z
          .array(z.string())
          .min(1)
          .describe("List of RAG config ids to delete"),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async ({ config_ids }, extra) =>
      txt(await client.bulkDelete(config_ids, extra.signal)),
  );

  server.registerTool(
    "lyzr_kb_train_documents",
    {
      title: "Train KB Documents",
      description:
        "Ingest an array of document objects into a knowledge base. Each document is a free-form object.",
      inputSchema: {
        rag_id: z.string().describe("Knowledge base id"),
        documents: z
          .array(z.record(z.string(), z.any()))
          .min(1)
          .describe("Array of document objects to ingest"),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async ({ rag_id, documents }, extra) =>
      txt(await client.trainDocuments(rag_id, documents, extra.signal)),
  );

  server.registerTool(
    "lyzr_kb_delete_docs",
    {
      title: "Delete KB Documents",
      description:
        "Delete documents from a knowledge base by their document ids.",
      inputSchema: {
        rag_id: z.string().describe("Knowledge base id"),
        docs: z
          .array(z.string())
          .min(1)
          .describe("Array of document ids to delete"),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ rag_id, docs }, extra) =>
      txt(await client.deleteDocs(rag_id, docs, extra.signal)),
  );

  server.registerTool(
    "lyzr_kb_delete_docs_by_filter",
    {
      title: "Delete KB Documents by Filter",
      description:
        "Delete documents from a knowledge base matching a filter and/or a list of document ids.",
      inputSchema: {
        rag_id: z.string().describe("Knowledge base id"),
        docs: z
          .array(z.string())
          .optional()
          .describe("Optional list of document ids to delete"),
        filters: z
          .record(z.string(), z.any())
          .optional()
          .describe("Optional filter criteria object"),
        extra_fields: z
          .record(z.string(), z.any())
          .optional()
          .describe("Additional body fields (merged into the request body)"),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ rag_id, docs, filters, extra_fields }, extra) => {
      const body: Record<string, unknown> = { ...extra_fields };
      if (docs !== undefined) body.docs = docs;
      if (filters !== undefined) body.filters = filters;
      return txt(await client.deleteDocsByFilter(rag_id, body, extra.signal));
    },
  );

  server.registerTool(
    "lyzr_kb_update_docs_metadata",
    {
      title: "Update KB Documents Metadata",
      description:
        "Update metadata on documents in a knowledge base matching a filter.",
      inputSchema: {
        rag_id: z.string().describe("Knowledge base id"),
        filters: z
          .record(z.string(), z.any())
          .optional()
          .describe("Filter selecting which documents to update"),
        metadata_updates: z
          .record(z.string(), z.any())
          .optional()
          .describe("Metadata fields to set on matching documents"),
        extra_fields: z
          .record(z.string(), z.any())
          .optional()
          .describe("Additional body fields (merged into the request body)"),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ rag_id, filters, metadata_updates, extra_fields }, extra) => {
      const body: Record<string, unknown> = { ...extra_fields };
      if (filters !== undefined) body.filters = filters;
      if (metadata_updates !== undefined)
        body.metadata_updates = metadata_updates;
      return txt(await client.updateDocsMetadata(rag_id, body, extra.signal));
    },
  );

  server.registerTool(
    "lyzr_kb_reset",
    {
      title: "Reset Knowledge Base",
      description: "Clear all documents from a knowledge base.",
      inputSchema: {
        rag_id: z.string().describe("Knowledge base id"),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ rag_id }, extra) => txt(await client.reset(rag_id, extra.signal)),
  );
};
