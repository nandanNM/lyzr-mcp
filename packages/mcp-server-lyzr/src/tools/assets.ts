import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { AssetsClient } from "../lyzr/assets.js";

const txt = (data: unknown) => ({
  content: [
    {
      type: "text" as const,
      text: typeof data === "string" ? data : JSON.stringify(data, null, 2),
    },
  ],
});

/** Register the Assets tools. */
export const registerAssetsTools = (
  server: McpServer,
  client: AssetsClient,
) => {
  server.registerTool(
    "lyzr_upload_asset",
    {
      title: "Upload Asset",
      description:
        "Upload one or more files as assets, optionally parsing/chunking them for RAG. Files are base64-encoded in the request.",
      inputSchema: {
        files: z
          .array(
            z.object({
              filename: z.string().describe("File name, e.g. report.pdf"),
              content_base64: z
                .string()
                .describe("Base64-encoded file contents"),
              mime_type: z
                .string()
                .optional()
                .describe("MIME type, e.g. application/pdf"),
            }),
          )
          .min(1)
          .describe("Files to upload"),
        parser_provider: z
          .string()
          .optional()
          .describe("Parser provider to use"),
        parsing_mode: z.string().optional().describe("Parsing mode"),
        enable_vlm: z
          .boolean()
          .optional()
          .describe("Enable vision-language-model parsing"),
        vlm_provider: z.string().optional().describe("VLM provider"),
        vlm_model: z.string().optional().describe("VLM model"),
        extract_tables: z
          .boolean()
          .optional()
          .describe("Extract tables from the document"),
        describe_images: z
          .boolean()
          .optional()
          .describe("Generate descriptions for images in the document"),
        chunking_strategy: z
          .string()
          .optional()
          .describe("Chunking strategy to apply"),
        start_page: z
          .number()
          .int()
          .optional()
          .describe("First page to parse (1-indexed)"),
        end_page: z
          .number()
          .int()
          .optional()
          .describe("Last page to parse (1-indexed)"),
        parse_config: z
          .string()
          .optional()
          .describe(
            'JSON string: {"provider":"standard|advanced","rag_id":"...","label_pages":false,"extract_text":true,"config":{}}',
          ),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async (args, extra) => {
      const files = args.files.map((f) => ({
        data: Buffer.from(f.content_base64, "base64"),
        filename: f.filename,
        mimeType: f.mime_type,
      }));
      const result = await client.uploadAssets(
        files,
        {
          parser_provider: args.parser_provider,
          parsing_mode: args.parsing_mode,
          enable_vlm: args.enable_vlm,
          vlm_provider: args.vlm_provider,
          vlm_model: args.vlm_model,
          extract_tables: args.extract_tables,
          describe_images: args.describe_images,
          chunking_strategy: args.chunking_strategy,
          start_page: args.start_page,
          end_page: args.end_page,
          parse_config: args.parse_config,
        },
        extra.signal,
      );
      return txt(
        `Uploaded ${result.successful_uploads}/${result.total_files} file(s).\n\n${JSON.stringify(result, null, 2)}`,
      );
    },
  );

  server.registerTool(
    "lyzr_get_asset",
    {
      title: "Get Asset",
      description:
        "Fetch an asset by id, including its extracted text content (if any) under the 'content' field.",
      inputSchema: { asset_id: z.string().describe("Asset id") },
      annotations: {
        readOnlyHint: true,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ asset_id }, extra) =>
      txt(await client.getAsset(asset_id, extra.signal)),
  );

  server.registerTool(
    "lyzr_delete_asset",
    {
      title: "Delete Asset",
      description: "Permanently delete an asset by id.",
      inputSchema: { asset_id: z.string().describe("Asset id") },
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ asset_id }, extra) =>
      txt(await client.deleteAsset(asset_id, extra.signal)),
  );

  server.registerTool(
    "lyzr_list_assets",
    {
      title: "List Assets",
      description: "List assets, paginated.",
      inputSchema: {
        page: z
          .number()
          .int()
          .min(1)
          .optional()
          .describe("Page number (default 1)"),
        limit: z
          .number()
          .int()
          .min(1)
          .max(100)
          .optional()
          .describe("Items per page (default 10, max 100)"),
      },
      annotations: {
        readOnlyHint: true,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ page, limit }, extra) =>
      txt(await client.listAssets({ page, limit }, extra.signal)),
  );

  server.registerTool(
    "lyzr_get_asset_parse_status",
    {
      title: "Get Asset Parse Status",
      description: "Get the parsing status of an asset by id.",
      inputSchema: { asset_id: z.string().describe("Asset id") },
      annotations: {
        readOnlyHint: true,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ asset_id }, extra) =>
      txt(await client.getAssetParseStatus(asset_id, extra.signal)),
  );

  server.registerTool(
    "lyzr_update_asset_parsing_status",
    {
      title: "Update Asset Parsing Status",
      description: "Update the parsing status/metadata of an asset by id.",
      inputSchema: {
        asset_id: z.string().describe("Asset id"),
        update: z
          .record(z.string(), z.unknown())
          .describe("Fields to update on the asset's parsing status"),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ asset_id, update }, extra) =>
      txt(await client.updateParsingStatus(asset_id, update, extra.signal)),
  );
};
