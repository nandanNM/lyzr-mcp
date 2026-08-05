/**
 * Lyzr Inference "extra" endpoints (host: agent-prod) — tool execution, chat
 * tasks, voice/webrtc sessions, file chat, and the v4/OpenAI-compatible
 * inference surfaces. Basic chat/stream/task/generate-response live elsewhere
 * (see client.ts).
 */
import { LyzrHttp, LyzrApiError, normalizeList } from "./http.js";

export { LyzrApiError };

export interface ToolConfig {
  [key: string]: unknown;
}

export interface ToolExecuteInput {
  tool_name: string;
  agent_id?: string | null;
  tool_configs?: ToolConfig[];
  arguments?: Record<string, unknown>;
  trace_id?: string | null;
}

export interface ToolExecuteResult {
  tool_name: string;
  trace_id: string;
  result: unknown;
  [key: string]: unknown;
}

export interface ChatTaskInput {
  agent_id: string;
  session_id: string;
  message?: string | null;
  user_id?: string;
  messages?: Record<string, unknown>[] | null;
  [key: string]: unknown;
}

export interface TaskResponseResult {
  task_id: string;
  [key: string]: unknown;
}

export interface ChatTaskStatusResult {
  task_id: string;
  status: string;
  response?: Record<string, unknown> | null;
  error?: string | null;
  [key: string]: unknown;
}

export interface ChatWithFileInput {
  agent_id: string;
  session_id: string;
  message: string;
  user_id?: string;
  system_prompt_variables?: string;
  filter_variables?: string;
  features?: string | null;
  /** Base64-encoded file content, or a data: URI; sent as multipart form field "file". */
  file?: string | null;
  file_name?: string;
  file_content_type?: string;
}

export interface ChatCompletionsInput {
  messages: Record<string, unknown>[];
  stream?: boolean;
  [key: string]: unknown;
}

export interface SimpleChatCompletionsInput {
  model: string;
  messages: Record<string, unknown>[];
  temperature?: number;
  top_p?: number;
  credential_id?: string;
  session_id?: string;
  provider_id?: string;
}

export interface InferenceV4Input {
  model: string;
  input: string | Record<string, unknown>[];
  instructions?: string | null;
  stream?: boolean | null;
  temperature?: number | null;
  top_p?: number | null;
  max_output_tokens?: number | null;
  tools?: Record<string, unknown>[] | null;
  tool_choice?: string | Record<string, unknown> | null;
  text?: Record<string, unknown> | null;
  previous_response_id?: string | null;
  store?: boolean | null;
  user?: string | null;
  reasoning?: Record<string, unknown> | null;
  truncation?: string | null;
  include?: string[] | null;
  [key: string]: unknown;
}

export interface ChatCompletionV4Input {
  model: string;
  messages: Record<string, unknown>[];
  temperature?: number | null;
  top_p?: number | null;
  n?: number | null;
  stream?: boolean | null;
  stream_options?: Record<string, unknown> | null;
  stop?: string | string[] | null;
  max_tokens?: number | null;
  max_completion_tokens?: number | null;
  presence_penalty?: number | null;
  frequency_penalty?: number | null;
  tools?: Record<string, unknown>[] | null;
  tool_choice?: string | Record<string, unknown> | null;
  response_format?: Record<string, unknown> | null;
  seed?: number | null;
  user?: string | null;
  [key: string]: unknown;
}

export interface VoicesResult {
  [key: string]: unknown;
}

export class InferenceExtraClient extends LyzrHttp {
  /** Execute a tool. POST /v3/inference/tools/execute */
  executeTool(
    input: ToolExecuteInput,
    signal?: AbortSignal,
  ): Promise<ToolExecuteResult> {
    return this.request<ToolExecuteResult>(
      "POST",
      "/v3/inference/tools/execute",
      {
        body: {
          tool_name: input.tool_name,
          agent_id: input.agent_id ?? null,
          tool_configs: input.tool_configs ?? [],
          arguments: input.arguments ?? {},
          trace_id: input.trace_id ?? null,
        },
        signal,
      },
    );
  }

  /** Submit a chat task. POST /v3/inference/chat/task */
  submitChatTask(
    input: ChatTaskInput,
    signal?: AbortSignal,
  ): Promise<TaskResponseResult> {
    const { agent_id, session_id, message, user_id, messages, ...rest } = input;
    return this.request<TaskResponseResult>("POST", "/v3/inference/chat/task", {
      body: {
        agent_id,
        session_id,
        message: message ?? null,
        user_id: user_id ?? "default_user",
        messages: messages ?? null,
        ...rest,
      },
      signal,
    });
  }

  /** Get chat task status. GET /v3/inference/chat/task/{task_id} */
  getChatTaskStatus(
    taskId: string,
    signal?: AbortSignal,
  ): Promise<ChatTaskStatusResult> {
    return this.request<ChatTaskStatusResult>(
      "GET",
      `/v3/inference/chat/task/${encodeURIComponent(taskId)}`,
      { signal },
    );
  }

  /** Create a WebRTC voice session. POST /v3/inference/webrtc-session/{agent_id}/{voice_id} */
  createWebrtcSession(
    agentId: string,
    voiceId: string,
    signal?: AbortSignal,
  ): Promise<unknown> {
    return this.request<unknown>(
      "POST",
      `/v3/inference/webrtc-session/${encodeURIComponent(agentId)}/${encodeURIComponent(voiceId)}`,
      { signal },
    );
  }

  /** Chat with an agent, attaching a file. POST /v3/inference/chat/file (multipart/form-data) */
  async chatWithFile(
    input: ChatWithFileInput,
    signal?: AbortSignal,
  ): Promise<unknown> {
    const form = new FormData();
    form.append("agent_id", input.agent_id);
    form.append("session_id", input.session_id);
    form.append("message", input.message);
    form.append("user_id", input.user_id ?? "default_user");
    form.append(
      "system_prompt_variables",
      input.system_prompt_variables ?? "{}",
    );
    form.append("filter_variables", input.filter_variables ?? "{}");
    if (input.features !== undefined && input.features !== null) {
      form.append("features", input.features);
    }
    if (input.file) {
      const bytes = Buffer.from(input.file, "base64");
      const blob = new Blob([bytes], {
        type: input.file_content_type ?? "application/octet-stream",
      });
      form.append("file", blob, input.file_name ?? "file");
    }
    const res = await this.fetchImpl(this.buildUrl("/v3/inference/chat/file"), {
      method: "POST",
      headers: { "x-api-key": this.apiKey, Accept: "application/json" },
      body: form,
      signal,
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new LyzrApiError(res.status, text);
    }
    const text = await res.text();
    return text ? JSON.parse(text) : {};
  }

  /** Stop a session. POST /v3/inference/session/{session_id}/stop */
  stopSession(sessionId: string, signal?: AbortSignal): Promise<unknown> {
    return this.request<unknown>(
      "POST",
      `/v3/inference/session/${encodeURIComponent(sessionId)}/stop`,
      { signal },
    );
  }

  /** Start a session. POST /v3/inference/session/{session_id}/start */
  startSession(sessionId: string, signal?: AbortSignal): Promise<unknown> {
    return this.request<unknown>(
      "POST",
      `/v3/inference/session/${encodeURIComponent(sessionId)}/start`,
      { signal },
    );
  }

  /** List available ElevenLabs voices config. GET /v3/inference/voices/ */
  async listVoices(signal?: AbortSignal): Promise<unknown[]> {
    const raw = await this.request<unknown>("GET", "/v3/inference/voices/", {
      signal,
    });
    return normalizeList<unknown>(raw, "voices");
  }

  /** OpenAI-compatible chat completions for one agent. POST /v3/inference/{agent_id}/chat/completions */
  agentChatCompletions(
    agentId: string,
    input: ChatCompletionsInput,
    signal?: AbortSignal,
  ): Promise<unknown> {
    return this.request<unknown>(
      "POST",
      `/v3/inference/${encodeURIComponent(agentId)}/chat/completions`,
      { body: input, signal },
    );
  }

  /** Simple chat completions (no agent, model/provider chosen via query params). POST /v3/inference/chat/completions */
  simpleChatCompletions(
    input: SimpleChatCompletionsInput,
    signal?: AbortSignal,
  ): Promise<unknown> {
    const {
      model,
      messages,
      temperature,
      top_p,
      credential_id,
      session_id,
      provider_id,
    } = input;
    return this.request<unknown>("POST", "/v3/inference/chat/completions", {
      params: {
        model,
        temperature,
        top_p,
        credential_id,
        session_id,
        provider_id,
      },
      body: messages,
      signal,
    });
  }

  /** Create a v4 inference response (OpenAI Responses-style). POST /v4/inference */
  createInference(
    input: InferenceV4Input,
    signal?: AbortSignal,
  ): Promise<unknown> {
    return this.request<unknown>("POST", "/v4/inference", {
      body: input,
      signal,
    });
  }

  /** OpenAI-compatible v4 chat completions. POST /v4/chat/completions */
  chatCompletionsV4(
    input: ChatCompletionV4Input,
    signal?: AbortSignal,
  ): Promise<unknown> {
    return this.request<unknown>("POST", "/v4/chat/completions", {
      body: input,
      signal,
    });
  }

  /** OpenAI-compatible v4 responses endpoint. POST /v4/responses */
  createResponseV4(
    input: InferenceV4Input,
    signal?: AbortSignal,
  ): Promise<unknown> {
    return this.request<unknown>("POST", "/v4/responses", {
      body: input,
      signal,
    });
  }
}
