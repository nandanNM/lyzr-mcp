import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { RaiClient } from "../lyzr/rai.js";

const txt = (data: unknown) => ({
  content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
});

/** Register the RAI (Responsible-AI guardrails) tools. */
export const registerRaiTools = (server: McpServer, rai: RaiClient) => {
  server.registerTool(
    "lyzr_rai_create_policy",
    {
      title: "Create RAI Policy",
      description:
        "Create a Responsible-AI guardrail policy (toxicity, prompt-injection, NSFW, banned topics).",
      inputSchema: {
        name: z.string().describe("Policy name"),
        description: z.string().optional(),
        toxicity_threshold: z
          .number()
          .min(0)
          .max(1)
          .optional()
          .describe(
            "< 1.0 enables the toxicity check at that threshold (1.0 = off)",
          ),
        prompt_injection: z
          .boolean()
          .optional()
          .describe("Enable prompt-injection detection"),
        nsfw_check: z.boolean().optional().describe("Enable NSFW check"),
        nsfw_threshold: z.number().min(0).max(1).optional(),
        banned_topics: z
          .array(z.string())
          .optional()
          .describe("Topics to block"),
      },
      annotations: {
        readOnlyHint: false,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async (args, extra) => txt(await rai.createPolicy(args, extra.signal)),
  );

  server.registerTool(
    "lyzr_rai_list_policies",
    {
      title: "List RAI Policies",
      description: "List your Responsible-AI guardrail policies.",
      inputSchema: {},
      annotations: {
        readOnlyHint: true,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async (_args, extra) => txt(await rai.listPolicies(extra.signal)),
  );

  server.registerTool(
    "lyzr_rai_get_policy",
    {
      title: "Get RAI Policy",
      description: "Fetch a guardrail policy by id.",
      inputSchema: { policy_id: z.string() },
      annotations: {
        readOnlyHint: true,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ policy_id }, extra) =>
      txt(await rai.getPolicy(policy_id, extra.signal)),
  );

  server.registerTool(
    "lyzr_rai_delete_policy",
    {
      title: "Delete RAI Policy",
      description: "Delete a guardrail policy by id.",
      inputSchema: { policy_id: z.string() },
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ policy_id }, extra) =>
      txt(await rai.deletePolicy(policy_id, extra.signal)),
  );
};
