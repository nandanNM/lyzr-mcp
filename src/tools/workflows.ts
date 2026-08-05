import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { WorkflowsClient } from "../lyzr/workflows.js";

const txt = (data: unknown) => ({
  content: [
    {
      type: "text" as const,
      text: typeof data === "string" ? data : JSON.stringify(data, null, 2),
    },
  ],
});

/** Register the Workflows tools. */
export const registerWorkflowsTools = (
  server: McpServer,
  client: WorkflowsClient,
) => {
  server.registerTool(
    "lyzr_list_workflows",
    {
      title: "List Workflows",
      description: "List all workflows.",
      inputSchema: {},
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async (_args, extra) => txt(await client.listWorkflows(extra.signal)),
  );

  server.registerTool(
    "lyzr_create_workflow",
    {
      title: "Create Workflow",
      description: "Create a new workflow.",
      inputSchema: {
        flow_name: z.string().describe("Name of the workflow"),
        flow_data: z
          .record(z.unknown())
          .optional()
          .describe("The workflow's flow graph/definition data"),
        api_key: z
          .string()
          .nullable()
          .optional()
          .describe("Optional API key associated with the workflow"),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async (args, extra) => {
      const result = await client.createWorkflow(args, extra.signal);
      return txt(result);
    },
  );

  server.registerTool(
    "lyzr_get_workflow",
    {
      title: "Get Workflow",
      description: "Fetch a workflow by id.",
      inputSchema: {
        flow_id: z.string().describe("The workflow id"),
      },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ flow_id }, extra) =>
      txt(await client.getWorkflow(flow_id, extra.signal)),
  );

  server.registerTool(
    "lyzr_update_workflow",
    {
      title: "Update Workflow",
      description: "Update fields on an existing workflow.",
      inputSchema: {
        flow_id: z.string().describe("The workflow id to update"),
        flow_name: z.string().optional().describe("New workflow name"),
        flow_data: z
          .record(z.unknown())
          .optional()
          .describe("New workflow flow graph/definition data"),
        api_key: z
          .string()
          .nullable()
          .optional()
          .describe("New API key associated with the workflow"),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ flow_id, ...updates }, extra) => {
      const result = await client.updateWorkflow(
        flow_id,
        updates,
        extra.signal,
      );
      return {
        content: [
          {
            type: "text" as const,
            text: `Updated workflow \`${flow_id}\`.\n\n${JSON.stringify(result, null, 2)}`,
          },
        ],
      };
    },
  );

  server.registerTool(
    "lyzr_delete_workflow",
    {
      title: "Delete Workflow",
      description: "Permanently delete a workflow by id.",
      inputSchema: {
        flow_id: z.string().describe("The workflow id to delete"),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ flow_id }, extra) =>
      txt(await client.deleteWorkflow(flow_id, extra.signal)),
  );

  server.registerTool(
    "lyzr_bulk_delete_workflows",
    {
      title: "Bulk Delete Workflows",
      description: "Permanently delete multiple workflows by id.",
      inputSchema: {
        flow_ids: z.array(z.string()).min(1).describe("Workflow ids to delete"),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async ({ flow_ids }, extra) =>
      txt(await client.bulkDeleteWorkflows({ flow_ids }, extra.signal)),
  );

  server.registerTool(
    "lyzr_execute_workflow",
    {
      title: "Execute Workflow",
      description: "Execute a workflow, optionally passing input data.",
      inputSchema: {
        flow_id: z.string().describe("The workflow id to execute"),
        input_data: z
          .record(z.unknown())
          .optional()
          .describe("Input data payload for the workflow run"),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async ({ flow_id, input_data }, extra) =>
      txt(
        await client.executeWorkflow(flow_id, input_data ?? {}, extra.signal),
      ),
  );

  server.registerTool(
    "lyzr_share_workflow",
    {
      title: "Share Workflow",
      description: "Share a workflow with one or more email addresses.",
      inputSchema: {
        workflow_id: z.string().describe("The workflow id to share"),
        email_ids: z
          .array(z.string())
          .min(1)
          .describe("Email addresses to share the workflow with"),
        org_id: z.string().describe("Organization id"),
        user_token: z.string().describe("User auth token"),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async (args, extra) => txt(await client.shareWorkflow(args, extra.signal)),
  );

  server.registerTool(
    "lyzr_trigger_workflow_with_file",
    {
      title: "Trigger Workflow With File",
      description:
        "Trigger a workflow run by uploading a file (multipart/form-data).",
      inputSchema: {
        flow_id: z.string().describe("The workflow id to trigger"),
        file_content: z
          .string()
          .describe(
            "File contents as a UTF-8 string, or base64 when is_base64 is true",
          ),
        file_name: z.string().describe("The file's name, e.g. data.csv"),
        is_base64: z
          .boolean()
          .optional()
          .describe("Set true if file_content is base64-encoded"),
        additional_fields: z
          .string()
          .optional()
          .describe(
            'JSON string of additional form fields to send (default "{}")',
          ),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async ({ flow_id, ...input }, extra) =>
      txt(await client.triggerWorkflowWithFile(flow_id, input, extra.signal)),
  );
};
