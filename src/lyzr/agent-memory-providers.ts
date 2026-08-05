/**
 * Agent Memory Providers client (host: agent-prod, path prefix /v3/memory).
 *
 * Manages memory *provider* configuration (aws-agentcore, mem0, supermemory)
 * used by agents — credential validation, provisioning, and status. This is a
 * separate concern from the standalone Cognis memory host/API in memory.ts.
 */
import { LyzrHttp } from "./http.js";

/** Request to use an existing AWS AgentCore memory resource. */
export interface UseExistingMemoryInput {
  memory_id: string;
}

/** Request to provision a new AWS AgentCore memory resource. */
export interface ProvisionMemoryInput {
  memory_name: string;
  event_expiry_days?: number;
  memory_strategy?: string | null;
}

export class AgentMemoryProvidersClient extends LyzrHttp {
  /** List memory providers. GET /v3/memory/providers */
  listProviders(signal?: AbortSignal): Promise<unknown> {
    return this.request<unknown>("GET", "/v3/memory/providers", { signal });
  }

  /** Get a memory provider. GET /v3/memory/providers/{provider_id} */
  getProvider(providerId: string, signal?: AbortSignal): Promise<unknown> {
    return this.request<unknown>(
      "GET",
      `/v3/memory/providers/${encodeURIComponent(providerId)}`,
      { signal },
    );
  }

  /** Validate AWS AgentCore credentials and list memories. GET /v3/memory/aws-agentcore/{credential_id}/validate */
  validateAwsAgentcore(
    credentialId: string,
    signal?: AbortSignal,
  ): Promise<unknown> {
    return this.request<unknown>(
      "GET",
      `/v3/memory/aws-agentcore/${encodeURIComponent(credentialId)}/validate`,
      { signal },
    );
  }

  /** Get AWS AgentCore provisioning status. GET /v3/memory/aws-agentcore/{credential_id}/status */
  getAwsAgentcoreStatus(
    credentialId: string,
    signal?: AbortSignal,
  ): Promise<unknown> {
    return this.request<unknown>(
      "GET",
      `/v3/memory/aws-agentcore/${encodeURIComponent(credentialId)}/status`,
      { signal },
    );
  }

  /** List AWS AgentCore memory resources. GET /v3/memory/aws-agentcore/{credential_id}/resources */
  listAwsAgentcoreResources(
    credentialId: string,
    signal?: AbortSignal,
  ): Promise<unknown> {
    return this.request<unknown>(
      "GET",
      `/v3/memory/aws-agentcore/${encodeURIComponent(credentialId)}/resources`,
      { signal },
    );
  }

  /** Use an existing AWS AgentCore memory resource. POST /v3/memory/aws-agentcore/{credential_id}/use-existing */
  useExistingAwsAgentcoreMemory(
    credentialId: string,
    input: UseExistingMemoryInput,
    signal?: AbortSignal,
  ): Promise<unknown> {
    return this.request<unknown>(
      "POST",
      `/v3/memory/aws-agentcore/${encodeURIComponent(credentialId)}/use-existing`,
      { body: input, signal },
    );
  }

  /** Provision a new AWS AgentCore memory resource. POST /v3/memory/aws-agentcore/{credential_id}/provision */
  provisionAwsAgentcoreMemory(
    credentialId: string,
    input: ProvisionMemoryInput,
    signal?: AbortSignal,
  ): Promise<unknown> {
    return this.request<unknown>(
      "POST",
      `/v3/memory/aws-agentcore/${encodeURIComponent(credentialId)}/provision`,
      { body: input, signal },
    );
  }

  /** Delete the AWS AgentCore memory resource. DELETE /v3/memory/aws-agentcore/{credential_id}/aws-resource */
  deleteAwsAgentcoreResource(
    credentialId: string,
    signal?: AbortSignal,
  ): Promise<unknown> {
    return this.request<unknown>(
      "DELETE",
      `/v3/memory/aws-agentcore/${encodeURIComponent(credentialId)}/aws-resource`,
      { signal },
    );
  }

  /** Validate Mem0 credentials. GET /v3/memory/mem0/{credential_id}/validate */
  validateMem0(credentialId: string, signal?: AbortSignal): Promise<unknown> {
    return this.request<unknown>(
      "GET",
      `/v3/memory/mem0/${encodeURIComponent(credentialId)}/validate`,
      { signal },
    );
  }

  /** Get Mem0 status. GET /v3/memory/mem0/{credential_id}/status */
  getMem0Status(credentialId: string, signal?: AbortSignal): Promise<unknown> {
    return this.request<unknown>(
      "GET",
      `/v3/memory/mem0/${encodeURIComponent(credentialId)}/status`,
      { signal },
    );
  }

  /** Validate Supermemory credentials. GET /v3/memory/supermemory/{credential_id}/validate */
  validateSupermemory(
    credentialId: string,
    signal?: AbortSignal,
  ): Promise<unknown> {
    return this.request<unknown>(
      "GET",
      `/v3/memory/supermemory/${encodeURIComponent(credentialId)}/validate`,
      { signal },
    );
  }

  /** Get Supermemory status. GET /v3/memory/supermemory/{credential_id}/status */
  getSupermemoryStatus(
    credentialId: string,
    signal?: AbortSignal,
  ): Promise<unknown> {
    return this.request<unknown>(
      "GET",
      `/v3/memory/supermemory/${encodeURIComponent(credentialId)}/status`,
      { signal },
    );
  }
}
