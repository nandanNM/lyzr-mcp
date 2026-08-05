import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { LyzrClient } from "../lyzr/client.js";

/**
 * Registers `lyzr_get_agent` — fetches one agent's details.
 * NOTE: the GET /agent/{id} endpoint is inferred; verify against the API reference.
 */
export const registerGetAgentTool = (server: McpServer, client: LyzrClient) => {
  server.registerTool(
    "lyzr_get_agent",
    {
      title: "Get Lyzr Agent",
      description: "Fetch the details of a single Lyzr agent by its agent_id.",
      inputSchema: {
        agent_id: z.string().describe("The agent_id to fetch"),
      },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ agent_id }, extra) => {
      const agent = await client.getAgent(agent_id, extra.signal);
      return {
        content: [{ type: "text", text: JSON.stringify(agent, null, 2) }],
      };
    },
  );
};
