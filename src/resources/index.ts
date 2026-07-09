import {
  McpServer,
  ResourceTemplate,
} from "@modelcontextprotocol/sdk/server/mcp.js";
import { LyzrClient } from "../lyzr/client.js";

/**
 * Expose Lyzr agents as MCP resources:
 *   - lyzr://agents            -> the list of your agents
 *   - lyzr://agent/{agentId}   -> a single agent's details
 *
 * NOTE: these use the same inferred list/get endpoints as the read tools; if the
 * API paths differ, fix them once in src/lyzr/client.ts.
 */
export const registerResources = (server: McpServer, client: LyzrClient) => {
  server.registerResource(
    "lyzr-agents",
    "lyzr://agents",
    {
      title: "Lyzr Agents",
      description: "All agents available to your Lyzr API key.",
      mimeType: "application/json",
    },
    async (uri) => {
      const agents = await client.listAgents();
      return {
        contents: [
          {
            uri: uri.href,
            mimeType: "application/json",
            text: JSON.stringify(agents, null, 2),
          },
        ],
      };
    },
  );

  server.registerResource(
    "lyzr-agent",
    new ResourceTemplate("lyzr://agent/{agentId}", { list: undefined }),
    {
      title: "Lyzr Agent",
      description: "Details of a single Lyzr agent by its agent_id.",
      mimeType: "application/json",
    },
    async (uri, variables) => {
      const agentId = String(variables.agentId);
      const agent = await client.getAgent(agentId);
      return {
        contents: [
          {
            uri: uri.href,
            mimeType: "application/json",
            text: JSON.stringify(agent, null, 2),
          },
        ],
      };
    },
  );
};
