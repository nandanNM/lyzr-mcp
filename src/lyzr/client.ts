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
}

export class LyzrClient extends LyzrHttp {
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
    const payload = {
      name: input.name,
      description: input.description ?? null,
      agent_role: input.role,
      agent_goal: input.goal,
      agent_instructions: input.instructions,
      examples: null,
      tools: [],
      tool_usage_description: "{}",
      tool_configs: [],
      provider_id: resolved.providerId,
      model: input.model,
      temperature: input.temperature ?? 0.7,
      top_p: input.top_p ?? 0.9,
      llm_credential_id: resolved.credentialId,
      features: [],
      managed_agents: [],
      a2a_tools: [],
      additional_model_params: null,
      response_format: { type: "text" },
      store_messages: true,
      file_output: false,
      image_output_config: null,
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
        // plain-text chunk
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

    const payload: Record<string, unknown> = {
      name: pick(updates.name, current.name),
      provider_id: current.provider_id,
      model: current.model,
      temperature: pick(updates.temperature, current.temperature ?? 0.7),
      top_p: pick(updates.top_p, current.top_p ?? 0.9),
      description: pick(updates.description, current.description ?? null),
      agent_role: pick(updates.role, current.agent_role),
      agent_goal: pick(updates.goal, current.agent_goal),
      agent_instructions: pick(
        updates.instructions,
        current.agent_instructions,
      ),
      examples: current.examples ?? null,
      tools: current.tools ?? [],
      tool_usage_description: current.tool_usage_description ?? "{}",
      tool_configs: current.tool_configs ?? [],
      managed_agents: current.managed_agents ?? [],
      features: current.features ?? [],
      llm_credential_id: current.llm_credential_id,
      store_messages: current.store_messages ?? true,
      file_output: current.file_output ?? false,
      image_output_config: current.image_output_config ?? null,
    };
    return this.request<unknown>(
      "PUT",
      `/v3/agents/${encodeURIComponent(agentId)}`,
      { body: payload, signal },
    );
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
