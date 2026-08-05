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
        "Create a credential for a Lyzr provider (e.g. a vector store or database connector). Returns the new credential_id.\n\n" +
        "The `credentials` object's required fields depend on the connector (`provider_id`/`type`). Reference table:\n\n" +
        "Vector stores (type: \"vector_store\"):\n" +
        "- Qdrant — provider_id: qdrant — credentials: { url (required), api_key }\n" +
        "- Amazon Neptune — provider_id: neptune — credentials: { graph_id, region, aws_role_arn, aws_session_name } (all required)\n" +
        "- Weaviate — provider_id: weaviate — credentials: { vectorStoreURL, vectorAPIKey } (both required)\n" +
        "- PG-Vector — provider_id: pg_vector — credentials: { user, host, password, port, dbname } (all required)\n" +
        "- Milvus — provider_id: milvus — credentials: { uri (required), token }\n" +
        "- Singlestore — provider_id: singlestore — credentials: { user, host, password, port, database } (all required)\n" +
        "- Neo4J — provider_id: neo4j — credentials: { neo4j_uri, neo4j_user, neo4j_password (all required), neo4j_database }\n" +
        "- Yugabyte — provider_id: yugabyte — credentials: { user, host, password, port, dbname (all required), ssl_cert, ssl_key, ssl_mode, ssl_root_cert }\n" +
        "- ArangoDB — provider_id: arangodb — credentials: { arangodb_uri, arangodb_user, arangodb_password (all required), arangodb_db_name }\n" +
        "- Azure AI Search — provider_id: azure_ai_search — credentials: { endpoint, api_key } (both required)\n" +
        "- Vertex AI RAG Engine — provider_id: vertex_ai_rag — credentials: { project_id, client_email, private_key (all required), private_key_id, client_id, region, embedding_model }\n" +
        "- Vertex AI Search — provider_id: vertex_ai_search — credentials: { project_id, client_email, private_key, data_store_id (all required), private_key_id, client_id, location, serving_config_id, branch }\n\n" +
        "Databases (type: \"database\"):\n" +
        "- MongoDB — provider_id: mongodb — credentials: { host (required), port, user, password, database, connection_kwargs }\n" +
        "- MySQL — provider_id: mysql — credentials: { host, port, user, password, database } (all required)\n" +
        "- Microsoft SQL Server — provider_id: mssql — credentials: { server, database, user, password (all required), port, server_certificate, connection_kwargs }\n" +
        "- Redshift — provider_id: redshift — credentials: { host, port, user, password, database } (all required)\n" +
        "- PostgreSQL — provider_id: postgres — credentials: { host, port, user, password, database } (all required)\n" +
        "- Azure SQL — provider_id: azuresql — credentials: { server, database, user, password (all required), port }\n" +
        "- BigQuery — provider_id: bigquery — credentials: { project_id, dataset_id, sa_dict (service-account JSON, all required) }\n" +
        "- Databricks — provider_id: databricks — credentials: { host, http_path, token (all required), catalog, schema }\n" +
        "- Oracle — provider_id: oracle — credentials: { host, username, password (all required), port, service_name, sid, wallet_path, wallet_password, protocol }\n" +
        "- Amazon DynamoDB — provider_id: dynamodb — credentials: { region, aws_access_key_id, aws_secret_access_key (all required), aws_session_token, endpoint_url }\n" +
        "- File Upload — provider_id: file_upload — credentials: { files (required) }\n\n" +
        "This list may not be exhaustive or fully current — use lyzr_get_providers_by_type (provider_type: \"vector_store\" or \"database\") to fetch the live, authoritative field schema for any connector before prompting the user.\n\n" +
        "If the user already created this credential in Studio's Data Connectors page, don't recreate it — look it up instead with lyzr_list_provider_credentials_by_type or lyzr_list_provider_credentials_by_user and use its existing credential_id.",
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
        "List a user's credentials for a given provider type and provider id. Each result includes its `name`, so if a caller wants to find a credential by name (e.g. one already created in Studio's Data Connectors UI), fetch this list and filter client-side rather than recreating the credential.",
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
      description:
        "List all credentials for a given provider type. Each result includes its `name`, so if a caller wants to find a credential by name (e.g. one already created in Studio's Data Connectors UI), fetch this list and filter client-side rather than recreating the credential.",
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
