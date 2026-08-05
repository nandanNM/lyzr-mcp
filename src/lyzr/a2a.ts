/**
 * Lyzr A2A (Agent-to-Agent) client (host: agent).
 * Covers the "A2A Agents v3" management endpoints
 * (api/factory/v3/agents/a2a_endpoints.py). There is no "serve" router on
 * the backend that hosts an agent-card / JSON-RPC endpoint for *our*
 * registered agents — the backend only fetches the discovery card from the
 * *remote* agent's own base_url when creating/updating the record.
 */
import { LyzrHttp, LyzrApiError, normalizeList } from "./http.js";

export { LyzrApiError };

/**
 * Config for registering/updating an A2A agent record. Field set matches
 * `A2AAgentConfig` in api/factory/v3/agents/a2a_models.py — the backend
 * ignores unknown extra fields, so anything not listed there (e.g. an
 * `auth_type`/`credential_id`/`custom_tags` field) would silently do
 * nothing if sent.
 */
export interface A2AAgentConfig {
  agent_provider?: string | null;
  base_url: string;
  name?: string | null;
  description?: string | null;
  version?: string | null;
  protocol_version?: string | null;
  assistant_id?: string | null;
  a2a_tools?: string[];
  skills?: Record<string, unknown>[] | null;
  agent_type?: string | null;
  [key: string]: unknown;
}

export interface A2AAgent {
  agent_id?: string;
  _id?: string;
  [key: string]: unknown;
}

export interface A2AInferenceInput {
  message: string;
  context_id?: string | null;
}

export interface A2AInferenceResult {
  [key: string]: unknown;
}

export class A2AClient extends LyzrHttp {
  /** List A2A agents. GET /v3/a2a/agents/ */
  async listAgents(signal?: AbortSignal): Promise<A2AAgent[]> {
    const raw = await this.request<unknown>("GET", "/v3/a2a/agents/", {
      signal,
    });
    return normalizeList<A2AAgent>(raw, "agents");
  }

  /** Create an A2A agent. POST /v3/a2a/agents/ */
  createAgent(input: A2AAgentConfig, signal?: AbortSignal): Promise<A2AAgent> {
    return this.request<A2AAgent>("POST", "/v3/a2a/agents/", {
      body: input,
      signal,
    });
  }

  /** Get an A2A agent by id. GET /v3/a2a/agents/{agent_id} */
  getAgent(agentId: string, signal?: AbortSignal): Promise<A2AAgent> {
    return this.request<A2AAgent>(
      "GET",
      `/v3/a2a/agents/${encodeURIComponent(agentId)}`,
      { signal },
    );
  }

  /** Update an A2A agent. PUT /v3/a2a/agents/{agent_id} */
  updateAgent(
    agentId: string,
    input: A2AAgentConfig,
    signal?: AbortSignal,
  ): Promise<A2AAgent> {
    return this.request<A2AAgent>(
      "PUT",
      `/v3/a2a/agents/${encodeURIComponent(agentId)}`,
      { body: input, signal },
    );
  }

  /** Delete an A2A agent. DELETE /v3/a2a/agents/{agent_id} */
  deleteAgent(
    agentId: string,
    signal?: AbortSignal,
  ): Promise<Record<string, unknown>> {
    return this.request<Record<string, unknown>>(
      "DELETE",
      `/v3/a2a/agents/${encodeURIComponent(agentId)}`,
      { signal },
    );
  }

  /** Run inference against an A2A agent. POST /v3/a2a/agents/{agent_id}/infer */
  inferAgent(
    agentId: string,
    input: A2AInferenceInput,
    signal?: AbortSignal,
  ): Promise<A2AInferenceResult> {
    return this.request<A2AInferenceResult>(
      "POST",
      `/v3/a2a/agents/${encodeURIComponent(agentId)}/infer`,
      { body: input, signal },
    );
  }
}
