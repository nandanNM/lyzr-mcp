import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { type LyzrClient, KNOWN_PROVIDERS } from "../lyzr/client.js";

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
        "Create a new Lyzr agent. Returns the new agent_id to use with lyzr_chat. Also supports " +
        "agent_context/agent_output/examples, features[], tools/tool_configs, tool_usage_description, " +
        "llm_credential_id, response_format, managed_agents, a2a_tools, store_messages/file_output/" +
        "disable_artifacts, voice_config, additional_model_params, image_output_config, max_iterations, " +
        "git_agent, proxy_config, skills_catalog, mcp_resources, and mcp_prompts. Note: if store_messages " +
        "is false, features[] cannot include a memory feature type (memory/long_term_memory/" +
        "short_term_memory/struct_memory) — the backend rejects that combination.",
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
        top_p: z.number().min(0).max(1).optional().describe("Top-p (0-1, default 0.9)"),
        description: z
          .string()
          .optional()
          .describe("Optional agent description"),
        agent_context: z.string().optional().describe("Additional context for the agent"),
        agent_output: z.string().optional().describe("Expected output format/description"),
        examples: z.string().optional().describe("Example interactions"),
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
            "Feature list. Each entry needs a real prerequisite resource id already created — pass a bogus " +
              "id and you'll get a confusing failure deep in agent chat, not at config time: RAI feature's " +
              "config.policy_id — call lyzr_rai_create_policy first; MEMORY feature's config.memory_id/" +
              "memory_credential_id — call lyzr_memprovider_provision_aws_agentcore_memory (or " +
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
              "Note: planner_model/merge_top_k are one-shot-only and ignored by basic/agentic. " +
              "RAI feature config: {endpoint, policy_id, policy_name}. The backend ignores " +
              "config.endpoint entirely (it always uses its own server-side RAI URL), so send it for " +
              "parity with Studio UI but it has no effect. A missing/invalid policy_id does NOT crash " +
              "init and does NOT hard-fail per-message either — the module defaults fail_open:true, so " +
              "requests are just allowed through unchecked (silent no-op guardrail), not blocked. " +
              'Fairness & Bias and Reflection are NOT separate feature types — both are toggles inside ' +
              'one SRS feature: {type:"SRS", config:{max_tries, modules:{reflection: bool, bias: bool}}}. ' +
              "max_tries and modules are required positional args with no defaults in the backend module " +
              "init — omitting either crashes agent init immediately (same failure class as a bad " +
              "DATA_QUERY config), so always include both when sending SRS. " +
              'GROUNDEDNESS feature config: {facts: string[]}. No prerequisite resource; facts are ' +
              "optional (defaults to [] server-side) and missing/empty facts just make groundedness " +
              "checks trivially pass (score 1.0) rather than error.",
          ),
        tools: z.array(z.string()).optional().describe("Tool ids/provider_ids to attach"),
        tool_usage_description: z.string().optional().describe("Description of how tools should be used"),
        tool_configs: z
          .array(z.record(z.unknown()))
          .optional()
          .describe("Per-tool config overrides"),
        llm_credential_id: z.string().optional().describe("Override the default credential id for the provider"),
        response_format: z
          .record(z.unknown())
          .optional()
          .describe('Response format, e.g. {type:"text"} or {type:"json_schema", json_schema:{...}}'),
        managed_agents: z
          .array(
            z.object({
              id: z.string(),
              name: z.string(),
              usage_description: z.string().optional(),
            }),
          )
          .optional()
          .describe("Sub-agents this agent can delegate to"),
        store_messages: z.boolean().optional().describe("Whether to persist chat messages (default true)"),
        file_output: z.boolean().optional().describe("Whether the agent can output files (default false)"),
        disable_artifacts: z.boolean().optional().describe("Disable artifact generation (default false)"),
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
          .describe("Agent-to-agent tool endpoints"),
        voice_config: z
          .record(z.unknown())
          .optional()
          .describe("Voice config, e.g. {initiator, message, language}"),
        additional_model_params: z.record(z.unknown()).optional().describe("Extra model params passed through"),
        image_output_config: z
          .object({ model: z.string(), credential_id: z.string() })
          .optional()
          .describe("Image generation model/credential config"),
        max_iterations: z.number().optional().describe("Max agent loop iterations (default 25)"),
        git_agent: z.record(z.unknown()).optional().describe("Git integration config"),
        proxy_config: z.record(z.unknown()).optional().describe("Proxy config"),
        skills_catalog: z.array(z.string()).optional().describe("Skill ids available to the agent"),
        mcp_resources: z
          .array(z.object({ server_id: z.string(), resource_uri: z.string() }))
          .optional()
          .describe("MCP resources to attach"),
        mcp_prompts: z
          .array(
            z.object({
              server_id: z.string(),
              prompt_name: z.string(),
              variables: z.record(z.unknown()).optional(),
            }),
          )
          .optional()
          .describe("MCP prompts to attach"),
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
