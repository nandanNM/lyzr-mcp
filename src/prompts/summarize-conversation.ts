import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

/**
 * `summarize_conversation` — asks the model to summarize a chat with a Lyzr
 * agent, using `lyzr_chat` for more context if needed.
 */
export const registerSummarizeConversationPrompt = (server: McpServer) => {
  server.registerPrompt(
    "summarize_conversation",
    {
      title: "Summarize Agent Conversation",
      description:
        "Summarize the recent conversation with a Lyzr agent into key points and action items.",
      argsSchema: {
        agent_id: z
          .string()
          .describe("The agent_id whose conversation to summarize"),
      },
    },
    ({ agent_id }) => ({
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text:
              `Summarize the recent conversation with Lyzr agent \`${agent_id}\` ` +
              `into (1) key points and (2) action items. If you need more context, ` +
              `use \`lyzr_chat\` with that agent_id to ask follow-up questions.`,
          },
        },
      ],
    }),
  );
};
