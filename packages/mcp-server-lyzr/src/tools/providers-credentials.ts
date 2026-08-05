import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { ProviderCredentialsClient } from "../lyzr/providers-credentials.js";

const txt = (data: unknown) => ({
  content: [
    {
      type: "text" as const,
      text: typeof data === "string" ? data : JSON.stringify(data, null, 2),
    },
  ],
});

const credentialFileSchema = z.object({
  content: z.string().describe("Base64-encoded file content"),
  filename: z.string().describe("File name to send with the upload"),
  contentType: z
    .string()
    .optional()
    .describe("MIME type of the file (default application/octet-stream)"),
});

/** Register the Provider Credentials tools. */
export const registerProviderCredentialsTools = (
  server: McpServer,
  client: ProviderCredentialsClient,
) => {
  server.registerTool(
    "lyzr_create_provider_credential",
    {
      title: "Create Provider Credential",
      description:
        "Create a credential for a Lyzr provider (e.g. a database or SaaS integration). Returns the new credential_id.",
      inputSchema: {
        name: z.string().describe("Credential name"),
        provider_id: z
          .string()
          .describe("The provider id this credential is for"),
        type: z.string().describe("Credential type"),
        credentials: z
          .record(z.string(), z.unknown())
          .describe("The credential key/value payload (e.g. API keys, tokens)"),
        meta_data: z
          .record(z.string(), z.unknown())
          .describe("Arbitrary metadata to store alongside the credential"),
        scope: z
          .string()
          .nullable()
          .optional()
          .describe("Optional scope for the credential"),
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
    "lyzr_create_bigquery_credential",
    {
      title: "Create BigQuery Provider Credential",
      description:
        "Create a BigQuery provider credential by uploading a service account JSON file.",
      inputSchema: {
        credential_data: z
          .string()
          .describe(
            "JSON-encoded string with credential metadata (name, provider_id, etc.)",
          ),
        service_account_json: credentialFileSchema.describe(
          "The GCP service account JSON key file",
        ),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async (args, extra) =>
      txt(await client.createBigQueryCredential(args, extra.signal)),
  );

  server.registerTool(
    "lyzr_create_file_upload_credential",
    {
      title: "Create File-Upload Provider Credential",
      description:
        "Create a provider credential by uploading one or more files (e.g. certificates, keys).",
      inputSchema: {
        credential_data: z
          .string()
          .describe(
            "JSON-encoded string with credential metadata (name, provider_id, etc.)",
          ),
        files: z
          .array(credentialFileSchema)
          .min(1)
          .describe("Files to upload with the credential"),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async (args, extra) =>
      txt(await client.createFileUploadCredential(args, extra.signal)),
  );

  server.registerTool(
    "lyzr_get_provider_credential",
    {
      title: "Get Provider Credential",
      description: "Fetch a provider credential by id.",
      inputSchema: {
        credential_id: z.string().describe("The credential id to fetch"),
      },
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
    "lyzr_update_provider_credential",
    {
      title: "Update Provider Credential",
      description: "Update an existing provider credential by id.",
      inputSchema: {
        credential_id: z.string().describe("The credential id to update"),
        name: z.string().describe("Credential name"),
        type: z.string().describe("Credential type"),
        credentials: z
          .record(z.string(), z.unknown())
          .describe("The credential key/value payload (e.g. API keys, tokens)"),
        user_id: z.string().describe("The owning user id"),
        meta_data: z
          .record(z.string(), z.unknown())
          .describe("Arbitrary metadata to store alongside the credential"),
        scope: z
          .string()
          .nullable()
          .optional()
          .describe("Optional scope for the credential"),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ credential_id, ...updates }, extra) =>
      txt(await client.updateCredential(credential_id, updates, extra.signal)),
  );

  server.registerTool(
    "lyzr_delete_provider_credential",
    {
      title: "Delete Provider Credential",
      description: "Permanently delete a provider credential by id.",
      inputSchema: {
        credential_id: z.string().describe("The credential id to delete"),
      },
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

  server.registerTool(
    "lyzr_update_file_upload_credential",
    {
      title: "Update File-Upload Provider Credential",
      description:
        "Update a file-upload provider credential, optionally replacing its files.",
      inputSchema: {
        credential_id: z.string().describe("The credential id to update"),
        update_data: z
          .string()
          .describe("JSON-encoded string with the fields to update"),
        files: z
          .array(credentialFileSchema)
          .optional()
          .describe("Replacement files to upload, if any"),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ credential_id, ...updates }, extra) =>
      txt(
        await client.updateFileUploadCredential(
          credential_id,
          updates,
          extra.signal,
        ),
      ),
  );

  server.registerTool(
    "lyzr_list_provider_credentials_by_user",
    {
      title: "List Provider Credentials By User And Type",
      description:
        "List a user's credentials for a given provider type and provider id.",
      inputSchema: {
        provider_type: z.string().describe("The provider type to filter by"),
        provider_id: z.string().describe("The provider id to filter by"),
      },
      annotations: {
        readOnlyHint: true,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ provider_type, provider_id }, extra) =>
      txt(
        await client.listCredentialsByUserAndType(
          provider_type,
          provider_id,
          extra.signal,
        ),
      ),
  );

  server.registerTool(
    "lyzr_list_provider_credentials_by_type",
    {
      title: "List Provider Credentials By Type",
      description: "List all credentials for a given provider type.",
      inputSchema: {
        provider_type: z.string().describe("The provider type to filter by"),
      },
      annotations: {
        readOnlyHint: true,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ provider_type }, extra) =>
      txt(await client.listCredentialsByType(provider_type, extra.signal)),
  );
};
