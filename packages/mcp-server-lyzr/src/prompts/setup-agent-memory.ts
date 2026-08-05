import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

/**
 * `setup_agent_memory` — attaches a cross-session Cognis MEMORY feature to an
 * existing agent via `lyzr_update_agent`.
 */
export const registerSetupAgentMemoryPrompt = (server: McpServer) => {
  server.registerPrompt(
    "setup_agent_memory",
    {
      title: "Set Up Agent Memory",
      description:
        "Attach a cross-session Cognis MEMORY feature to an existing agent, merged with its existing features.",
      argsSchema: {
        agent_id: z.string().describe("The existing agent_id to configure"),
        instructions: z
          .string()
          .describe("What the agent should remember and/or how"),
      },
    },
    ({ agent_id, instructions }) => ({
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text:
              `Set up cross-session memory for agent \`${agent_id}\`.\n` +
              `1. Call \`lyzr_get_agent\` on \`${agent_id}\` first to fetch its existing \`features\` array.\n` +
              `2. Build a MEMORY feature entry: \`{type: "MEMORY", config: {provider: "cognis", lyzr_memory: ` +
              `{provider_type: "cognis", params: {cross_session: true, instructions: "${instructions}"}}}}\`. ` +
              `No separate resource creation is needed — Cognis is a shared provider.\n` +
              `3. Call \`lyzr_update_agent\` with \`features\` set to the existing features plus this new/replaced ` +
              `MEMORY entry — \`lyzr_update_agent\` is a full-replace, so merge in the existing entries rather than ` +
              `overwriting them.\n` +
              `Report the final features array.`,
          },
        },
      ],
    }),
  );
};
