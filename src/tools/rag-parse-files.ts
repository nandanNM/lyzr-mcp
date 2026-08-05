import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { RagParseFilesClient } from "../lyzr/rag-parse-files.js";

const txt = (data: unknown) => ({
  content: [
    {
      type: "text" as const,
      text: typeof data === "string" ? data : JSON.stringify(data, null, 2),
    },
  ],
});

const docFields = {
  data_parser: z
    .string()
    .optional()
    .describe("Parser strategy to use, e.g. 'simple'"),
  chunk_size: z
    .number()
    .int()
    .optional()
    .describe("Max characters per chunk (default 1000)"),
  chunk_overlap: z
    .number()
    .int()
    .optional()
    .describe("Character overlap between chunks (default 100)"),
  parser_config: z
    .string()
    .optional()
    .describe("JSON string of extra parser configuration"),
  s3_key: z.string().optional().describe("S3 object key, if sourced from S3"),
  s3_bucket: z
    .string()
    .optional()
    .describe("S3 bucket name, if sourced from S3"),
  extra_info: z
    .string()
    .optional()
    .describe("JSON string of extra metadata (default '{}')"),
};

const chunkFields = {
  chunk_size: z
    .number()
    .int()
    .optional()
    .describe("Max characters per chunk (default 1000)"),
  chunk_overlap: z
    .number()
    .int()
    .optional()
    .describe("Character overlap between chunks (default 100)"),
  parser_config: z
    .string()
    .optional()
    .describe("JSON string of extra parser configuration"),
  extra_info: z
    .string()
    .optional()
    .describe("JSON string of extra metadata (default '{}')"),
};

const fileInputSchema = {
  file_content_base64: z
    .string()
    .describe("Base64-encoded file content to parse"),
  filename: z.string().describe("Original filename, including extension"),
  mime_type: z
    .string()
    .optional()
    .describe("MIME type of the file, e.g. 'application/pdf'"),
};

/** Register the Lyzr Parse (file endpoints) tools. */
export const registerRagParseFilesTools = (
  server: McpServer,
  client: RagParseFilesClient,
) => {
  server.registerTool(
    "lyzr_parse_pdf",
    {
      title: "Parse PDF File",
      description: "Parse a PDF file into text chunks.",
      inputSchema: { ...fileInputSchema, ...docFields },
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
        data_parser,
        chunk_size,
        chunk_overlap,
        parser_config,
        s3_key,
        s3_bucket,
        extra_info,
      },
      extra,
    ) =>
      txt(
        await client.parsePdf(
          {
            data: Buffer.from(file_content_base64, "base64"),
            filename,
            mimeType: mime_type,
          },
          {
            data_parser,
            chunk_size,
            chunk_overlap,
            parser_config,
            s3_key,
            s3_bucket,
            extra_info,
          },
          extra.signal,
        ),
      ),
  );

  server.registerTool(
    "lyzr_parse_docx",
    {
      title: "Parse DOCX File",
      description: "Parse a DOCX (Word) file into text chunks.",
      inputSchema: { ...fileInputSchema, ...docFields },
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
        data_parser,
        chunk_size,
        chunk_overlap,
        parser_config,
        s3_key,
        s3_bucket,
        extra_info,
      },
      extra,
    ) =>
      txt(
        await client.parseDocx(
          {
            data: Buffer.from(file_content_base64, "base64"),
            filename,
            mimeType: mime_type,
          },
          {
            data_parser,
            chunk_size,
            chunk_overlap,
            parser_config,
            s3_key,
            s3_bucket,
            extra_info,
          },
          extra.signal,
        ),
      ),
  );

  server.registerTool(
    "lyzr_parse_txt",
    {
      title: "Parse TXT File",
      description: "Parse a plain-text file into text chunks.",
      inputSchema: { ...fileInputSchema, ...docFields },
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
        data_parser,
        chunk_size,
        chunk_overlap,
        parser_config,
        s3_key,
        s3_bucket,
        extra_info,
      },
      extra,
    ) =>
      txt(
        await client.parseTxt(
          {
            data: Buffer.from(file_content_base64, "base64"),
            filename,
            mimeType: mime_type,
          },
          {
            data_parser,
            chunk_size,
            chunk_overlap,
            parser_config,
            s3_key,
            s3_bucket,
            extra_info,
          },
          extra.signal,
        ),
      ),
  );

  server.registerTool(
    "lyzr_parse_csv",
    {
      title: "Parse CSV File",
      description: "Parse a CSV file into text chunks.",
      inputSchema: {
        ...fileInputSchema,
        source_column: z
          .string()
          .describe("Name of the column to use as the source text"),
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
      { file_content_base64, filename, mime_type, source_column, extra_info },
      extra,
    ) =>
      txt(
        await client.parseCsv(
          {
            data: Buffer.from(file_content_base64, "base64"),
            filename,
            mimeType: mime_type,
          },
          { source_column, extra_info },
          extra.signal,
        ),
      ),
  );

  server.registerTool(
    "lyzr_parse_xlsx",
    {
      title: "Parse XLSX File",
      description: "Parse an XLSX (Excel) file into text chunks.",
      inputSchema: { ...fileInputSchema, ...chunkFields },
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
        chunk_size,
        chunk_overlap,
        parser_config,
        extra_info,
      },
      extra,
    ) =>
      txt(
        await client.parseXlsx(
          {
            data: Buffer.from(file_content_base64, "base64"),
            filename,
            mimeType: mime_type,
          },
          { chunk_size, chunk_overlap, parser_config, extra_info },
          extra.signal,
        ),
      ),
  );

  server.registerTool(
    "lyzr_parse_pptx",
    {
      title: "Parse PPTX File",
      description: "Parse a PPTX (PowerPoint) file into text chunks.",
      inputSchema: { ...fileInputSchema, ...chunkFields },
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
        chunk_size,
        chunk_overlap,
        parser_config,
        extra_info,
      },
      extra,
    ) =>
      txt(
        await client.parsePptx(
          {
            data: Buffer.from(file_content_base64, "base64"),
            filename,
            mimeType: mime_type,
          },
          { chunk_size, chunk_overlap, parser_config, extra_info },
          extra.signal,
        ),
      ),
  );

  server.registerTool(
    "lyzr_parse_image",
    {
      title: "Parse Image File",
      description: "Parse an image file (e.g. via OCR/VLM) into text chunks.",
      inputSchema: { ...fileInputSchema, ...chunkFields },
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
        chunk_size,
        chunk_overlap,
        parser_config,
        extra_info,
      },
      extra,
    ) =>
      txt(
        await client.parseImage(
          {
            data: Buffer.from(file_content_base64, "base64"),
            filename,
            mimeType: mime_type,
          },
          { chunk_size, chunk_overlap, parser_config, extra_info },
          extra.signal,
        ),
      ),
  );
};
