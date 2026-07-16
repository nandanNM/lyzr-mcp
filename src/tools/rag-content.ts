import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { RagContentClient } from "../lyzr/rag-content.js";

const txt = (d: unknown) => ({
  content: [
    {
      type: "text" as const,
      text: typeof d === "string" ? d : JSON.stringify(d, null, 2),
    },
  ],
});

const writeAnnotations = {
  readOnlyHint: false,
  destructiveHint: false,
  idempotentHint: false,
  openWorldHint: true,
} as const;

const extraFields = z
  .record(z.string(), z.any())
  .optional()
  .describe("Additional body fields merged into the request");

/** Register the RAG content (parse / classify) tools. */
export const registerRagContentTools = (
  server: McpServer,
  client: RagContentClient,
) => {
  server.registerTool(
    "lyzr_parse_website",
    {
      title: "Parse Website",
      description:
        "Parse a website URL into chunks (no knowledge base required).",
      inputSchema: {
        url: z.string().describe("Website URL to parse"),
        chunk_size: z
          .number()
          .int()
          .optional()
          .describe("Chunk size (default 1000)"),
        chunk_overlap: z
          .number()
          .int()
          .optional()
          .describe("Chunk overlap (default 100)"),
        parser_config: z
          .string()
          .optional()
          .describe("Parser config as a JSON string"),
        extra_info: z
          .string()
          .optional()
          .describe('Extra info as a JSON string (default "{}")'),
        extra_fields: extraFields,
      },
      annotations: writeAnnotations,
    },
    async (args, extra) => txt(await client.parseWebsite(args, extra.signal)),
  );

  server.registerTool(
    "lyzr_parse_website_apify",
    {
      title: "Parse Website (Apify)",
      description:
        "Parse a website URL into chunks using the Apify crawler backend.",
      inputSchema: {
        url: z.string().describe("Website URL to parse"),
        chunk_size: z
          .number()
          .int()
          .optional()
          .describe("Chunk size (default 1000)"),
        chunk_overlap: z
          .number()
          .int()
          .optional()
          .describe("Chunk overlap (default 100)"),
        parser_config: z
          .string()
          .optional()
          .describe("Parser config as a JSON string"),
        extra_info: z
          .string()
          .optional()
          .describe('Extra info as a JSON string (default "{}")'),
        extra_fields: extraFields,
      },
      annotations: writeAnnotations,
    },
    async (args, extra) =>
      txt(await client.parseWebsiteApify(args, extra.signal)),
  );

  server.registerTool(
    "lyzr_parse_text",
    {
      title: "Parse Text",
      description: "Parse raw text into chunks (no knowledge base required).",
      inputSchema: {
        text: z.string().describe("Raw text to parse into chunks"),
        chunk_size: z
          .number()
          .int()
          .optional()
          .describe("Chunk size (default 1000)"),
        chunk_overlap: z
          .number()
          .int()
          .optional()
          .describe("Chunk overlap (default 100)"),
        parser_config: z
          .string()
          .optional()
          .describe("Parser config as a JSON string"),
        extra_info: z
          .string()
          .optional()
          .describe('Extra info as a JSON string (default "{}")'),
        extra_fields: extraFields,
      },
      annotations: writeAnnotations,
    },
    async (args, extra) => txt(await client.parseText(args, extra.signal)),
  );

  server.registerTool(
    "lyzr_classify",
    {
      title: "Classify Text",
      description:
        "Classify text against a set of rules; returns the matching label(s).",
      inputSchema: {
        text: z.string().describe("Text to classify"),
        rules: z
          .array(
            z.object({
              type: z
                .string()
                .describe(
                  "The label/category name returned when this rule matches.",
                ),
              description: z
                .string()
                .describe(
                  "Natural-language description of when this rule applies.",
                ),
            }),
          )
          .describe("Classification rules to evaluate the text against"),
        extra_fields: extraFields,
      },
      annotations: writeAnnotations,
    },
    async (args, extra) => txt(await client.classify(args, extra.signal)),
  );
};
