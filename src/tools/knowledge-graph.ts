import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { KnowledgeGraphClient } from "../lyzr/knowledge-graph.js";

const txt = (d: unknown) => ({
  content: [
    {
      type: "text" as const,
      text: typeof d === "string" ? d : JSON.stringify(d, null, 2),
    },
  ],
});

/** Register the Knowledge Graph (v4) tools. */
export const registerKnowledgeGraphTools = (
  server: McpServer,
  client: KnowledgeGraphClient,
) => {
  server.registerTool(
    "lyzr_kg_train_website",
    {
      title: "Train Knowledge Graph from Website",
      description:
        "Crawl and ingest one or more URLs into the v4 knowledge graph.",
      inputSchema: {
        rag_id: z.string().describe("Knowledge base id"),
        urls: z.array(z.string()).min(1).describe("URLs to crawl and ingest"),
        source: z
          .string()
          .optional()
          .describe("Source label (default website)"),
        max_crawl_pages: z
          .number()
          .int()
          .optional()
          .describe("Max pages to crawl"),
        max_crawl_depth: z
          .number()
          .int()
          .optional()
          .describe("Max crawl depth"),
        dynamic_content_wait_secs: z
          .number()
          .int()
          .optional()
          .describe("Seconds to wait for dynamic content"),
        actor: z.string().optional().describe("Crawler actor"),
        crawler_type: z.string().optional().describe("Crawler type"),
        chunk_size: z.number().int().optional().describe("Chunk size"),
        chunk_overlap: z.number().int().optional().describe("Chunk overlap"),
        extra_fields: z
          .record(z.string(), z.any())
          .optional()
          .describe("Additional body fields merged into the request"),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async ({ rag_id, ...body }, extra) =>
      txt(await client.trainWebsite(rag_id, body, extra.signal)),
  );

  server.registerTool(
    "lyzr_kg_train_text",
    {
      title: "Train Knowledge Graph from Text",
      description: "Ingest text into the v4 knowledge graph.",
      inputSchema: {
        text: z.string().describe("Text to ingest"),
        source: z.string().describe("Source label"),
        rag_id: z.string().describe("Knowledge base id"),
        schema_prompt: z
          .string()
          .optional()
          .describe("Prompt guiding graph schema extraction"),
        extra_info: z
          .record(z.string(), z.any())
          .optional()
          .describe("Extra metadata for the text"),
        extra_fields: z
          .record(z.string(), z.any())
          .optional()
          .describe("Additional body fields merged into the request"),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async (args, extra) => txt(await client.trainText(args, extra.signal)),
  );

  server.registerTool(
    "lyzr_kg_train_text_task",
    {
      title: "Train Knowledge Graph from Text (Async)",
      description:
        "Ingest text into the v4 knowledge graph as an async task; returns a task id to poll.",
      inputSchema: {
        text: z.string().describe("Text to ingest"),
        source: z.string().describe("Source label"),
        rag_id: z.string().describe("Knowledge base id"),
        schema_prompt: z
          .string()
          .optional()
          .describe("Prompt guiding graph schema extraction"),
        extra_info: z
          .record(z.string(), z.any())
          .optional()
          .describe("Extra metadata for the text"),
        extra_fields: z
          .record(z.string(), z.any())
          .optional()
          .describe("Additional body fields merged into the request"),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async (args, extra) => txt(await client.trainTextTask(args, extra.signal)),
  );

  server.registerTool(
    "lyzr_kg_get_graph",
    {
      title: "Get Knowledge Graph",
      description: "Fetch the knowledge graph for a knowledge base.",
      inputSchema: {
        rag_id: z.string().describe("Knowledge base id"),
        limit: z
          .number()
          .int()
          .min(1)
          .optional()
          .describe("Max nodes/edges to return (default 50)"),
      },
      annotations: {
        readOnlyHint: true,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ rag_id, limit }, extra) =>
      txt(await client.getGraph(rag_id, limit, extra.signal)),
  );

  server.registerTool(
    "lyzr_kg_deduplicate",
    {
      title: "Deduplicate Knowledge Graph",
      description: "Deduplicate entities in a knowledge base's graph.",
      inputSchema: { rag_id: z.string().describe("Knowledge base id") },
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async ({ rag_id }, extra) =>
      txt(await client.deduplicate(rag_id, extra.signal)),
  );

  server.registerTool(
    "lyzr_kg_task_status",
    {
      title: "Get Knowledge Graph Task Status",
      description: "Poll the status of an async knowledge graph task.",
      inputSchema: { task_id: z.string().describe("Async task id") },
      annotations: {
        readOnlyHint: true,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ task_id }, extra) =>
      txt(await client.taskStatus(task_id, extra.signal)),
  );
};
