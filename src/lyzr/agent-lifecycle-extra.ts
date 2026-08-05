/**
 * Lyzr Agent lifecycle "extra" endpoints (host: agent-prod).
 * Status/lock toggles, bulk delete, org listing, versioning, clone/reassign/publish.
 */
import { LyzrHttp, normalizeList } from "./http.js";

export interface SetAgentStatusInput {
  is_active: boolean;
}

export interface SetAgentLockInput {
  is_locked: boolean;
  environment?: string | null;
}

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

export interface PublishAgentsInput {
  agent_ids: string[];
  access_level?: string;
}

export interface AgentVersion {
  version_id?: string;
  [key: string]: unknown;
}

export class AgentLifecycleExtraClient extends LyzrHttp {
  /** Set agent active/inactive status. PATCH /v3/agents/{agent_id}/status */
  setAgentStatus(
    agentId: string,
    input: SetAgentStatusInput,
    signal?: AbortSignal,
  ): Promise<unknown> {
    return this.request<unknown>(
      "PATCH",
      `/v3/agents/${encodeURIComponent(agentId)}/status`,
      { body: input, signal },
    );
  }

  /** Lock or unlock an agent. PATCH /v3/agents/{agent_id}/lock */
  setAgentLock(
    agentId: string,
    input: SetAgentLockInput,
    signal?: AbortSignal,
  ): Promise<unknown> {
    return this.request<unknown>(
      "PATCH",
      `/v3/agents/${encodeURIComponent(agentId)}/lock`,
      { body: input, signal },
    );
  }

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
  cloneAgent(
    input: CloneAgentInput,
    signal?: AbortSignal,
  ): Promise<unknown> {
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

  /** Publish one or more agents. POST /v3/agents/publish */
  publishAgents(
    input: PublishAgentsInput,
    signal?: AbortSignal,
  ): Promise<unknown> {
    const payload = {
      agent_ids: input.agent_ids,
      access_level: input.access_level ?? "public",
    };
    return this.request<unknown>("POST", "/v3/agents/publish", {
      body: payload,
      signal,
    });
  }
}
