import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { LyzrClient } from "../lyzr/client.js";

/**
 * Registers `lyzr_list_agents` — lists the caller's Lyzr agents.
 * NOTE: the GET /agent endpoint is inferred; verify against the API reference.
 */
export const registerListAgentsTool = (
  server: McpServer,
  client: LyzrClient,
) => {
  server.registerTool(
    "lyzr_list_agents",
    {
      title: "List Lyzr Agents",
      description: "List the agents available to your Lyzr API key.",
      inputSchema: {},
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async (_args, extra) => {
      const agents = await client.listAgents(extra.signal);
      return {
        content: [{ type: "text", text: JSON.stringify(agents, null, 2) }],
      };
    },
  );
};
