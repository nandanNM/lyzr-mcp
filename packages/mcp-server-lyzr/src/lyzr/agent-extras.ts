/**
 * Agent extras client — host: agent (agent-prod / agent-dev).
 *
 * Covers session lifecycle/history endpoints under /v1/sessions and /v1/agent,
 * plus a few agent utility/template endpoints under /v3/agents.
 * Request-body shapes (Session, SingleTaskAgentConfig) confirmed against the
 * agent service OpenAPI spec.
 */
import { LyzrHttp } from "./http.js";

/** Body for POST/PUT /v1/sessions (schema: Session). */
export interface SessionInput {
  /** Owner of the session (required). */
  user_id: string;
  /** Free-form session metadata (required by the schema; defaults to {}). */
  metadata?: Record<string, unknown>;
  /** Optional agent this session is bound to. */
  agent_id?: string;
  /** Any additional Session fields to merge into the body. */
  extra_fields?: Record<string, unknown>;
}

/** Body for POST/PUT /v3/agents/template/single-task (schema: SingleTaskAgentConfig). */
export interface SingleTaskAgentInput {
  /** Agent name (required). */
  name: string;
  /** LLM provider id, e.g. "openai" (required). */
  provider_id: string;
  /** Model name, e.g. "gpt-4o" (required). */
  model: string;
  /** Nucleus sampling probability (required). */
  top_p: number;
  /** Sampling temperature (required). */
  temperature: number;
  description?: string;
  agent_role?: string;
  agent_instructions?: string;
  agent_goal?: string;
  llm_credential_id?: string;
  /** Any additional SingleTaskAgentConfig fields to merge into the body. */
  extra_fields?: Record<string, unknown>;
}

const buildSessionBody = (input: SessionInput): Record<string, unknown> => {
  const body: Record<string, unknown> = {
    user_id: input.user_id,
    metadata: input.metadata ?? {},
  };
  if (input.agent_id !== undefined) body.agent_id = input.agent_id;
  return { ...body, ...(input.extra_fields ?? {}) };
};

const buildSingleTaskBody = (
  input: SingleTaskAgentInput,
): Record<string, unknown> => {
  const body: Record<string, unknown> = {
    name: input.name,
    provider_id: input.provider_id,
    model: input.model,
    top_p: input.top_p,
    temperature: input.temperature,
  };
  if (input.description !== undefined) body.description = input.description;
  if (input.agent_role !== undefined) body.agent_role = input.agent_role;
  if (input.agent_instructions !== undefined)
    body.agent_instructions = input.agent_instructions;
  if (input.agent_goal !== undefined) body.agent_goal = input.agent_goal;
  if (input.llm_credential_id !== undefined)
    body.llm_credential_id = input.llm_credential_id;
  return { ...body, ...(input.extra_fields ?? {}) };
};

export class AgentExtrasClient extends LyzrHttp {
  /** Create a session. POST /v1/sessions/ */
  createSession(input: SessionInput, signal?: AbortSignal): Promise<unknown> {
    return this.request<unknown>("POST", "/v1/sessions/", {
      body: buildSessionBody(input),
      signal,
    });
  }

  /** Create a session for an agent. POST /v1/sessions/{agent_id} */
  createSessionForAgent(
    agentId: string,
    input: SessionInput,
    signal?: AbortSignal,
  ): Promise<unknown> {
    return this.request<unknown>(
      "POST",
      `/v1/sessions/${encodeURIComponent(agentId)}`,
      { body: buildSessionBody(input), signal },
    );
  }

  /** Get a session. GET /v1/sessions/{session_id} */
  getSession(
    sessionId: string,
    timeout?: number,
    signal?: AbortSignal,
  ): Promise<unknown> {
    return this.request<unknown>(
      "GET",
      `/v1/sessions/${encodeURIComponent(sessionId)}`,
      { params: { timeout }, signal },
    );
  }

  /** Update a session. PUT /v1/sessions/{session_id} */
  updateSession(
    sessionId: string,
    input: SessionInput,
    signal?: AbortSignal,
  ): Promise<unknown> {
    return this.request<unknown>(
      "PUT",
      `/v1/sessions/${encodeURIComponent(sessionId)}`,
      { body: buildSessionBody(input), signal },
    );
  }

  /** Delete a session. DELETE /v1/sessions/{session_id} */
  deleteSession(sessionId: string, signal?: AbortSignal): Promise<unknown> {
    return this.request<unknown>(
      "DELETE",
      `/v1/sessions/${encodeURIComponent(sessionId)}`,
      { signal },
    );
  }

  /** Get a session's history for a specific agent. GET /v1/sessions/{session_id}/{agent_id}/history */
  getSessionHistoryByAgent(
    sessionId: string,
    agentId: string,
    unix?: boolean,
    signal?: AbortSignal,
  ): Promise<unknown> {
    return this.request<unknown>(
      "GET",
      `/v1/sessions/${encodeURIComponent(sessionId)}/${encodeURIComponent(agentId)}/history`,
      { params: { unix }, signal },
    );
  }

  /** Get a session's history. GET /v1/sessions/{session_id}/history */
  getSessionHistory(
    sessionId: string,
    unix?: boolean,
    signal?: AbortSignal,
  ): Promise<unknown> {
    return this.request<unknown>(
      "GET",
      `/v1/sessions/${encodeURIComponent(sessionId)}/history`,
      { params: { unix }, signal },
    );
  }

  /** Get a session's summary. GET /v1/sessions/{session_id}/summary */
  getSessionSummary(sessionId: string, signal?: AbortSignal): Promise<unknown> {
    return this.request<unknown>(
      "GET",
      `/v1/sessions/${encodeURIComponent(sessionId)}/summary`,
      { signal },
    );
  }

  /** Get a session's conversation. GET /v1/sessions/{session_id}/conversation */
  getSessionConversation(
    sessionId: string,
    signal?: AbortSignal,
  ): Promise<unknown> {
    return this.request<unknown>(
      "GET",
      `/v1/sessions/${encodeURIComponent(sessionId)}/conversation`,
      { signal },
    );
  }

  /** List sessions for an agent. GET /v1/agent/{agent_id}/sessions */
  getAgentSessions(agentId: string, signal?: AbortSignal): Promise<unknown> {
    return this.request<unknown>(
      "GET",
      `/v1/agent/${encodeURIComponent(agentId)}/sessions`,
      { signal },
    );
  }

  /** List published sessions for an agent. GET /v1/agent/{agent_id}/published/sessions */
  getAgentPublishedSessions(
    agentId: string,
    signal?: AbortSignal,
  ): Promise<unknown> {
    return this.request<unknown>(
      "GET",
      `/v1/agent/${encodeURIComponent(agentId)}/published/sessions`,
      { signal },
    );
  }

  /** Resolve an agent id by its name. GET /v3/agents/utility/by-name/{agent_name} */
  getAgentIdByName(agentName: string, signal?: AbortSignal): Promise<unknown> {
    return this.request<unknown>(
      "GET",
      `/v3/agents/utility/by-name/${encodeURIComponent(agentName)}`,
      { signal },
    );
  }

  /** Create a single-task template agent. POST /v3/agents/template/single-task */
  createSingleTaskAgent(
    input: SingleTaskAgentInput,
    signal?: AbortSignal,
  ): Promise<unknown> {
    return this.request<unknown>("POST", "/v3/agents/template/single-task", {
      body: buildSingleTaskBody(input),
      signal,
    });
  }

  /** Update a single-task template agent. PUT /v3/agents/template/single-task/{agent_id} */
  updateSingleTaskAgent(
    agentId: string,
    input: SingleTaskAgentInput,
    signal?: AbortSignal,
  ): Promise<unknown> {
    return this.request<unknown>(
      "PUT",
      `/v3/agents/template/single-task/${encodeURIComponent(agentId)}`,
      { body: buildSingleTaskBody(input), signal },
    );
  }
}
