/**
 * RAI (Responsible-AI guardrails) client — host: rai-prod.
 * Endpoints/shapes confirmed against the lyzr-adk SDK.
 */
import { LyzrHttp } from "./http.js";

export interface CreatePolicyInput {
  name: string;
  description?: string;
  /** < 1.0 enables the toxicity check at that threshold; 1.0 (default) disables it. */
  toxicity_threshold?: number;
  prompt_injection?: boolean;
  nsfw_check?: boolean;
  nsfw_threshold?: number;
  banned_topics?: string[];
}

export class RaiClient extends LyzrHttp {
  /** Create a guardrail policy. POST /v1/rai/policies */
  createPolicy(
    input: CreatePolicyInput,
    signal?: AbortSignal,
  ): Promise<unknown> {
    const toxicity = input.toxicity_threshold ?? 1.0;
    const banned = input.banned_topics ?? [];
    const policy = {
      name: input.name,
      description: input.description ?? null,
      toxicity_check: { enabled: toxicity < 1.0, threshold: toxicity },
      prompt_injection: {
        enabled: input.prompt_injection ?? false,
        threshold: 0.3,
      },
      secrets_detection: { enabled: false, action: "mask" },
      pii_detection: { enabled: false, types: {}, custom_pii: [] },
      allowed_topics: { enabled: false, topics: [] },
      banned_topics: {
        enabled: banned.length > 0,
        topics: banned.map((name) => ({ name })),
      },
      keywords: { enabled: false, keywords: [] },
      nsfw_check: {
        enabled: input.nsfw_check ?? false,
        threshold: input.nsfw_threshold ?? 0.5,
        validation_method: "full",
      },
    };
    return this.request<unknown>("POST", "/v1/rai/policies", {
      body: policy,
      signal,
    });
  }

  /** List policies. GET /v1/rai/policies */
  listPolicies(signal?: AbortSignal): Promise<unknown> {
    return this.request<unknown>("GET", "/v1/rai/policies", { signal });
  }

  /** Get a policy. GET /v1/rai/policies/{id} */
  getPolicy(policyId: string, signal?: AbortSignal): Promise<unknown> {
    return this.request<unknown>(
      "GET",
      `/v1/rai/policies/${encodeURIComponent(policyId)}`,
      { signal },
    );
  }

  /** Delete a policy. DELETE /v1/rai/policies/{id} */
  deletePolicy(policyId: string, signal?: AbortSignal): Promise<unknown> {
    return this.request<unknown>(
      "DELETE",
      `/v1/rai/policies/${encodeURIComponent(policyId)}`,
      { signal },
    );
  }
}
