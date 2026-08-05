import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

/**
 * `setup_rag_agent` — guides the model through the full RAG flow: create a
 * knowledge base, train it, then create an agent grounded on that topic.
 * Supports the "basic", "one_shot", and "agentic" retrieval feature shapes.
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
        retrieval_strategy: z
          .enum(["basic", "one_shot", "agentic"])
          .optional()
          .default("basic")
          .describe(
            "The retrieval feature shape to build: basic (single KB), one_shot (multi-KB, single merged pass), or agentic (multi-KB, planner-driven)",
          ),
      },
    },
    ({ topic, source_url, retrieval_strategy }) => {
      const trainingStep = source_url
        ? `2. Train it from ${source_url} using \`lyzr_kb_train_website\`.\n`
        : `2. Train it using \`lyzr_kb_train_website\` or \`lyzr_kb_train_text\`.\n`;

      let retrievalStep: string;
      if (retrieval_strategy === "one_shot") {
        retrievalStep =
          `3. one_shot retrieval only makes sense with 2+ knowledge bases — create/train additional KBs for related sub-topics first.\n` +
          `4. Build the agent's retrieval feature as: \`{lyzr_rag: {}, oneshot_rag: [{rag_id, name, description, top_k, ` +
          `retrieval_type, score_threshold}, ...one per KB], planner_model, merge_top_k}\`.\n`;
      } else if (retrieval_strategy === "agentic") {
        retrievalStep =
          `3. agentic retrieval supports multiple knowledge bases with a planner deciding which to query.\n` +
          `4. Build the agent's retrieval feature as: \`{lyzr_rag: {}, agentic_rag: [{base_url, rag_id, rag_name, ` +
          `params: {top_k, retrieval_type, score_threshold}}, ...one per KB]}\`.\n`;
      } else {
        retrievalStep =
          `3. Build the agent's retrieval feature as: \`{lyzr_rag: {base_url, rag_id, rag_name, params: ` +
          `{top_k, retrieval_type: "basic", score_threshold}}, agentic_rag: []}\`.\n`;
      }

      return {
        messages: [
          {
            role: "user",
            content: {
              type: "text",
              text:
                `Set up a Lyzr RAG agent for "${topic}" using the "${retrieval_strategy}" retrieval strategy:\n` +
                `1. Create a knowledge base with \`lyzr_kb_create\` (name must be lowercase_with_underscores).\n` +
                trainingStep +
                retrievalStep +
                `5. Create an agent with \`lyzr_create_agent\` whose role/goal/instructions ground it in "${topic}", ` +
                `passing the retrieval feature built above.\n` +
                `CAUTION: \`retrieval_type: "mmr"\` inside \`params\` was confirmed to silently return zero results ` +
                `on at least one real KB — prefer \`"basic"\` or \`"hyde"\`.\n` +
                `Report the new kb_id(s) and agent_id.`,
            },
          },
        ],
      };
    },
  );
};
