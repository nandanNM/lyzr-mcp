import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

/**
 * `attach_rai_policy` — creates an RAI guardrail policy from a description and
 * attaches it to an existing agent's features via `lyzr_update_agent`.
 */
export const registerAttachRaiPolicyPrompt = (server: McpServer) => {
  server.registerPrompt(
    "attach_rai_policy",
    {
      title: "Attach an RAI Policy to an Agent",
      description:
        "Create a Responsible-AI guardrail policy and attach it as a RAI feature on an existing agent.",
      argsSchema: {
        agent_id: z.string().describe("The existing agent_id to protect"),
        policy_requirements: z
          .string()
          .describe("A description of what to block or check for"),
      },
    },
    ({ agent_id, policy_requirements }) => ({
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text:
              `Attach a Responsible-AI guardrail policy to agent \`${agent_id}\` for: "${policy_requirements}".\n` +
              `1. Call \`lyzr_rai_create_policy\` with fields derived from the requirements (e.g. ` +
              `\`toxicity_threshold\`, \`prompt_injection\`, \`nsfw_check\`, \`banned_topics\`) and note the returned policy id.\n` +
              `2. Call \`lyzr_get_agent\` on \`${agent_id}\` first to fetch its existing \`features\` array.\n` +
              `3. Call \`lyzr_update_agent\` with \`features\` set to the existing features plus ` +
              `\`{type: "RAI", config: {policy_id, policy_name}}\` — \`lyzr_update_agent\` is a full-replace, so merge ` +
              `in the existing entries rather than overwriting them.\n` +
              `WARNING: do not also attach a \`UQLM_LLM_JUDGE\` feature on the same agent — combining RAI and ` +
              `UQLM_LLM_JUDGE is a confirmed crash bug (RAI's guard re-fires on UQLM's internal rewrite call, ` +
              `causing an HTTP 400 on every message).\n` +
              `Report the policy_id and the final features array.`,
          },
        },
      ],
    }),
  );
};
