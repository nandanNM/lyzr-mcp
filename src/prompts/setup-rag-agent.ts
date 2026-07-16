import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

/**
 * `setup_rag_agent` — guides the model through the full RAG flow: create a
 * knowledge base, train it, then create an agent grounded on that topic.
 */
export const registerSetupRagAgentPrompt = (server: McpServer) => {
  server.registerPrompt(
    "setup_rag_agent",
    {
      title: "Set Up a RAG Agent",
      description:
        "Create a knowledge base, train it from a source, and create an agent grounded on a topic — end to end.",
      argsSchema: {
        topic: z.string().describe("The domain/topic the agent should master"),
        source_url: z
          .string()
          .optional()
          .describe("Optional website URL to train the knowledge base from"),
      },
    },
    ({ topic, source_url }) => ({
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text:
              `Set up a Lyzr RAG agent for "${topic}":\n` +
              `1. Create a knowledge base with \`lyzr_kb_create\` (name must be lowercase_with_underscores).\n` +
              (source_url
                ? `2. Train it from ${source_url} using \`lyzr_kb_train_website\`.\n`
                : `2. Train it using \`lyzr_kb_train_website\` or \`lyzr_kb_train_text\`.\n`) +
              `3. Create an agent with \`lyzr_create_agent\` whose role/goal/instructions ground it in "${topic}".\n` +
              `Report the new kb_id and agent_id.`,
          },
        },
      ],
    }),
  );
};
