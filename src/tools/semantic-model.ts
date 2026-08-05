import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { SemanticModelClient } from "../lyzr/semantic-model.js";

const txt = (data: unknown) => ({
  content: [
    {
      type: "text" as const,
      text: typeof data === "string" ? data : JSON.stringify(data, null, 2),
    },
  ],
});

const columnDescriptionSchema = z.object({
  name: z.string().describe("Column name"),
  description: z.string().describe("Column description"),
  type: z.string().describe("Column data type"),
});

const tableColumnDescriptionsSchema = z.object({
  table_name: z.string().describe("Table name"),
  table_description: z.string().describe("Table description"),
  columns: z
    .array(columnDescriptionSchema)
    .describe("Per-column descriptions"),
});

/** Registers all Semantic Model v3 tools. */
export const registerSemanticModelTools = (
  server: McpServer,
  client: SemanticModelClient,
) => {
  server.registerTool(
    "lyzr_semantic_model_list_documentation_agents",
    {
      title: "List Documentation Agents",
      description: "List semantic-model documentation agents.",
      inputSchema: {},
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async (_args, extra) =>
      txt(await client.listDocumentationAgents(extra.signal)),
  );

  server.registerTool(
    "lyzr_semantic_model_create_documentation_agent",
    {
      title: "Create Documentation Agent",
      description:
        "Create a new semantic-model documentation agent used to generate table/column descriptions.",
      inputSchema: {
        name: z.string().describe("Documentation agent name"),
        llm_credential_id: z
          .string()
          .nullable()
          .optional()
          .describe("LLM credential id to use, or null"),
        provider_id: z.string().describe("LLM provider id, e.g. OpenAI"),
        model_id: z.string().describe("Model id, e.g. gpt-4o-mini"),
        top_p: z.number().describe("Sampling top_p"),
        temperature: z.number().describe("Sampling temperature"),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async (args, extra) =>
      txt(await client.createDocumentationAgent(args, extra.signal)),
  );

  server.registerTool(
    "lyzr_semantic_model_connect_database",
    {
      title: "Connect Database To RAG Config",
      description:
        "Connect a database to a RAG config for semantic-model table documentation.",
      inputSchema: {
        rag_config_id: z.string().describe("RAG config id"),
        database_id: z.string().describe("Database id to connect"),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async (args, extra) =>
      txt(
        await client.connectDatabase(
          args.rag_config_id,
          args.database_id,
          extra.signal,
        ),
      ),
  );

  server.registerTool(
    "lyzr_semantic_model_list_tables",
    {
      title: "List Tables",
      description:
        "List table names available in a connected database for a RAG config.",
      inputSchema: {
        rag_config_id: z.string().describe("RAG config id"),
        database_id: z.string().describe("Database id"),
      },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async (args, extra) =>
      txt(
        await client.listTables(
          args.rag_config_id,
          args.database_id,
          extra.signal,
        ),
      ),
  );

  server.registerTool(
    "lyzr_semantic_model_table_preview",
    {
      title: "Preview Table",
      description: "Preview rows of a table in a connected database.",
      inputSchema: {
        rag_config_id: z.string().describe("RAG config id"),
        database_id: z.string().describe("Database id"),
        table_name: z.string().describe("Table name to preview"),
      },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async (args, extra) =>
      txt(
        await client.getTablePreview(
          args.rag_config_id,
          args.database_id,
          args.table_name,
          extra.signal,
        ),
      ),
  );

  server.registerTool(
    "lyzr_semantic_model_get_descriptions",
    {
      title: "Get Table Descriptions",
      description:
        "Get saved table and column descriptions for a table in a database.",
      inputSchema: {
        rag_config_id: z.string().describe("RAG config id"),
        database_id: z.string().describe("Database id"),
        table_name: z.string().describe("Table name"),
      },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async (args, extra) =>
      txt(
        await client.getDescriptions(
          args.rag_config_id,
          args.database_id,
          args.table_name,
          extra.signal,
        ),
      ),
  );

  server.registerTool(
    "lyzr_semantic_model_save_documentation",
    {
      title: "Save Table Documentation",
      description:
        "Save table/column descriptions and a table preview for a table (synchronous).",
      inputSchema: {
        rag_config_id: z.string().describe("RAG config id"),
        table_name: z.string().describe("Table name"),
        descriptions: tableColumnDescriptionsSchema.describe(
          "Table and column descriptions",
        ),
        table_preview: z
          .array(z.record(z.string(), z.unknown()))
          .describe("Sample rows of the table"),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async (args, extra) => {
      const result = await client.saveDocumentation(
        args.rag_config_id,
        args.table_name,
        { descriptions: args.descriptions, table_preview: args.table_preview },
        extra.signal,
      );
      return txt(`Saved documentation for table \`${args.table_name}\`.\n\n${JSON.stringify(result, null, 2)}`);
    },
  );

  server.registerTool(
    "lyzr_semantic_model_save_documentation_task",
    {
      title: "Save Table Documentation (Background Task)",
      description:
        "Save table/column descriptions and a table preview for a table as a background task. Returns a task_id to poll with lyzr_semantic_model_get_task_status.",
      inputSchema: {
        rag_config_id: z.string().describe("RAG config id"),
        table_name: z.string().describe("Table name"),
        descriptions: tableColumnDescriptionsSchema.describe(
          "Table and column descriptions",
        ),
        table_preview: z
          .array(z.record(z.string(), z.unknown()))
          .describe("Sample rows of the table"),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async (args, extra) =>
      txt(
        await client.saveDocumentationTask(
          args.rag_config_id,
          args.table_name,
          { descriptions: args.descriptions, table_preview: args.table_preview },
          extra.signal,
        ),
      ),
  );

  server.registerTool(
    "lyzr_semantic_model_remove_documentation",
    {
      title: "Remove Table Documentation",
      description: "Remove saved documentation for a table.",
      inputSchema: {
        rag_config_id: z.string().describe("RAG config id"),
        table_name: z.string().describe("Table name"),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async (args, extra) =>
      txt(
        await client.removeDocumentation(
          args.rag_config_id,
          args.table_name,
          extra.signal,
        ),
      ),
  );

  server.registerTool(
    "lyzr_semantic_model_remove_documentation_task",
    {
      title: "Remove Documentation Task",
      description: "Remove a background documentation-save task for a table.",
      inputSchema: {
        rag_config_id: z.string().describe("RAG config id"),
        table_name: z.string().describe("Table name"),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async (args, extra) =>
      txt(
        await client.removeDocumentationTask(
          args.rag_config_id,
          args.table_name,
          extra.signal,
        ),
      ),
  );

  server.registerTool(
    "lyzr_semantic_model_get_task_status",
    {
      title: "Get Semantic Model Task Status",
      description:
        "Get the status of a semantic-model background task (e.g. save_documentation_task).",
      inputSchema: {
        task_id: z.string().describe("Task id to poll"),
      },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async (args, extra) => txt(await client.getTaskStatus(args.task_id, extra.signal)),
  );
};
