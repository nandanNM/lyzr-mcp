import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { HumanFeedbackClient } from "../lyzr/human-feedback.js";

/**
 * Registers human feedback, tool request, and skills tools.
 */
export const registerHumanFeedbackTools = (
  server: McpServer,
  client: HumanFeedbackClient,
) => {
  server.registerTool(
    "lyzr_create_feedback",
    {
      title: "Create Human Feedback",
      description:
        "Submit human feedback on an agent's output for a given RAG feedback config.",
      inputSchema: {
        feedback_rag_config_id: z
          .string()
          .describe("The feedback RAG config id (query param)"),
        feedback: z.string().describe("The feedback text"),
        user_input: z.string().describe("The original user input"),
        agent_output: z.string().describe("The agent's output being reviewed"),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async (args, extra) => {
      const { feedback_rag_config_id, ...body } = args;
      const result = await client.createFeedback(
        feedback_rag_config_id,
        body,
        extra.signal,
      );
      return {
        content: [
          {
            type: "text",
            text: `Created feedback.\n\n${JSON.stringify(result, null, 2)}`,
          },
        ],
      };
    },
  );

  server.registerTool(
    "lyzr_create_tool_request",
    {
      title: "Create Tool Request",
      description:
        "Request a new tool, MCP server, skill, or custom integration be added to Lyzr.",
      inputSchema: {
        request_type: z
          .enum(["tool", "mcp_server", "skill", "custom_integration"])
          .describe("The type of request"),
        name: z.string().min(1).max(200).describe("Short name for the request"),
        description: z
          .string()
          .min(1)
          .max(4000)
          .describe("Detailed description of what is being requested"),
        use_case: z
          .string()
          .min(1)
          .max(4000)
          .describe("The use case this request would enable"),
        priority: z
          .enum(["low", "medium", "high", "blocker"])
          .describe("Priority of the request"),
        reference_urls: z
          .array(z.string())
          .max(20)
          .optional()
          .describe("Optional reference URLs (max 20)"),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async (args, extra) => {
      const result = await client.createToolRequest(args, extra.signal);
      return {
        content: [
          {
            type: "text",
            text: `Created tool request (group ${result.group_id}). ${result.message}\n\n${JSON.stringify(result, null, 2)}`,
          },
        ],
      };
    },
  );

  server.registerTool(
    "lyzr_list_shared_skills",
    {
      title: "List Shared Skills",
      description: "List all shared skills available to the account.",
      inputSchema: {},
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async (_args, extra) => {
      const result = await client.listSharedSkills(extra.signal);
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    },
  );

  server.registerTool(
    "lyzr_get_skill_usage",
    {
      title: "Get Skill Usage",
      description: "Get usage statistics for a given skill.",
      inputSchema: {
        skill_id: z.string().describe("The skill id"),
      },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async (args, extra) => {
      const result = await client.getSkillUsage(args.skill_id, extra.signal);
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    },
  );
};
