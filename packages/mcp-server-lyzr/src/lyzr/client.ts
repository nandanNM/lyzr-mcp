/**
 * Lyzr Agent + Inference client (host: agent-prod).
 * Endpoints/shapes confirmed against the official lyzr-adk SDK.
 */
import { LyzrHttp, LyzrApiError, normalizeList } from "./http.js";

export { LyzrApiError };

/** Provider alias -> the API's provider_id + credential_id (from the SDK's ModelResolver). */
const PROVIDER_MAP: Record<
  string,
  { providerId: string; credentialId: string }
> = {
  openai: { providerId: "OpenAI", credentialId: "lyzr_openai" },
  anthropic: { providerId: "Anthropic", credentialId: "lyzr_anthropic" },
  google: { providerId: "Google", credentialId: "lyzr_google" },
  gemini: { providerId: "Google", credentialId: "lyzr_google" },
  groq: { providerId: "Groq", credentialId: "lyzr_groq" },
  perplexity: { providerId: "Perplexity", credentialId: "lyzr_perplexity" },
  "aws-bedrock": {
    providerId: "Aws-Bedrock",
    credentialId: "lyzr_aws-bedrock",
  },
  bedrock: { providerId: "Aws-Bedrock", credentialId: "lyzr_aws-bedrock" },
  aws: { providerId: "Aws-Bedrock", credentialId: "lyzr_aws-bedrock" },
};

export const KNOWN_PROVIDERS = Object.keys(PROVIDER_MAP);

export interface CreateAgentInput {
  name: string;
  provider: string;
  model: string;
  role: string;
  goal: string;
  instructions: string;
  temperature?: number;
  top_p?: number;
  description?: string;
  agent_context?: string;
  agent_output?: string;
  examples?: string;
  features?: unknown[];
  tools?: string[];
  tool_usage_description?: string;
  tool_configs?: unknown[];
  llm_credential_id?: string;
  response_format?: Record<string, unknown>;
  managed_agents?: unknown[];
  store_messages?: boolean;
  file_output?: boolean;
  disable_artifacts?: boolean;
  a2a_tools?: unknown[];
  voice_config?: Record<string, unknown>;
  additional_model_params?: Record<string, unknown>;
  image_output_config?: Record<string, unknown>;
  max_iterations?: number;
  git_agent?: Record<string, unknown>;
  proxy_config?: Record<string, unknown>;
  skills_catalog?: string[];
  mcp_resources?: unknown[];
  mcp_prompts?: unknown[];
}

export interface Agent {
  agent_id?: string;
  _id?: string;
  name?: string;
  [key: string]: unknown;
}

export interface CreateAgentResult extends Agent {
  agent_id: string;
}

export interface ChatInput {
  agent_id: string;
  message: string;
  session_id: string;
  user_id?: string;
}

export interface ChatResult {
  response: string;
  [key: string]: unknown;
}

export interface TaskSubmitResult {
  task_id: string;
  status?: string;
  [key: string]: unknown;
}

export interface TaskStatusResult {
  status: string;
  result?: unknown;
  error?: unknown;
  progress?: unknown;
  [key: string]: unknown;
}

export interface UpdateAgentInput {
  name?: string;
  role?: string;
  goal?: string;
  instructions?: string;
  temperature?: number;
  top_p?: number;
  description?: string;
  /** New LLM provider alias (e.g. "openai", "anthropic"). Resolved via PROVIDER_MAP, same as createAgent. */
  provider?: string;
  /** New model name. Only takes effect together with (or already having) a resolvable provider. */
  model?: string;
  /** Tool ids to attach to the agent (replaces the existing tool list). */
  tools?: string[];
  /**
   * Per-tool config overrides (replaces the existing tool_configs). If
   * omitted while `tools` is set, correct configs are auto-resolved — see
   * `resolveToolConfigs` for why this matters.
   */
  tool_configs?: unknown[];
  agent_context?: string;
  agent_output?: string;
  examples?: string;
  features?: unknown[];
  tool_usage_description?: string;
  llm_credential_id?: string;
  response_format?: Record<string, unknown>;
  managed_agents?: unknown[];
  store_messages?: boolean;
  file_output?: boolean;
  disable_artifacts?: boolean;
  a2a_tools?: unknown[];
  voice_config?: Record<string, unknown>;
  additional_model_params?: Record<string, unknown>;
  image_output_config?: Record<string, unknown>;
  max_iterations?: number;
  git_agent?: Record<string, unknown>;
  proxy_config?: Record<string, unknown>;
  skills_catalog?: string[];
  mcp_resources?: unknown[];
  mcp_prompts?: unknown[];
}

const MEMORY_FEATURE_TYPES = new Set([
  "memory",
  "long_term_memory",
  "short_term_memory",
  "struct_memory",
]);


export class LyzrClient extends LyzrHttp {
  /**
   * Auto-build `tool_configs` entries for a set of tool ids/provider_ids.
   *
   * Verified end-to-end against the live API (2026-08-05) — see
   * .claude/skills/lyzr-api-endpoint/SKILL.md "Attaching tools to an agent"
   * for the full writeup. Three things the naive `{ tools: [id] }` call gets
   * wrong, all fixed here:
   *
   * 1. **Identity**: chat-time validation looks tools up by their
   *    `provider_id` string (e.g. `"openapi-agify_age_predictor-predictAge"`,
   *    `"HACKERNEWS"`) in the `tools_v2` collection — NOT by the catalog's
   *    Mongo `_id`. Passing the `_id` gets a 401
   *    `"Tool not found. Add it from Configure > Tools."` even though the
   *    tool exists. We resolve whatever the caller passed (id or provider_id)
   *    against `/v3/providers/tools/all` and always emit the `provider_id`.
   * 2. **`tool_source`**: the backend's own auto-migration
   *    (`migrate_old_tool_config`, runs when `tools` is set but
   *    `tool_configs` is falsy) string-matches `"openapi" in tool_id` on the
   *    raw id — never true for a real id — so it always defaults to
   *    `"composio"`. We read the real `provider_source` from the catalog
   *    instead.
   * 3. **`action_names`**: that same migration path also leaves this `None`,
   *    which crashes `create_action_config_map`'s `for action_name in
   *    action_names` with a bare 500. Conversely an EMPTY list doesn't crash
   *    but silently contributes zero callable actions — the LLM never even
   *    sees the tool. For `openapi` tools we derive the action name from the
   *    `provider_id` suffix (`openapi-<app>-<operationId>` →
   *    `<operationId>`), which is exactly how the backend's own OpenAPI
   *    parser names them. For everything else we ask
   *    `/v3/providers/tools/actions/{provider_id}` for the real action list.
   *
   * Known residual gap: no-auth `aci`-sourced tools (e.g. `HACKERNEWS`) will
   * attach and be offered to the LLM correctly, but actual execution can
   * still fail with a generic error — setting `provider_uuid` to route
   * around it instead forces an unwanted credential requirement even for
   * no-auth tools. That's a backend-side gap in the aci execution path we
   * can't work around from here; `openapi` tools are unaffected and fully
   * verified working.
   */
  private async resolveToolConfigs(
    toolIds: string[],
    signal?: AbortSignal,
  ): Promise<{ tools: string[]; toolConfigs: Record<string, unknown>[] }> {
    if (toolIds.length === 0) return { tools: [], toolConfigs: [] };
    const raw = await this.request<unknown>("GET", "/v3/providers/tools/all", {
      signal,
    });
    const all = normalizeList<Record<string, unknown>>(raw, "tools");
    const byId = new Map(
      all.map((t) => [String(t._id), t] as [string, Record<string, unknown>]),
    );
    const byProviderId = new Map(
      all.map(
        (t) =>
          [String(t.provider_id), t] as [string, Record<string, unknown>],
      ),
    );

    const resolvedProviderIds: string[] = [];
    const toolConfigs: Record<string, unknown>[] = [];

    for (const idOrProviderId of toolIds) {
      const meta = byId.get(idOrProviderId) ?? byProviderId.get(idOrProviderId);
      const providerId = String(meta?.provider_id ?? idOrProviderId);
      const providerSource = String(meta?.provider_source ?? "openapi");
      resolvedProviderIds.push(providerId);

      let actionNames: string[] = [];
      if (providerSource === "openapi") {
        const operationId = providerId.split("-").pop();
        if (operationId) actionNames = [operationId];
      } else {
        try {
          const appId = (meta?.meta_data as Record<string, unknown> | undefined)
            ?.app_id as string | undefined;
          const actions = await this.request<unknown>(
            "GET",
            `/v3/providers/tools/actions/${encodeURIComponent(providerId)}`,
            {
              // tool_source is required whenever provider_id is passed — omitting it 400s.
              params: {
                tool_source: providerSource,
                ...(appId ? { app_id: appId } : {}),
              },
              signal,
            },
          );
          actionNames = normalizeList<Record<string, unknown>>(actions)
            .map((a) => String(a.name ?? ""))
            .filter(Boolean);
        } catch {
          // Best-effort: empty list attaches the tool but with no callable actions.
          actionNames = [];
        }
      }

      toolConfigs.push({
        tool_name: providerId,
        tool_source: providerSource,
        action_names: actionNames,
        persist_auth: false,
      });
    }

    return { tools: resolvedProviderIds, toolConfigs };
  }

  /** Create an agent. POST /v3/agents/ (payload keys transformed; provider resolved). */
  createAgent(
    input: CreateAgentInput,
    signal?: AbortSignal,
  ): Promise<CreateAgentResult> {
    const resolved = PROVIDER_MAP[input.provider.trim().toLowerCase()];
    if (!resolved) {
      throw new Error(
        `Unknown provider "${input.provider}". Valid providers: ${KNOWN_PROVIDERS.join(", ")}`,
      );
    }
    if (
      input.store_messages === false &&
      (input.features ?? []).some(
        (f) =>
          typeof f === "object" &&
          f !== null &&
          MEMORY_FEATURE_TYPES.has(String((f as Record<string, unknown>).type)),
      )
    ) {
      throw new Error(
        `store_messages:false is incompatible with a memory feature (${Array.from(MEMORY_FEATURE_TYPES).join(", ")}) in features[] — the backend rejects this combination with a 422.`,
      );
    }
    const payload = {
      name: input.name,
      description: input.description ?? null,
      agent_role: input.role,
      agent_goal: input.goal,
      agent_instructions: input.instructions,
      agent_context: input.agent_context ?? null,
      agent_output: input.agent_output ?? null,
      examples: input.examples ?? null,
      tools: input.tools ?? [],
      tool_usage_description: input.tool_usage_description ?? "{}",
      tool_configs: input.tool_configs ?? [],
      provider_id: resolved.providerId,
      model: input.model,
      temperature: input.temperature ?? 0.7,
      top_p: input.top_p ?? 0.9,
      llm_credential_id: input.llm_credential_id ?? resolved.credentialId,
      features: input.features ?? [],
      managed_agents: input.managed_agents ?? [],
      a2a_tools: input.a2a_tools ?? [],
      additional_model_params: input.additional_model_params ?? null,
      response_format: input.response_format ?? { type: "text" },
      store_messages: input.store_messages ?? true,
      file_output: input.file_output ?? false,
      disable_artifacts: input.disable_artifacts ?? false,
      voice_config: input.voice_config ?? null,
      image_output_config: input.image_output_config ?? null,
      max_iterations: input.max_iterations ?? 25,
      git_agent: input.git_agent ?? null,
      proxy_config: input.proxy_config ?? null,
      skills_catalog: input.skills_catalog ?? [],
      mcp_resources: input.mcp_resources ?? [],
      mcp_prompts: input.mcp_prompts ?? [],
    };
    return this.request<CreateAgentResult>("POST", "/v3/agents/", {
      body: payload,
      signal,
    });
  }

  /** Chat with an agent. POST /v3/inference/chat/ (agent_id in body). */
  chat(input: ChatInput, signal?: AbortSignal): Promise<ChatResult> {
    return this.request<ChatResult>("POST", "/v3/inference/chat/", {
      body: {
        agent_id: input.agent_id,
        session_id: input.session_id,
        message: input.message,
        user_id: input.user_id ?? "default_user",
      },
      signal,
    });
  }

  /** Streaming chat. POST /v3/inference/stream/ (SSE). Returns the full text. */
  async streamChat(
    input: ChatInput,
    onChunk: (delta: string) => void,
    signal?: AbortSignal,
  ): Promise<string> {
    const res = await this.fetchImpl(this.buildUrl("/v3/inference/stream/"), {
      method: "POST",
      headers: this.headers({ Accept: "text/event-stream" }),
      body: JSON.stringify({
        agent_id: input.agent_id,
        session_id: input.session_id,
        message: input.message,
        user_id: input.user_id ?? "default_user",
      }),
      signal,
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new LyzrApiError(res.status, text);
    }
    if (!res.body) {
      const text = await res.text();
      if (text) onChunk(text);
      return text;
    }

    let full = "";
    const handleLine = (line: string): boolean => {
      const trimmed = line.trim();
      if (!trimmed.startsWith("data:")) return false;
      const dataStr = trimmed.slice(5).trim();
      if (dataStr === "[DONE]") return true;
      let content = dataStr;
      try {
        const parsed = JSON.parse(dataStr) as Record<string, unknown>;
        content = String(parsed.content ?? parsed.delta ?? "");
      } catch {
      }
      if (content) {
        full += content;
        onChunk(content);
      }
      return false;
    };

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";
      for (const line of lines) {
        if (handleLine(line)) return full;
      }
    }
    if (buffer) handleLine(buffer);
    return full;
  }

  /** Start a long-running task. POST /v3/inference/task/ */
  startTask(input: ChatInput, signal?: AbortSignal): Promise<TaskSubmitResult> {
    return this.request<TaskSubmitResult>("POST", "/v3/inference/task/", {
      body: {
        agent_id: input.agent_id,
        session_id: input.session_id,
        message: input.message,
        user_id: input.user_id ?? "default_user",
      },
      signal,
    });
  }

  /** Poll a task. GET /v3/inference/task/{task_id} */
  getTaskStatus(
    taskId: string,
    signal?: AbortSignal,
  ): Promise<TaskStatusResult> {
    return this.request<TaskStatusResult>(
      "GET",
      `/v3/inference/task/${encodeURIComponent(taskId)}`,
      { signal },
    );
  }

  /** List agents. GET /v3/agents/ */
  async listAgents(signal?: AbortSignal): Promise<Agent[]> {
    const raw = await this.request<unknown>("GET", "/v3/agents/", { signal });
    return normalizeList<Agent>(raw, "agents");
  }

  /** Get one agent. GET /v3/agents/{agent_id} */
  getAgent(agentId: string, signal?: AbortSignal): Promise<Agent> {
    return this.request<Agent>(
      "GET",
      `/v3/agents/${encodeURIComponent(agentId)}`,
      { signal },
    );
  }

  /** Update an agent (GET -> merge -> PUT). Preserves unspecified fields. */
  async updateAgent(
    agentId: string,
    updates: UpdateAgentInput,
    signal?: AbortSignal,
  ): Promise<unknown> {
    const current = (await this.getAgent(agentId, signal)) as Record<
      string,
      unknown
    >;
    const pick = <T>(next: T | undefined, fallback: unknown): unknown =>
      next !== undefined ? next : fallback;

    // If tools changed without explicit tool_configs, resolve them ourselves — see resolveToolConfigs.
    const resolvedToolConfigs =
      updates.tools !== undefined && updates.tool_configs === undefined
        ? await this.resolveToolConfigs(updates.tools, signal)
        : undefined;

    // Provider/model used to be unconditionally frozen to current values, blocking model changes; resolve via PROVIDER_MAP when supplied.
    let providerId = current.provider_id;
    let llmCredentialId = current.llm_credential_id;
    let model = current.model;
    if (updates.provider !== undefined) {
      const resolved = PROVIDER_MAP[updates.provider.trim().toLowerCase()];
      if (!resolved) {
        throw new Error(
          `Unknown provider "${updates.provider}". Valid providers: ${KNOWN_PROVIDERS.join(", ")}`,
        );
      }
      providerId = resolved.providerId;
      llmCredentialId = updates.llm_credential_id ?? resolved.credentialId;
    }
    if (updates.model !== undefined) {
      model = updates.model;
    }

    const mergedFeatures = pick(updates.features, current.features ?? []) as
      | unknown[]
      | undefined;
    const storeMessages = pick(
      updates.store_messages,
      current.store_messages ?? true,
    );
    if (
      storeMessages === false &&
      Array.isArray(mergedFeatures) &&
      mergedFeatures.some(
        (f) =>
          typeof f === "object" &&
          f !== null &&
          MEMORY_FEATURE_TYPES.has(String((f as Record<string, unknown>).type)),
      )
    ) {
      throw new Error(
        `store_messages:false is incompatible with a memory feature (${Array.from(MEMORY_FEATURE_TYPES).join(", ")}) in features[] — the backend rejects this combination with a 422.`,
      );
    }

    const managedAgents = pick(
      updates.managed_agents,
      current.managed_agents ?? [],
    );
    if (
      Array.isArray(managedAgents) &&
      managedAgents.some(
        (m) =>
          typeof m === "object" &&
          m !== null &&
          (m as Record<string, unknown>).id === agentId,
      )
    ) {
      throw new Error(
        `managed_agents cannot reference the agent's own id ("${agentId}") — the backend rejects self-referencing managed_agents with a 400.`,
      );
    }

    const payload: Record<string, unknown> = {
      name: pick(updates.name, current.name),
      provider_id: providerId,
      model,
      temperature: pick(updates.temperature, current.temperature ?? 0.7),
      top_p: pick(updates.top_p, current.top_p ?? 0.9),
      description: pick(updates.description, current.description ?? null),
      agent_role: pick(updates.role, current.agent_role),
      agent_goal: pick(updates.goal, current.agent_goal),
      agent_instructions: pick(
        updates.instructions,
        current.agent_instructions,
      ),
      agent_context: pick(updates.agent_context, current.agent_context ?? null),
      agent_output: pick(updates.agent_output, current.agent_output ?? null),
      examples: pick(updates.examples, current.examples ?? null),
      tools: pick(
        resolvedToolConfigs?.tools ?? updates.tools,
        current.tools ?? [],
      ),
      tool_usage_description: pick(
        updates.tool_usage_description,
        current.tool_usage_description ?? "{}",
      ),
      tool_configs: pick(
        resolvedToolConfigs?.toolConfigs ?? updates.tool_configs,
        current.tool_configs ?? [],
      ),
      managed_agents: managedAgents,
      features: mergedFeatures,
      llm_credential_id: llmCredentialId,
      response_format: pick(
        updates.response_format,
        current.response_format ?? { type: "text" },
      ),
      store_messages: storeMessages,
      file_output: pick(updates.file_output, current.file_output ?? false),
      disable_artifacts: pick(
        updates.disable_artifacts,
        current.disable_artifacts ?? false,
      ),
      a2a_tools: pick(updates.a2a_tools, current.a2a_tools ?? []),
      voice_config: pick(updates.voice_config, current.voice_config ?? null),
      additional_model_params: pick(
        updates.additional_model_params,
        current.additional_model_params ?? null,
      ),
      image_output_config: pick(
        updates.image_output_config,
        current.image_output_config ?? null,
      ),
      max_iterations: pick(
        updates.max_iterations,
        current.max_iterations ?? 25,
      ),
      git_agent: pick(updates.git_agent, current.git_agent ?? null),
      proxy_config: pick(updates.proxy_config, current.proxy_config ?? null),
      skills_catalog: pick(
        updates.skills_catalog,
        current.skills_catalog ?? [],
      ),
      mcp_resources: pick(updates.mcp_resources, current.mcp_resources ?? []),
      mcp_prompts: pick(updates.mcp_prompts, current.mcp_prompts ?? []),
    };
    const result = await this.request<Record<string, unknown>>(
      "PUT",
      `/v3/agents/${encodeURIComponent(agentId)}`,
      { body: payload, signal },
    );
    // Surface resolved tools/tool_configs so the caller sees them without a second lyzr_get_agent call.
    if (updates.tools !== undefined) {
      return {
        ...result,
        tools: payload.tools,
        tool_configs: payload.tool_configs,
      };
    }
    return result;
  }

  /** Delete an agent. DELETE /v3/agents/{agent_id} */
  deleteAgent(agentId: string, signal?: AbortSignal): Promise<unknown> {
    return this.request<unknown>(
      "DELETE",
      `/v3/agents/${encodeURIComponent(agentId)}`,
      { signal },
    );
  }
}
