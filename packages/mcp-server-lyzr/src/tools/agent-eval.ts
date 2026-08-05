import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { AgentEvalClient } from "../lyzr/agent-eval.js";

const txt = (data: unknown) => ({
  content: [
    {
      type: "text" as const,
      text: typeof data === "string" ? data : JSON.stringify(data, null, 2),
    },
  ],
});

const agentEvalItemSchema = z.object({
  id: z.string().describe("Unique id for this eval case"),
  purpose: z.string().describe("Purpose of this eval case"),
  user_input: z.string().describe("The user input to test the agent with"),
  expected_output: z.string().describe("The expected output for this input"),
  evaluation_notes: z
    .string()
    .describe("Notes describing how to evaluate the output"),
});

const agentEvalResultItemSchema = z.object({
  id: z.string().describe("Unique id for this eval result"),
  status: z.string().describe("Status of the eval result, e.g. pass/fail"),
  details: z.string().describe("Details about the eval result"),
  user_input: z.string().describe("The user input that was tested"),
  expected_output: z.string().describe("The expected output"),
  actual_output: z.string().describe("The actual output produced"),
  scorecard: z
    .record(z.unknown())
    .nullable()
    .optional()
    .describe("Optional scorecard details for this result"),
});

/** Register the Agent Eval tools. */
export const registerAgentEvalTools = (
  server: McpServer,
  agentEval: AgentEvalClient,
) => {
  server.registerTool(
    "lyzr_create_agent_eval",
    {
      title: "Create Agent Eval",
      description:
        "Create an agent evaluation config with a set of eval cases for an agent.",
      inputSchema: {
        eval_name: z.string().describe("Name for this eval config"),
        agent_id: z.string().describe("Agent id being evaluated"),
        session_id: z
          .string()
          .describe("Session id to associate with the eval"),
        agent_eval_list: z
          .array(agentEvalItemSchema)
          .describe("List of eval cases to run against the agent"),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async (args, extra) =>
      txt(await agentEval.createAgentEval(args, extra.signal)),
  );

  server.registerTool(
    "lyzr_get_agent_eval",
    {
      title: "Get Agent Eval",
      description: "Get agent evaluation configs for a given agent.",
      inputSchema: {
        agent_id: z.string().describe("Agent id whose evals to fetch"),
      },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ agent_id }, extra) =>
      txt(await agentEval.getAgentEval(agent_id, extra.signal)),
  );

  server.registerTool(
    "lyzr_create_agent_eval_result",
    {
      title: "Create Agent Eval Result",
      description:
        "Submit the results of running an agent evaluation (pass/fail outcomes per eval case).",
      inputSchema: {
        agent_eval_id: z
          .string()
          .describe("Id of the agent eval config these results belong to"),
        agent_id: z.string().describe("Agent id being evaluated"),
        agent_eval_result_list: z
          .array(agentEvalResultItemSchema)
          .describe("List of eval results to record"),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async (args, extra) =>
      txt(await agentEval.createAgentEvalResult(args, extra.signal)),
  );

  server.registerTool(
    "lyzr_get_agent_eval_result",
    {
      title: "Get Agent Eval Result",
      description: "Get agent evaluation results by agent eval id.",
      inputSchema: {
        agent_eval_id: z
          .string()
          .describe("Agent eval config id whose results to fetch"),
      },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ agent_eval_id }, extra) =>
      txt(await agentEval.getAgentEvalResult(agent_eval_id, extra.signal)),
  );

  server.registerTool(
    "lyzr_get_agent_eval_result_by_agent",
    {
      title: "Get Agent Eval Result By Agent",
      description: "Get agent evaluation results for a given agent id.",
      inputSchema: {
        agent_id: z.string().describe("Agent id whose eval results to fetch"),
      },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ agent_id }, extra) =>
      txt(await agentEval.getAgentEvalResultByAgent(agent_id, extra.signal)),
  );
};
