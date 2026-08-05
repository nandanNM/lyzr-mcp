import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { RagMiscExtraClient } from "../lyzr/rag-misc-extra.js";

const txt = (data: unknown) => ({
  content: [
    {
      type: "text" as const,
      text: typeof data === "string" ? data : JSON.stringify(data, null, 2),
    },
  ],
});

/** Register the RAG misc/extract/source-auth tools. */
export const registerRagMiscExtraTools = (
  server: McpServer,
  client: RagMiscExtraClient,
) => {
  server.registerTool(
    "lyzr_extract",
    {
      title: "Extract Structured Data",
      description:
        "Extract structured data from a file (base64), a file URL, or raw text, according to an extraction schema.",
      inputSchema: {
        file_content_base64: z
          .string()
          .optional()
          .describe(
            "Base64-encoded file content to extract from (omit if using full_text or file_url)",
          ),
        filename: z
          .string()
          .optional()
          .describe(
            "Filename for the uploaded file (used with file_content_base64)",
          ),
        mime_type: z
          .string()
          .optional()
          .describe("MIME type of the uploaded file"),
        full_text: z
          .string()
          .optional()
          .describe("Raw text to extract from, instead of uploading a file"),
        file_url: z
          .string()
          .optional()
          .describe(
            "URL of a file to extract from, instead of uploading bytes",
          ),
        extraction_schema: z
          .string()
          .describe(
            "Schema string describing what fields/structure to extract",
          ),
        target: z
          .string()
          .optional()
          .describe("Extraction target mode (default per_doc)"),
        tier: z
          .string()
          .optional()
          .describe("Extraction tier (default standard)"),
        annotate: z
          .boolean()
          .optional()
          .describe("Whether to annotate the source (default false)"),
        chunk_size: z
          .number()
          .int()
          .optional()
          .describe("Chunk size for extraction (default 1000)"),
        chunk_overlap: z
          .number()
          .int()
          .optional()
          .describe("Chunk overlap for extraction (default 100)"),
        parser_config: z
          .string()
          .optional()
          .describe("Parser configuration string"),
        extra_info: z
          .string()
          .optional()
          .describe("JSON string of extra metadata (default '{}')"),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async (
      {
        file_content_base64,
        filename,
        mime_type,
        full_text,
        file_url,
        extraction_schema,
        target,
        tier,
        annotate,
        chunk_size,
        chunk_overlap,
        parser_config,
        extra_info,
      },
      extra,
    ) =>
      txt(
        await client.extract(
          {
            data: file_content_base64
              ? Buffer.from(file_content_base64, "base64")
              : undefined,
            filename,
            mimeType: mime_type,
            fullText: full_text,
            fileUrl: file_url,
            extractionSchema: extraction_schema,
            target,
            tier,
            annotate,
            chunkSize: chunk_size,
            chunkOverlap: chunk_overlap,
            parserConfig: parser_config,
            extraInfo: extra_info,
          },
          extra.signal,
        ),
      ),
  );

  server.registerTool(
    "lyzr_rag_get_doc_content",
    {
      title: "Get RAG Document Content",
      description:
        "Get the full stored content (chunks) of a single document source in a knowledge base.",
      inputSchema: {
        rag_id: z.string().describe("Knowledge base id"),
        source: z.string().describe("Exact source key of the document"),
        limit: z
          .number()
          .int()
          .min(1)
          .max(1000)
          .optional()
          .describe("Maximum number of chunks to return (default 200)"),
      },
      annotations: {
        readOnlyHint: true,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ rag_id, source, limit }, extra) =>
      txt(await client.getDocContent(rag_id, source, limit, extra.signal)),
  );

  server.registerTool(
    "lyzr_rag_source_auth_status",
    {
      title: "RAG Source Auth Status",
      description:
        "Get the connection/auth status of external data sources configured for a knowledge base.",
      inputSchema: {
        rag_id: z.string().describe("Knowledge base id"),
      },
      annotations: {
        readOnlyHint: true,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ rag_id }, extra) =>
      txt(await client.getSourceAuthStatus(rag_id, extra.signal)),
  );

  server.registerTool(
    "lyzr_rag_source_auth_sharepoint_authorize",
    {
      title: "RAG SharePoint Authorize",
      description:
        "Start the SharePoint sign-in flow for a knowledge base's source auth, returning a URL to redirect the user to.",
      inputSchema: {
        rag_id: z.string().describe("Knowledge base id"),
        redirect_url: z
          .string()
          .describe("Frontend URL to return to after sign-in"),
      },
      annotations: {
        readOnlyHint: true,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async ({ rag_id, redirect_url }, extra) =>
      txt(await client.sharepointAuthorize(rag_id, redirect_url, extra.signal)),
  );

  server.registerTool(
    "lyzr_rag_source_auth_aci_handoff",
    {
      title: "RAG Source Auth ACI Handoff",
      description:
        "Complete the ACI source-auth hand-off callback using the returned state token.",
      inputSchema: {
        state: z.string().describe("Opaque state token from the auth redirect"),
      },
      annotations: {
        readOnlyHint: true,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async ({ state }, extra) =>
      txt(await client.aciHandoff(state, extra.signal)),
  );
};
