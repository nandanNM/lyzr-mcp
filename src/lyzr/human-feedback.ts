/**
 * Lyzr Human Feedback + Tool Requests + Skills client (host: agent-prod).
 * Endpoints/shapes confirmed against the OpenAPI schema.
 */
import { LyzrHttp, LyzrApiError, normalizeList } from "./http.js";

export { LyzrApiError };

export type RequestType = "tool" | "mcp_server" | "skill" | "custom_integration";
export type Priority = "low" | "medium" | "high" | "blocker";

export interface CreateFeedbackInput {
  feedback: string;
  user_input: string;
  agent_output: string;
}

export interface CreateFeedbackResult {
  [key: string]: unknown;
}

export interface ToolRequestCreateInput {
  request_type: RequestType;
  name: string;
  description: string;
  use_case: string;
  priority: Priority;
  reference_urls?: string[];
}

export interface ToolRequestCreateResult {
  group_id: string;
  is_new_group: boolean;
  count: number;
  message: string;
  [key: string]: unknown;
}

export interface SharedSkill {
  [key: string]: unknown;
}

export interface SkillUsage {
  [key: string]: unknown;
}

export class HumanFeedbackClient extends LyzrHttp {
  /** Create human feedback for a RAG config. POST /v3/human_feedback/ */
  createFeedback(
    feedbackRagConfigId: string,
    input: CreateFeedbackInput,
    signal?: AbortSignal,
  ): Promise<CreateFeedbackResult> {
    return this.request<CreateFeedbackResult>("POST", "/v3/human_feedback/", {
      body: input,
      params: { feedback_rag_config_id: feedbackRagConfigId },
      signal,
    });
  }

  /** Create a tool/MCP server/skill/integration request. POST /v3/tool-requests */
  createToolRequest(
    input: ToolRequestCreateInput,
    signal?: AbortSignal,
  ): Promise<ToolRequestCreateResult> {
    return this.request<ToolRequestCreateResult>("POST", "/v3/tool-requests", {
      body: input,
      signal,
    });
  }

  /** List shared skills. GET /v3/skills/shared */
  async listSharedSkills(signal?: AbortSignal): Promise<SharedSkill[]> {
    const raw = await this.request<unknown>("GET", "/v3/skills/shared", {
      signal,
    });
    return normalizeList<SharedSkill>(raw, "skills");
  }

  /** Get usage stats for a skill. GET /v3/skills/{skill_id}/usage */
  getSkillUsage(skillId: string, signal?: AbortSignal): Promise<SkillUsage> {
    return this.request<SkillUsage>(
      "GET",
      `/v3/skills/${encodeURIComponent(skillId)}/usage`,
      { signal },
    );
  }
}
