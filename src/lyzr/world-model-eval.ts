/**
 * World Model evaluation-run + dashboard client — host: agent.
 * Endpoints/shapes confirmed against the openapi.json World Model v3 tag.
 */
import { LyzrHttp, normalizeList } from "./http.js";

/** Result shape for a single test case within an evaluation run (passthrough). */
export interface TestCaseResult {
  [key: string]: unknown;
}

/**
 * Input for creating an evaluation run. POST /v3/world_model/evaluation_runs
 *
 * The backend's `EvaluationRun` Pydantic model (api/factory/v3/evals/models.py)
 * has NO defaults for `status`, `selected_metrics`, `overall_progress`,
 * `is_running`, the five `*_test_cases` counters, `duration_ms`, or
 * `test_cases` — every one of them is required and a request missing any of
 * them 422s (confirmed live). They were previously typed `optional` here,
 * which let callers omit them and always fail.
 */
export interface CreateEvaluationRunInput {
  world_model_id: string;
  run_name: string;
  agent_id: string;
  agent_name: string;
  status: string;
  selected_metrics: string[];
  overall_progress: number;
  is_running: boolean;
  total_test_cases: number;
  completed_test_cases: number;
  failed_test_cases: number;
  running_test_cases: number;
  pending_test_cases: number;
  duration_ms: number;
  test_cases: TestCaseResult[];
  [key: string]: unknown;
}

/** An evaluation run's full record. */
export interface EvaluationRun {
  id?: string | null;
  world_model_id: string;
  run_name: string;
  agent_id: string;
  agent_name: string;
  status: string;
  selected_metrics: string[];
  overall_progress: number;
  is_running: boolean;
  total_test_cases: number;
  completed_test_cases: number;
  failed_test_cases: number;
  running_test_cases: number;
  pending_test_cases: number;
  duration_ms: number;
  created_at?: string | null;
  updated_at?: string | null;
  test_cases: TestCaseResult[];
  [key: string]: unknown;
}

export class WorldModelEvalClient extends LyzrHttp {
  /** Create an evaluation run. POST /v3/world_model/evaluation_runs */
  createEvaluationRun(
    input: CreateEvaluationRunInput,
    signal?: AbortSignal,
  ): Promise<EvaluationRun> {
    return this.request<EvaluationRun>(
      "POST",
      "/v3/world_model/evaluation_runs",
      {
        body: input,
        signal,
      },
    );
  }

  /** List evaluation runs for a world model. GET /v3/world_model/{world_model_id}/evaluation_runs */
  async listEvaluationRuns(
    worldModelId: string,
    signal?: AbortSignal,
  ): Promise<EvaluationRun[]> {
    const raw = await this.request<unknown>(
      "GET",
      `/v3/world_model/${encodeURIComponent(worldModelId)}/evaluation_runs`,
      { signal },
    );
    return normalizeList<EvaluationRun>(raw, "evaluation_runs", "runs");
  }

  /** Get an evaluation run by id. GET /v3/world_model/evaluation_run/{run_id} */
  getEvaluationRun(
    runId: string,
    signal?: AbortSignal,
  ): Promise<EvaluationRun> {
    return this.request<EvaluationRun>(
      "GET",
      `/v3/world_model/evaluation_run/${encodeURIComponent(runId)}`,
      { signal },
    );
  }

  /** Get the overall World Model dashboard. GET /v3/world_model/dashboard/overview */
  getDashboardOverview(signal?: AbortSignal): Promise<unknown> {
    return this.request<unknown>("GET", "/v3/world_model/dashboard/overview", {
      signal,
    });
  }

  /** Get the dashboard for a single world model. GET /v3/world_model/dashboard/world_model/{world_model_id} */
  getWorldModelDashboard(
    worldModelId: string,
    signal?: AbortSignal,
  ): Promise<unknown> {
    return this.request<unknown>(
      "GET",
      `/v3/world_model/dashboard/world_model/${encodeURIComponent(worldModelId)}`,
      { signal },
    );
  }
}
