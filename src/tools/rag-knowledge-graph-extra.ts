import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type {
  KnowledgeGraphExtraClient,
  Neo4jTrainFileInput,
} from "../lyzr/rag-knowledge-graph-extra.js";

const txt = (data: unknown) => ({
  content: [
    {
      type: "text" as const,
      text: typeof data === "string" ? data : JSON.stringify(data, null, 2),
    },
  ],
});

const fileInputSchema = {
  rag_id: z.string().describe("The ID of the RAG system to train"),
  file_content_base64: z
    .string()
    .describe("Base64-encoded content of the file to train on"),
  filename: z.string().describe("Filename to associate with the upload"),
  mime_type: z.string().optional().describe("MIME type of the file (optional)"),
  schema_prompt: z
    .string()
    .optional()
    .describe("Allowed nodes and relationships for the knowledge graph"),
  extra_info: z
    .string()
    .optional()
    .describe('Extra info as a JSON string (default "{}")'),
};

const toFileInput = (args: {
  file_content_base64: string;
  filename: string;
  mime_type?: string;
  schema_prompt?: string;
  extra_info?: string;
}): Neo4jTrainFileInput => ({
  data: Buffer.from(args.file_content_base64, "base64"),
  filename: args.filename,
  mimeType: args.mime_type,
  schema_prompt: args.schema_prompt,
  extra_info: args.extra_info,
});

/** Register the Knowledge Graph "extra" (base multipart + Neo4j) tools. */
export const registerKnowledgeGraphExtraTools = (
  server: McpServer,
  client: KnowledgeGraphExtraClient,
) => {
  server.registerTool(
    "lyzr_kg_ext_train_file",
    {
      title: "Train Knowledge Graph From File",
      description:
        "Upload a file (base64-encoded) to train the Neo4j knowledge graph.",
      inputSchema: fileInputSchema,
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async ({ rag_id, ...rest }, extra) =>
      txt(await client.trainNeo4jFile(rag_id, toFileInput(rest), extra.signal)),
  );

  server.registerTool(
    "lyzr_kg_ext_train_file_neo4j",
    {
      title: "Train Neo4j Knowledge Graph From File",
      description:
        "Upload a file (base64-encoded) to train the Neo4j knowledge graph (namespaced endpoint).",
      inputSchema: fileInputSchema,
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async ({ rag_id, ...rest }, extra) =>
      txt(
        await client.trainNeo4jFileNs(rag_id, toFileInput(rest), extra.signal),
      ),
  );

  server.registerTool(
    "lyzr_kg_ext_train_file_task",
    {
      title: "Train Knowledge Graph From File (Async Task)",
      description:
        "Upload a file (base64-encoded) to train the Neo4j knowledge graph as an async task.",
      inputSchema: fileInputSchema,
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async ({ rag_id, ...rest }, extra) =>
      txt(
        await client.trainNeo4jFileTask(
          rag_id,
          toFileInput(rest),
          extra.signal,
        ),
      ),
  );

  server.registerTool(
    "lyzr_kg_ext_train_file_task_neo4j",
    {
      title: "Train Neo4j Knowledge Graph From File (Async Task)",
      description:
        "Upload a file (base64-encoded) to train the Neo4j knowledge graph as an async task (namespaced endpoint).",
      inputSchema: fileInputSchema,
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async ({ rag_id, ...rest }, extra) =>
      txt(
        await client.trainNeo4jFileTaskNs(
          rag_id,
          toFileInput(rest),
          extra.signal,
        ),
      ),
  );

  server.registerTool(
    "lyzr_kg_ext_train_website_neo4j",
    {
      title: "Train Neo4j Knowledge Graph From Website",
      description:
        "Crawl and ingest websites into the Neo4j knowledge graph (namespaced endpoint).",
      inputSchema: {
        rag_id: z.string().describe("The ID of the RAG system to train"),
        urls: z.array(z.string()).describe("URLs to crawl and ingest"),
        source: z
          .string()
          .optional()
          .describe(
            'Source label for the ingested content (default "website")',
          ),
        max_crawl_pages: z
          .number()
          .optional()
          .describe("Maximum number of pages to crawl (default 1)"),
        max_crawl_depth: z
          .number()
          .optional()
          .describe("Maximum crawl depth (default 0)"),
        dynamic_content_wait_secs: z
          .number()
          .optional()
          .describe("Seconds to wait for dynamic content (default 5)"),
        actor: z
          .string()
          .optional()
          .describe(
            'Apify actor to use (default "apify/website-content-crawler")',
          ),
        crawler_type: z
          .string()
          .optional()
          .describe('Crawler type (default "cheerio")'),
        chunk_size: z
          .number()
          .optional()
          .describe("Chunk size for splitting content (default 1000)"),
        chunk_overlap: z
          .number()
          .optional()
          .describe("Chunk overlap for splitting content (default 100)"),
        extra_fields: z
          .record(z.unknown())
          .optional()
          .describe("Any additional fields merged into the request body"),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async ({ rag_id, ...rest }, extra) =>
      txt(await client.trainNeo4jWebsite(rag_id, rest, extra.signal)),
  );

  server.registerTool(
    "lyzr_kg_ext_train_text_neo4j",
    {
      title: "Train Neo4j Knowledge Graph From Text",
      description:
        "Ingest text into the Neo4j knowledge graph (namespaced endpoint).",
      inputSchema: {
        text: z.string().describe("Text content to ingest"),
        source: z.string().describe("Source label for the ingested text"),
        rag_id: z.string().describe("The ID of the RAG system to train"),
        schema_prompt: z
          .string()
          .optional()
          .describe("Allowed nodes and relationships for the knowledge graph"),
        extra_info: z
          .record(z.unknown())
          .optional()
          .describe("Extra metadata to attach to the ingested text"),
        extra_fields: z
          .record(z.unknown())
          .optional()
          .describe("Any additional fields merged into the request body"),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async (args, extra) => txt(await client.trainNeo4jText(args, extra.signal)),
  );

  server.registerTool(
    "lyzr_kg_ext_train_text_task_neo4j",
    {
      title: "Train Neo4j Knowledge Graph From Text (Async Task)",
      description:
        "Ingest text into the Neo4j knowledge graph as an async task (namespaced endpoint).",
      inputSchema: {
        text: z.string().describe("Text content to ingest"),
        source: z.string().describe("Source label for the ingested text"),
        rag_id: z.string().describe("The ID of the RAG system to train"),
        schema_prompt: z
          .string()
          .optional()
          .describe("Allowed nodes and relationships for the knowledge graph"),
        extra_info: z
          .record(z.unknown())
          .optional()
          .describe("Extra metadata to attach to the ingested text"),
        extra_fields: z
          .record(z.unknown())
          .optional()
          .describe("Any additional fields merged into the request body"),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async (args, extra) =>
      txt(await client.trainNeo4jTextTask(args, extra.signal)),
  );

  server.registerTool(
    "lyzr_kg_ext_get_graph_neo4j",
    {
      title: "Get Neo4j Knowledge Graph",
      description:
        "Fetch the Neo4j knowledge graph nodes for a RAG system (namespaced endpoint).",
      inputSchema: {
        rag_id: z.string().describe("The ID of the RAG system"),
        limit: z
          .number()
          .optional()
          .describe("Maximum number of nodes to return (default 50)"),
      },
      annotations: {
        readOnlyHint: true,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ rag_id, limit }, extra) =>
      txt(await client.getNeo4jGraph(rag_id, limit, extra.signal)),
  );

  server.registerTool(
    "lyzr_kg_ext_deduplicate_neo4j",
    {
      title: "Deduplicate Neo4j Knowledge Graph Entities",
      description:
        "Deduplicate entities in the Neo4j knowledge graph for a RAG system (namespaced endpoint).",
      inputSchema: {
        rag_id: z.string().describe("The ID of the RAG system"),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ rag_id }, extra) =>
      txt(await client.deduplicateNeo4j(rag_id, extra.signal)),
  );
};
