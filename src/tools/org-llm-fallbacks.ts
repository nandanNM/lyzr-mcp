import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { OrgLlmFallbacksClient } from "../lyzr/org-llm-fallbacks.js";

const fallbackEntrySchema = z.object({
  priority: z.number().describe("Priority order for this fallback entry (lower runs first)"),
  provider_id: z.string().describe("LLM provider id, e.g. OpenAI, Anthropic, Google"),
  model: z.string().describe("Model name, e.g. gpt-4o-mini"),
  credential_id: z.string().describe("Credential id to use for this fallback entry"),
});

/**
 * Registers tools for managing the org-wide LLM fallback chain.
 */
export const registerOrgLlmFallbacksTools = (
  server: McpServer,
  client: OrgLlmFallbacksClient,
) => {
  server.registerTool(
    "lyzr_get_org_llm_fallbacks",
    {
      title: "Get Org LLM Fallbacks",
      description: "Get the organization's configured LLM fallback chain.",
      inputSchema: {},
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async (_args, extra) => {
      const result = await client.getLlmFallbacks(extra.signal);
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    },
  );

  server.registerTool(
    "lyzr_update_org_llm_fallbacks",
    {
      title: "Update Org LLM Fallbacks",
      description:
        "Replace the organization's LLM fallback chain with the given ordered list of fallback entries.",
      inputSchema: {
        fallbacks: z
          .array(fallbackEntrySchema)
          .describe("Ordered list of fallback LLM entries"),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async (args, extra) => {
      const result = await client.updateLlmFallbacks(args, extra.signal);
      return {
        content: [
          {
            type: "text",
            text: `Updated org LLM fallbacks.\n\n${JSON.stringify(result, null, 2)}`,
          },
        ],
      };
    },
  );
};
