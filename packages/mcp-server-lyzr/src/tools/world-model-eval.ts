import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { WorldModelEvalClient } from "../lyzr/world-model-eval.js";

const txt = (data: unknown) => ({
  content: [
    {
      type: "text" as const,
      text: typeof data === "string" ? data : JSON.stringify(data, null, 2),
    },
  ],
});

/** Register the World Model evaluation-run + dashboard tools. */
export const registerWorldModelEvalTools = (
  server: McpServer,
  client: WorldModelEvalClient,
) => {
  server.registerTool(
    "lyzr_world_model_create_evaluation_run",
    {
      title: "Create World Model Evaluation Run",
      description:
        "Create a new evaluation run for an agent against a World Model's test cases.",
      inputSchema: {
        world_model_id: z
          .string()
          .describe("The World Model id being evaluated against"),
        run_name: z
          .string()
          .describe("A human-readable name for this evaluation run"),
        agent_id: z.string().describe("The agent id being evaluated"),
        agent_name: z.string().describe("The agent's display name"),
        status: z
          .string()
          .describe(
            "Run status, e.g. 'pending', 'running', 'completed', 'failed'",
          ),
        selected_metrics: z
          .array(z.string())
          .describe("Metric names to evaluate for this run"),
        overall_progress: z
          .number()
          .int()
          .describe("Overall progress percentage"),
        is_running: z
          .boolean()
          .describe("Whether the run is currently in progress"),
        total_test_cases: z
          .number()
          .int()
          .describe("Total number of test cases in the run"),
        completed_test_cases: z
          .number()
          .int()
          .describe("Number of completed test cases"),
        failed_test_cases: z.number().int().describe("Number of failed test cases"),
        running_test_cases: z
          .number()
          .int()
          .describe("Number of currently running test cases"),
        pending_test_cases: z
          .number()
          .int()
          .describe("Number of pending test cases"),
        duration_ms: z.number().int().describe("Run duration in milliseconds"),
        test_cases: z
          .array(z.record(z.unknown()))
          .describe(
            "Per-test-case result records (required by the backend, even as an empty array for a freshly-created run)",
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
      txt(await client.createEvaluationRun(args, extra.signal)),
  );

  server.registerTool(
    "lyzr_world_model_list_evaluation_runs",
    {
      title: "List World Model Evaluation Runs",
      description: "List all evaluation runs created for a given World Model.",
      inputSchema: {
        world_model_id: z
          .string()
          .describe("The World Model id whose evaluation runs to list"),
      },
      annotations: {
        readOnlyHint: true,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ world_model_id }, extra) =>
      txt(await client.listEvaluationRuns(world_model_id, extra.signal)),
  );

  server.registerTool(
    "lyzr_world_model_get_evaluation_run",
    {
      title: "Get World Model Evaluation Run",
      description: "Fetch a single evaluation run by its id.",
      inputSchema: {
        run_id: z.string().describe("The evaluation run id"),
      },
      annotations: {
        readOnlyHint: true,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ run_id }, extra) =>
      txt(await client.getEvaluationRun(run_id, extra.signal)),
  );

  server.registerTool(
    "lyzr_world_model_dashboard_overview",
    {
      title: "Get World Model Dashboard Overview",
      description:
        "Fetch the overall World Model dashboard summary across all world models.",
      inputSchema: {},
      annotations: {
        readOnlyHint: true,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async (_args, extra) =>
      txt(await client.getDashboardOverview(extra.signal)),
  );

  server.registerTool(
    "lyzr_world_model_dashboard_by_world_model",
    {
      title: "Get World Model Dashboard",
      description: "Fetch the dashboard summary for a single World Model.",
      inputSchema: {
        world_model_id: z
          .string()
          .describe("The World Model id whose dashboard to fetch"),
      },
      annotations: {
        readOnlyHint: true,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ world_model_id }, extra) =>
      txt(await client.getWorldModelDashboard(world_model_id, extra.signal)),
  );
};
