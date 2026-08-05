/**
 * Lyzr Traces client (host: agent-prod).
 * Observability endpoints for agent execution traces, spans, and dashboard metrics.
 */
import { LyzrHttp, LyzrApiError, normalizeList } from "./http.js";

export { LyzrApiError };

export interface ListTracesParams {
  start_time?: string;
  end_time?: string;
  limit?: number;
  offset?: number;
  agent_id?: string;
  trace_id?: string;
  session_id?: string;
  query_user_id?: string;
  customer_id?: string;
  [key: string]: unknown;
}

export interface TraceSummary {
  trace_id: string;
  name: string;
  trace_start_time: string;
  trace_end_time: string;
  trace_duration: number;
  agent_id?: string | null;
  session_id?: string | null;
  action_cost?: number | null;
  llm_input_tokens?: number | null;
  llm_output_tokens?: number | null;
  total_spans: number;
  [key: string]: unknown;
}

export interface GanttSpan {
  [key: string]: unknown;
}

export interface TraceGanttChart {
  trace_id: string;
  total_duration_ms: number;
  start_time: string;
  end_time: string;
  span_tree: GanttSpan;
  [key: string]: unknown;
}

export interface TraceDetailedSummary {
  trace_id: string;
  agent_id?: string | null;
  agent_name?: string | null;
  git_branch?: string | null;
  customer_id?: string | null;
  llm_provider?: string | null;
  llm_model?: string | null;
  tool_call_count?: number;
  mcp_tool_call_count?: number;
  aci_tool_call_count?: number;
  total_input_tokens?: number;
  total_output_tokens?: number;
  total_tokens?: number;
  total_cost?: number;
  total_duration_ms?: number;
  [key: string]: unknown;
}

export interface DashboardMetricsParams {
  start_time?: string;
  end_time?: string;
  agent_id?: string;
  session_id?: string;
  query_user_id?: string;
  customer_id?: string;
  [key: string]: unknown;
}

export interface DailyMetrics {
  [key: string]: unknown;
}

export interface DashboardMetrics {
  daily_metrics: DailyMetrics[];
  total_credits_consumed: number;
  total_traces: number;
  total_spans: number;
  total_input_tokens: number;
  total_output_tokens: number;
  avg_latency_ms: number;
  avg_error_rate: number;
  [key: string]: unknown;
}

export class TracesClient extends LyzrHttp {
  /** List traces. GET /v3/traces */
  async listTraces(
    params?: ListTracesParams,
    signal?: AbortSignal,
  ): Promise<TraceSummary[]> {
    const raw = await this.request<unknown>("GET", "/v3/traces", {
      params,
      signal,
    });
    return normalizeList<TraceSummary>(raw, "traces");
  }

  /** Get a trace's Gantt chart. GET /v3/traces/{trace_id}/gantt */
  async getTraceGantt(
    traceId: string,
    signal?: AbortSignal,
  ): Promise<TraceGanttChart> {
    return this.request<TraceGanttChart>(
      "GET",
      `/v3/traces/${encodeURIComponent(traceId)}/gantt`,
      { signal },
    );
  }

  /** Get a trace's detailed summary. GET /v3/traces/{trace_id}/summary */
  async getTraceSummary(
    traceId: string,
    signal?: AbortSignal,
  ): Promise<TraceDetailedSummary> {
    return this.request<TraceDetailedSummary>(
      "GET",
      `/v3/traces/${encodeURIComponent(traceId)}/summary`,
      { signal },
    );
  }

  /** Trigger the kill switch for agents in a trace. POST /v3/traces/{trace_id}/kill-switch */
  async killSwitchTrace(
    traceId: string,
    signal?: AbortSignal,
  ): Promise<Record<string, unknown>> {
    return this.request<Record<string, unknown>>(
      "POST",
      `/v3/traces/${encodeURIComponent(traceId)}/kill-switch`,
      { signal },
    );
  }

  /** Get dashboard metrics. GET /v3/traces/dashboard */
  async getDashboardMetrics(
    params?: DashboardMetricsParams,
    signal?: AbortSignal,
  ): Promise<DashboardMetrics> {
    return this.request<DashboardMetrics>("GET", "/v3/traces/dashboard", {
      params,
      signal,
    });
  }

  /** Get trace details. GET /v3/traces/{trace_id} */
  async getTraceDetails(
    traceId: string,
    signal?: AbortSignal,
  ): Promise<unknown> {
    return this.request<unknown>(
      "GET",
      `/v3/traces/${encodeURIComponent(traceId)}`,
      { signal },
    );
  }
}
