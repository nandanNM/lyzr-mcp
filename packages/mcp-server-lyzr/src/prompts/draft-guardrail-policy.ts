import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

/**
 * `draft_guardrail_policy` — helps design an RAI guardrail policy for a use case
 * and create it with `lyzr_rai_create_policy`.
 */
export const registerDraftGuardrailPolicyPrompt = (server: McpServer) => {
  server.registerPrompt(
    "draft_guardrail_policy",
    {
      title: "Draft a Guardrail Policy",
      description:
        "Recommend Responsible-AI guardrails for a use case, then create the policy with lyzr_rai_create_policy.",
      argsSchema: {
        use_case: z
          .string()
          .describe("What the agent does / the context to protect"),
      },
    },
    ({ use_case }) => ({
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text:
              `Design a Responsible-AI guardrail policy for this use case: "${use_case}".\n` +
              `Recommend sensible settings for toxicity, prompt-injection detection, ` +
              `NSFW checks, and any banned topics. Then create it with ` +
              `\`lyzr_rai_create_policy\` and report the policy id.`,
          },
        },
      ],
    }),
  );
};
