import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { RagTrainFilesClient } from "../lyzr/rag-train-files.js";

const txt = (data: unknown) => ({
  content: [
    {
      type: "text" as const,
      text: typeof data === "string" ? data : JSON.stringify(data, null, 2),
    },
  ],
});

const commonFileFields = {
  rag_id: z.string().describe("The ID of the RAG system to train"),
  file_content_base64: z
    .string()
    .describe("Base64-encoded contents of the file to train"),
  filename: z.string().describe("Name of the file being uploaded"),
  mime_type: z.string().optional().describe("MIME type of the file (optional)"),
  chunk_size: z
    .number()
    .int()
    .optional()
    .describe("Chunk size for splitting the document (default 1000)"),
  chunk_overlap: z
    .number()
    .int()
    .optional()
    .describe("Chunk overlap for splitting the document (default 100)"),
  extra_info: z
    .string()
    .optional()
    .describe('Extra metadata JSON string (default "{}")'),
};

const parserConfigField = z
  .string()
  .optional()
  .describe("Optional JSON string with parser configuration");

const dataParserField = z
  .string()
  .optional()
  .describe("Optional parser strategy name to use for this file");

/** Register the RAG train-files (multipart upload) tools. */
export const registerRagTrainFilesTools = (
  server: McpServer,
  client: RagTrainFilesClient,
) => {
  server.registerTool(
    "lyzr_kb_train_pdf",
    {
      title: "Train KB from PDF",
      description: "Upload and train a PDF file into a knowledge base.",
      inputSchema: {
        ...commonFileFields,
        data_parser: dataParserField,
        parser_config: parserConfigField,
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
        rag_id,
        file_content_base64,
        filename,
        mime_type,
        chunk_size,
        chunk_overlap,
        extra_info,
        data_parser,
        parser_config,
      },
      extra,
    ) =>
      txt(
        await client.trainPdf(
          rag_id,
          {
            data: Buffer.from(file_content_base64, "base64"),
            filename,
            mimeType: mime_type,
            chunk_size,
            chunk_overlap,
            extra_info,
            data_parser,
            parser_config,
          },
          extra.signal,
        ),
      ),
  );

  server.registerTool(
    "lyzr_kb_train_docx",
    {
      title: "Train KB from DOCX",
      description: "Upload and train a DOCX file into a knowledge base.",
      inputSchema: {
        ...commonFileFields,
        data_parser: dataParserField,
        parser_config: parserConfigField,
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
        rag_id,
        file_content_base64,
        filename,
        mime_type,
        chunk_size,
        chunk_overlap,
        extra_info,
        data_parser,
        parser_config,
      },
      extra,
    ) =>
      txt(
        await client.trainDocx(
          rag_id,
          {
            data: Buffer.from(file_content_base64, "base64"),
            filename,
            mimeType: mime_type,
            chunk_size,
            chunk_overlap,
            extra_info,
            data_parser,
            parser_config,
          },
          extra.signal,
        ),
      ),
  );

  server.registerTool(
    "lyzr_kb_train_txt_file",
    {
      title: "Train KB from Text File",
      description:
        "Upload and train a plain-text (.txt) file into a knowledge base.",
      inputSchema: {
        ...commonFileFields,
        data_parser: dataParserField.describe(
          "Parser strategy name (default 'simple')",
        ),
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
        rag_id,
        file_content_base64,
        filename,
        mime_type,
        chunk_size,
        chunk_overlap,
        extra_info,
        data_parser,
      },
      extra,
    ) =>
      txt(
        await client.trainTxtFile(
          rag_id,
          {
            data: Buffer.from(file_content_base64, "base64"),
            filename,
            mimeType: mime_type,
            chunk_size,
            chunk_overlap,
            extra_info,
            data_parser,
          },
          extra.signal,
        ),
      ),
  );

  server.registerTool(
    "lyzr_kb_train_xlsx",
    {
      title: "Train KB from XLSX",
      description:
        "Upload and train an XLSX spreadsheet into a knowledge base.",
      inputSchema: {
        ...commonFileFields,
        parser_config: parserConfigField,
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
        rag_id,
        file_content_base64,
        filename,
        mime_type,
        chunk_size,
        chunk_overlap,
        extra_info,
        parser_config,
      },
      extra,
    ) =>
      txt(
        await client.trainXlsx(
          rag_id,
          {
            data: Buffer.from(file_content_base64, "base64"),
            filename,
            mimeType: mime_type,
            chunk_size,
            chunk_overlap,
            extra_info,
            parser_config,
          },
          extra.signal,
        ),
      ),
  );

  server.registerTool(
    "lyzr_kb_train_pptx",
    {
      title: "Train KB from PPTX",
      description:
        "Upload and train a PPTX presentation into a knowledge base.",
      inputSchema: {
        ...commonFileFields,
        parser_config: parserConfigField,
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
        rag_id,
        file_content_base64,
        filename,
        mime_type,
        chunk_size,
        chunk_overlap,
        extra_info,
        parser_config,
      },
      extra,
    ) =>
      txt(
        await client.trainPptx(
          rag_id,
          {
            data: Buffer.from(file_content_base64, "base64"),
            filename,
            mimeType: mime_type,
            chunk_size,
            chunk_overlap,
            extra_info,
            parser_config,
          },
          extra.signal,
        ),
      ),
  );

  server.registerTool(
    "lyzr_kb_train_image",
    {
      title: "Train KB from Image",
      description: "Upload and train an image file into a knowledge base.",
      inputSchema: {
        ...commonFileFields,
        parser_config: parserConfigField,
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
        rag_id,
        file_content_base64,
        filename,
        mime_type,
        chunk_size,
        chunk_overlap,
        extra_info,
        parser_config,
      },
      extra,
    ) =>
      txt(
        await client.trainImage(
          rag_id,
          {
            data: Buffer.from(file_content_base64, "base64"),
            filename,
            mimeType: mime_type,
            chunk_size,
            chunk_overlap,
            extra_info,
            parser_config,
          },
          extra.signal,
        ),
      ),
  );
};
