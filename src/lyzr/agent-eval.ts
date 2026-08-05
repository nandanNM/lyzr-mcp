/**
 * Lyzr Agent Eval client (host: agent-prod).
 * Endpoints confirmed against the v3 Agent Eval OpenAPI tag.
 */
import { LyzrHttp } from "./http.js";

/** A single eval case within an eval config. */
export interface AgentEval {
  id: string;
  purpose: string;
  user_input: string;
  expected_output: string;
  evaluation_notes: string;
  [key: string]: unknown;
}

/** Input for creating an agent eval config. */
export interface AgentEvalConfig {
  eval_name: string;
  agent_id: string;
  session_id: string;
  agent_eval_list: AgentEval[];
  [key: string]: unknown;
}

/** A single eval result within an eval result config. */
export interface AgentEvalResult {
  id: string;
  status: string;
  details: string;
  user_input: string;
  expected_output: string;
  actual_output: string;
  scorecard?: unknown;
  [key: string]: unknown;
}

/** Input for creating an agent eval result config. */
export interface AgentEvalResultConfig {
  agent_eval_id: string;
  agent_id: string;
  agent_eval_result_list: AgentEvalResult[];
  [key: string]: unknown;
}

export class AgentEvalClient extends LyzrHttp {
  /** Create an agent eval config. POST /v3/agent_eval/ */
  createAgentEval(
    input: AgentEvalConfig,
    signal?: AbortSignal,
  ): Promise<Record<string, unknown>> {
    return this.request<Record<string, unknown>>("POST", "/v3/agent_eval/", {
      body: input,
      signal,
    });
  }

  /** Get agent evals for an agent. GET /v3/agent_eval/?agent_id= */
  getAgentEval(
    agentId: string,
    signal?: AbortSignal,
  ): Promise<Record<string, unknown>[]> {
    return this.request<Record<string, unknown>[]>("GET", "/v3/agent_eval/", {
      params: { agent_id: agentId },
      signal,
    });
  }

  /** Create an agent eval result config. POST /v3/agent_eval/result */
  createAgentEvalResult(
    input: AgentEvalResultConfig,
    signal?: AbortSignal,
  ): Promise<Record<string, unknown>> {
    return this.request<Record<string, unknown>>(
      "POST",
      "/v3/agent_eval/result",
      { body: input, signal },
    );
  }

  /** Get agent eval results by eval id. GET /v3/agent_eval/result?agent_eval_id= */
  getAgentEvalResult(
    agentEvalId: string,
    signal?: AbortSignal,
  ): Promise<Record<string, unknown>[]> {
    return this.request<Record<string, unknown>[]>(
      "GET",
      "/v3/agent_eval/result",
      { params: { agent_eval_id: agentEvalId }, signal },
    );
  }

  /** Get agent eval results by agent id. GET /v3/agent_eval/result/agent?agent_id= */
  getAgentEvalResultByAgent(
    agentId: string,
    signal?: AbortSignal,
  ): Promise<Record<string, unknown>[]> {
    return this.request<Record<string, unknown>[]>(
      "GET",
      "/v3/agent_eval/result/agent",
      { params: { agent_id: agentId }, signal },
    );
  }
}
