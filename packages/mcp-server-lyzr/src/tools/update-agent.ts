import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { KNOWN_PROVIDERS, type LyzrClient } from "../lyzr/client.js";

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
        "Update fields (name/role/goal/instructions/temperature/description/provider/model/...) on an " +
        "existing Lyzr agent. This is a full-replace PUT under the hood: unspecified fields are preserved " +
        "by fetching the current agent first. Pass `provider`/`model` to actually change the agent's LLM " +
        "(resolved the same way as lyzr_create_agent) — unlike earlier versions of this tool, these are no " +
        "longer frozen to the agent's current values. When attaching tools via `tools`, pass either the " +
        "tool's catalog id or its provider_id (from lyzr_get_all_tools/lyzr_list_all_user_tools) — the " +
        "correct tool_source and action_names are resolved automatically unless you pass `tool_configs` " +
        "explicitly. Also supports agent_context/agent_output/examples, features[], tool_usage_description, " +
        "llm_credential_id, response_format, managed_agents, a2a_tools, store_messages/file_output/" +
        "disable_artifacts, voice_config, additional_model_params, image_output_config, max_iterations, " +
        "git_agent, proxy_config, skills_catalog, mcp_resources, and mcp_prompts. Note: if store_messages " +
        "is false, features[] cannot include a memory feature type (memory/long_term_memory/" +
        "short_term_memory/struct_memory), and managed_agents cannot reference this agent's own id — both " +
        "are pre-checked client-side with a clear error instead of a raw 422/400. The response echoes back " +
        "the resolved tools/tool_configs so you have full context on what's actually attached.",
      inputSchema: {
        agent_id: z.string().describe("The agent_id to update"),
        name: z.string().optional().describe("New agent name"),
        role: z.string().optional().describe("New role/persona"),
        goal: z.string().optional().describe("New goal"),
        instructions: z.string().optional().describe("New system instructions"),
        provider: z
          .string()
          .optional()
          .describe(`New LLM provider. One of: ${KNOWN_PROVIDERS.join(", ")}`),
        model: z.string().optional().describe("New model name"),
        temperature: z
          .number()
          .min(0)
          .max(2)
          .optional()
          .describe("New sampling temperature (0-2)"),
        top_p: z.number().min(0).max(1).optional().describe("New top-p (0-1)"),
        description: z.string().optional().describe("New description"),
        agent_context: z.string().optional().describe("New additional context"),
        agent_output: z.string().optional().describe("New expected output format/description"),
        examples: z.string().optional().describe("New example interactions"),
        features: z
          .array(
            z.object({
              type: z.string(),
              config: z.record(z.unknown()).optional(),
              priority: z.number(),
            }),
          )
          .optional()
          .describe(
            "New feature list (replaces existing). Each entry needs a real prerequisite resource id already " +
              "created — pass a bogus id and you'll get a confusing failure deep in agent chat, not at " +
              "config time: RAI feature's config.policy_id — call lyzr_rai_create_policy first; MEMORY " +
              "feature's config.memory_id/memory_credential_id — call " +
              "lyzr_memprovider_provision_aws_agentcore_memory (or " +
              "lyzr_memprovider_use_existing_aws_agentcore_memory / lyzr_memprovider_validate_mem0) first; " +
              "KNOWLEDGE_BASE feature's config.rag_id — call lyzr_kb_create first; CONTEXT feature's " +
              "config.context_id — call lyzr_create_context first. Also incompatible with " +
              "store_messages:false for memory feature types. " +
              "KNOWLEDGE_BASE feature config has 3 confirmed shapes: " +
              "Basic (single KB): {lyzr_rag:{base_url, rag_id, rag_name?, params:{top_k, " +
              'retrieval_type:"basic", score_threshold}}, agentic_rag:[]}. ' +
              "One Shot (multi-KB, planner LLM picks which KB(s)): {lyzr_rag:{}, " +
              "oneshot_rag:[{rag_id, name, description?, top_k, retrieval_type, score_threshold, " +
              "filter_fields?, examples?}, ...], planner_model, merge_top_k} — dispatch order is " +
              "oneshot_rag checked first, then agentic_rag, then lyzr_rag. " +
              "Agentic (multi-KB, ReAct tool loop): {lyzr_rag:{}, agentic_rag:[{base_url, rag_id, " +
              "rag_name?, params:{top_k, retrieval_type, score_threshold}}, ...]}. " +
              "Note: planner_model/merge_top_k are one-shot-only and ignored by basic/agentic.",
          ),
        tools: z
          .array(z.string())
          .optional()
          .describe(
            "Tool ids to attach to the agent (replaces the existing tool list)",
          ),
        tool_usage_description: z.string().optional().describe("New tool usage description"),
        tool_configs: z
          .array(z.record(z.unknown()))
          .optional()
          .describe(
            "Per-tool config overrides (replaces the existing tool_configs)",
          ),
        llm_credential_id: z.string().optional().describe("Override the credential id for the (new) provider"),
        response_format: z
          .record(z.unknown())
          .optional()
          .describe('New response format, e.g. {type:"text"} or {type:"json_schema", json_schema:{...}}'),
        managed_agents: z
          .array(
            z.object({
              id: z.string(),
              name: z.string(),
              usage_description: z.string().optional(),
            }),
          )
          .optional()
          .describe("New sub-agent delegation list (replaces existing); cannot reference this agent's own id"),
        store_messages: z.boolean().optional().describe("Whether to persist chat messages"),
        file_output: z.boolean().optional().describe("Whether the agent can output files"),
        disable_artifacts: z.boolean().optional().describe("Disable artifact generation"),
        a2a_tools: z
          .array(
            z.object({
              base_url: z.string(),
              agent_name: z.string().optional(),
              agent_card_path: z.string().optional(),
              auth_type: z.string().optional(),
              credential_id: z.string().optional(),
            }),
          )
          .optional()
          .describe("New agent-to-agent tool endpoints (replaces existing)"),
        voice_config: z
          .record(z.unknown())
          .optional()
          .describe("New voice config, e.g. {initiator, message, language}"),
        additional_model_params: z.record(z.unknown()).optional().describe("New extra model params"),
        image_output_config: z
          .object({ model: z.string(), credential_id: z.string() })
          .optional()
          .describe("New image generation model/credential config"),
        max_iterations: z.number().optional().describe("New max agent loop iterations"),
        git_agent: z.record(z.unknown()).optional().describe("New git integration config"),
        proxy_config: z.record(z.unknown()).optional().describe("New proxy config"),
        skills_catalog: z.array(z.string()).optional().describe("New skill ids available to the agent"),
        mcp_resources: z
          .array(z.object({ server_id: z.string(), resource_uri: z.string() }))
          .optional()
          .describe("New MCP resources (replaces existing)"),
        mcp_prompts: z
          .array(
            z.object({
              server_id: z.string(),
              prompt_name: z.string(),
              variables: z.record(z.unknown()).optional(),
            }),
          )
          .optional()
          .describe("New MCP prompts (replaces existing)"),
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
