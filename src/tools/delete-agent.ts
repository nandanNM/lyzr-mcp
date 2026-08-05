import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { LyzrClient } from "../lyzr/client.js";

/**
 * Registers `lyzr_delete_agent` — deletes an agent. Marked destructive so
 * clients prompt for confirmation before running it.
 */
export const registerDeleteAgentTool = (
  server: McpServer,
  client: LyzrClient,
) => {
  server.registerTool(
    "lyzr_delete_agent",
    {
      title: "Delete Lyzr Agent",
      description: "Permanently delete a Lyzr agent by its agent_id.",
      inputSchema: {
        agent_id: z.string().describe("The agent_id to delete"),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ agent_id }, extra) => {
      await client.deleteAgent(agent_id, extra.signal);
      return {
        content: [{ type: "text", text: `Deleted agent \`${agent_id}\`.` }],
      };
    },
  );
};
