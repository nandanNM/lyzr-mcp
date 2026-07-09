import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { LyzrClient, KNOWN_PROVIDERS } from "../lyzr/client.js";

/**
 * Registers `lyzr_create_agent` — creates a new Lyzr agent and returns its id.
 */
export const registerCreateAgentTool = (
  server: McpServer,
  client: LyzrClient,
) => {
  server.registerTool(
    "lyzr_create_agent",
    {
      title: "Create Lyzr Agent",
      description:
        "Create a new Lyzr agent. Returns the new agent_id to use with lyzr_chat.",
      inputSchema: {
        name: z.string().describe("Agent name"),
        provider: z
          .string()
          .default("openai")
          .describe(`LLM provider. One of: ${KNOWN_PROVIDERS.join(", ")}`),
        model: z
          .string()
          .default("gpt-4o-mini")
          .describe("Model name, e.g. gpt-4o-mini, gpt-4o, claude-sonnet-4-5"),
        role: z.string().describe("The agent's role/persona"),
        goal: z.string().describe("What the agent should accomplish"),
        instructions: z
          .string()
          .describe("System instructions that steer the agent"),
        temperature: z
          .number()
          .min(0)
          .max(2)
          .optional()
          .describe("Sampling temperature (0-2, default 0.7)"),
        description: z
          .string()
          .optional()
          .describe("Optional agent description"),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async (args, extra) => {
      const result = await client.createAgent(args, extra.signal);
      return {
        content: [
          {
            type: "text",
            text: `Created agent \`${result.agent_id}\`.\n\n${JSON.stringify(result, null, 2)}`,
          },
        ],
      };
    },
  );
};
