import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

/**
 * `draft_a2a_agent` — produces a message that asks the model to design an
 * agent-to-agent (A2A) agent and then call `lyzr_create_a2a_agent` with the result.
 */
export const registerDraftA2AAgentPrompt = (server: McpServer) => {
  server.registerPrompt(
    "draft_a2a_agent",
    {
      title: "Draft an A2A Agent",
      description:
        "Draft the config for a Lyzr agent-to-agent (A2A) agent, ready for lyzr_create_a2a_agent.",
      argsSchema: {
        purpose: z
          .string()
          .describe("What this A2A agent does and who/what calls it"),
      },
    },
    ({ purpose }) => ({
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text:
              `Design a Lyzr A2A (agent-to-agent) agent for: "${purpose}".\n` +
              `Propose a concise name and description, and the underlying agent config ` +
              `it should expose over A2A. Then call \`lyzr_create_a2a_agent\` with those ` +
              `fields, and mention \`lyzr_get_a2a_agent_card\` as the way another agent ` +
              `would discover its capabilities.`,
          },
        },
      ],
    }),
  );
};
