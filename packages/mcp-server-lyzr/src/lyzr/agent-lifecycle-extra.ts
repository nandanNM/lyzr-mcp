/**
 * Lyzr Agent lifecycle "extra" endpoints (host: agent-prod).
 * Bulk delete, org listing, versioning, clone/reassign.
 *
 * NOTE: `PATCH .../status` and `PATCH .../lock` don't exist in the backend
 * (404/405 live). `POST /v3/agents/publish` exists but requires a
 * server-to-server `x-server-token` no MCP caller can supply (403 live).
 * All three were removed as unreachable rather than "fixed".
 */
import { LyzrHttp, normalizeList } from "./http.js";

export interface BulkDeleteInput {
  agent_ids: string[];
}

export interface OrgAgentsParams {
  search?: string;
  page?: number;
  limit?: number;
}

export interface CloneAgentInput {
  agent_id: string;
}

export interface ReassignAgentInput {
  agent_id: string;
  target_email: string;
}

export interface AgentVersion {
  version_id?: string;
  [key: string]: unknown;
}

export class AgentLifecycleExtraClient extends LyzrHttp {
  /** Bulk delete agents. POST /v3/agents/bulk-delete */
  bulkDeleteAgents(
    input: BulkDeleteInput,
    signal?: AbortSignal,
  ): Promise<unknown> {
    return this.request<unknown>("POST", "/v3/agents/bulk-delete", {
      body: input,
      signal,
    });
  }

  /** List agents for the org. GET /v3/agents/org */
  async listOrgAgents(
    params: OrgAgentsParams = {},
    signal?: AbortSignal,
  ): Promise<unknown[]> {
    const raw = await this.request<unknown>("GET", "/v3/agents/org", {
      params: {
        search: params.search,
        page: params.page,
        limit: params.limit,
      },
      signal,
    });
    return normalizeList<unknown>(raw, "agents");
  }

  /** List versions of an agent. GET /v3/agents/{agent_id}/versions */
  async listAgentVersions(
    agentId: string,
    signal?: AbortSignal,
  ): Promise<AgentVersion[]> {
    const raw = await this.request<unknown>(
      "GET",
      `/v3/agents/${encodeURIComponent(agentId)}/versions`,
      { signal },
    );
    return normalizeList<AgentVersion>(raw, "versions");
  }

  /** Get one version of an agent. GET /v3/agents/{agent_id}/versions/{version_id} */
  getAgentVersion(
    agentId: string,
    versionId: string,
    signal?: AbortSignal,
  ): Promise<AgentVersion> {
    return this.request<AgentVersion>(
      "GET",
      `/v3/agents/${encodeURIComponent(agentId)}/versions/${encodeURIComponent(versionId)}`,
      { signal },
    );
  }

  /** Activate an agent version. POST /v3/agents/{agent_id}/versions/{version_id}/activate */
  activateAgentVersion(
    agentId: string,
    versionId: string,
    signal?: AbortSignal,
  ): Promise<unknown> {
    return this.request<unknown>(
      "POST",
      `/v3/agents/${encodeURIComponent(agentId)}/versions/${encodeURIComponent(versionId)}/activate`,
      { signal },
    );
  }

  /** Clone an agent. POST /v3/agents/clone */
  cloneAgent(input: CloneAgentInput, signal?: AbortSignal): Promise<unknown> {
    return this.request<unknown>("POST", "/v3/agents/clone", {
      body: input,
      signal,
    });
  }

  /** Reassign an agent to another user. POST /v3/agents/reassign */
  reassignAgent(
    input: ReassignAgentInput,
    signal?: AbortSignal,
  ): Promise<unknown> {
    return this.request<unknown>("POST", "/v3/agents/reassign", {
      body: input,
      signal,
    });
  }

}
