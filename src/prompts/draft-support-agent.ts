import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

/**
 * `draft_support_agent` — produces a message that asks the model to design a
 * Lyzr support agent and then call `lyzr_create_agent` with the result.
 */
export const registerDraftSupportAgentPrompt = (server: McpServer) => {
  server.registerPrompt(
    "draft_support_agent",
    {
      title: "Draft a Support Agent",
      description:
        "Draft name/role/goal/instructions for a Lyzr customer-support agent, ready for lyzr_create_agent.",
      argsSchema: {
        product: z
          .string()
          .describe("The product or domain the agent will support"),
      },
    },
    ({ product }) => ({
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text:
              `Design a Lyzr customer-support agent for "${product}".\n` +
              `Propose a concise name, role, goal, and clear system instructions ` +
              `(tone, what to ask first, escalation rules). Then call ` +
              `\`lyzr_create_agent\` with those fields.`,
          },
        },
      ],
    }),
  );
};
