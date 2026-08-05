import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { LyzrClient } from "../lyzr/client.js";

/**
 * Registers `lyzr_update_agent` — updates selected fields on an existing agent.
 * Unspecified fields are preserved (the client fetches, merges, then PUTs).
 */
export const registerUpdateAgentTool = (
  server: McpServer,
  client: LyzrClient,
) => {
  server.registerTool(
    "lyzr_update_agent",
    {
      title: "Update Lyzr Agent",
      description:
        "Update fields (name/role/goal/instructions/temperature/description) on an existing Lyzr agent.",
      inputSchema: {
        agent_id: z.string().describe("The agent_id to update"),
        name: z.string().optional().describe("New agent name"),
        role: z.string().optional().describe("New role/persona"),
        goal: z.string().optional().describe("New goal"),
        instructions: z.string().optional().describe("New system instructions"),
        temperature: z
          .number()
          .min(0)
          .max(2)
          .optional()
          .describe("New sampling temperature (0-2)"),
        description: z.string().optional().describe("New description"),
        tools: z
          .array(z.string())
          .optional()
          .describe(
            "Tool ids to attach to the agent (replaces the existing tool list)",
          ),
        tool_configs: z
          .array(z.record(z.unknown()))
          .optional()
          .describe(
            "Per-tool config overrides (replaces the existing tool_configs)",
          ),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ agent_id, ...updates }, extra) => {
      const result = await client.updateAgent(agent_id, updates, extra.signal);
      return {
        content: [
          {
            type: "text",
            text: `Updated agent \`${agent_id}\`.\n\n${JSON.stringify(result, null, 2)}`,
          },
        ],
      };
    },
  );
};
