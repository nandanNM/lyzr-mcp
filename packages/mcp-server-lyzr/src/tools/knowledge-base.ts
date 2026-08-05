import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { type RagClient, KNOWN_VECTOR_STORES } from "../lyzr/rag.js";

const txt = (data: unknown) => ({
  content: [
    {
      type: "text" as const,
      text: typeof data === "string" ? data : JSON.stringify(data, null, 2),
    },
  ],
});

/** Register the Knowledge Base (RAG) tools. */
export const registerKnowledgeBaseTools = (
  server: McpServer,
  rag: RagClient,
) => {
  server.registerTool(
    "lyzr_kb_create",
    {
      title: "Create Knowledge Base",
      description:
        "Create a RAG knowledge base. Returns its id. Set semantic_data_model: true to create a " +
        "schema-aware Semantic Data Model KB (for text-to-SQL style querying) instead of a basic " +
        "vector-retrieval KB — after creating it, connect it to a real database with " +
        "lyzr_semantic_model_connect_database. `vector_store` resolves to a Lyzr-shared default " +
        "credential — some (e.g. neptune) may have no working shared credential provisioned, " +
        "failing later at training time with an opaque error. If that happens, or to use a store " +
        "outside the known list, first create your own credential with " +
        "lyzr_create_provider_credential (same mechanism as Studio's Data Connectors page) and " +
        "pass its id as vector_db_credential_id to use it instead of the shared default.",
      inputSchema: {
        name: z
          .string()
          .describe("KB name — lowercase letters, numbers, underscores only"),
        vector_store: z
          .string()
          .default("qdrant")
          .describe(`Vector store: ${KNOWN_VECTOR_STORES.join(", ")}`),
        vector_db_credential_id: z
          .string()
          .optional()
          .describe(
            "Override the vector-store credential id instead of the shared lyzr_* default for " +
              "vector_store — use your own credential id from lyzr_create_provider_credential " +
              "(e.g. to work around a missing/broken shared default like lyzr_neptune).",
          ),
        vector_store_provider: z
          .string()
          .optional()
          .describe(
            "Display name to store alongside a custom vector_db_credential_id (defaults to the " +
              "credential id itself if not given).",
          ),
        embedding_model: z
          .string()
          .optional()
          .describe("Embedding model (default text-embedding-3-large)"),
        llm_model: z.string().optional().describe("LLM model (default gpt-4o)"),
        description: z.string().optional(),
        semantic_data_model: z
          .boolean()
          .optional()
          .describe(
            "If true, creates a schema-aware Semantic Data Model KB meant to be connected to a " +
              "real database afterward via lyzr_semantic_model_connect_database, instead of a " +
              "basic vector-retrieval KB (default false).",
          ),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async (args, extra) => txt(await rag.createKb(args, extra.signal)),
  );

  server.registerTool(
    "lyzr_kb_get",
    {
      title: "Get Knowledge Base",
      description: "Fetch a knowledge base by id.",
      inputSchema: { kb_id: z.string().describe("Knowledge base id") },
      annotations: {
        readOnlyHint: true,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ kb_id }, extra) => txt(await rag.getKb(kb_id, extra.signal)),
  );

  server.registerTool(
    "lyzr_kb_list",
    {
      title: "List Knowledge Bases",
      description: "List knowledge bases for a user.",
      inputSchema: {
        user_id: z.string().describe("User id whose knowledge bases to list"),
      },
      annotations: {
        readOnlyHint: true,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ user_id }, extra) => txt(await rag.listKbs(user_id, extra.signal)),
  );

  server.registerTool(
    "lyzr_kb_train_text",
    {
      title: "Train KB from Text",
      description: "Ingest text chunks into a knowledge base.",
      inputSchema: {
        rag_id: z.string().describe("Knowledge base id"),
        texts: z.array(z.string()).min(1).describe("Text chunks to ingest"),
        source: z
          .string()
          .optional()
          .describe(
            "Label identifying where the text came from (backend requires this per-chunk; default 'manual')",
          ),
      },
      annotations: {
        readOnlyHint: false,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async ({ rag_id, texts, source }, extra) =>
      txt(await rag.trainText(rag_id, texts, extra.signal, source)),
  );

  server.registerTool(
    "lyzr_kb_train_website",
    {
      title: "Train KB from Website",
      description: "Crawl and ingest one or more URLs into a knowledge base.",
      inputSchema: {
        rag_id: z.string().describe("Knowledge base id"),
        urls: z.array(z.string()).min(1).describe("URLs to crawl and ingest"),
      },
      annotations: {
        readOnlyHint: false,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async ({ rag_id, urls }, extra) =>
      txt(await rag.trainWebsite(rag_id, urls, extra.signal)),
  );

  server.registerTool(
    "lyzr_kb_query",
    {
      title: "Query Knowledge Base",
      description: "Retrieve relevant chunks from a knowledge base.",
      inputSchema: {
        rag_id: z.string().describe("Knowledge base id"),
        query: z.string().describe("The search query"),
        top_k: z.number().int().min(1).optional().describe("Max results"),
      },
      annotations: {
        readOnlyHint: true,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ rag_id, query, top_k }, extra) =>
      txt(await rag.query(rag_id, query, top_k, extra.signal)),
  );

  server.registerTool(
    "lyzr_kb_list_documents",
    {
      title: "List KB Documents",
      description: "List the documents indexed in a knowledge base.",
      inputSchema: { rag_id: z.string().describe("Knowledge base id") },
      annotations: {
        readOnlyHint: true,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ rag_id }, extra) =>
      txt(await rag.listDocuments(rag_id, extra.signal)),
  );

  server.registerTool(
    "lyzr_kb_delete",
    {
      title: "Delete Knowledge Base",
      description: "Permanently delete a knowledge base by id.",
      inputSchema: { kb_id: z.string().describe("Knowledge base id") },
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ kb_id }, extra) => txt(await rag.deleteKb(kb_id, extra.signal)),
  );
};
