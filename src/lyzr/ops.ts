/**
 * Lyzr Ops client (host: agent-prod).
 * Endpoints/shapes confirmed against the provided openapi tag JSON.
 */
import { LyzrHttp } from "./http.js";

export interface OpsReportRequest {
  start_date: string;
  end_date: string;
}

export interface OpsDetail {
  [key: string]: unknown;
}

export interface OpsReportResponse {
  report: OpsDetail[];
  [key: string]: unknown;
}

export interface OpsDashboardParams {
  start_date: string;
  end_date: string;
  agent_id?: string;
}

export interface OpsTracesParams {
  agent_id?: string;
  start_date?: string;
  end_date?: string;
  page?: number;
  limit?: number;
  count?: boolean;
}

export interface OpsGroupedLogsParams {
  trace_id: string;
  run_id: string;
  log_id: string;
  page?: number;
  limit?: number;
}

export interface OpsLogsParams {
  trace_id: string;
  run_id: string;
  log_id: string;
  feature: string;
}

export class OpsClient extends LyzrHttp {
  /** Generate an ops report. POST /v3/ops/report */
  generateReport(
    input: OpsReportRequest,
    signal?: AbortSignal,
  ): Promise<OpsReportResponse> {
    return this.request<OpsReportResponse>("POST", "/v3/ops/report", {
      body: input,
      signal,
    });
  }

  /** Export an ops report as CSV. POST /v3/ops/report_csv */
  exportReportCsv(
    input: OpsReportRequest,
    signal?: AbortSignal,
  ): Promise<unknown> {
    return this.request<unknown>("POST", "/v3/ops/report_csv", {
      body: input,
      signal,
    });
  }

  /** Get the ops dashboard. GET /v3/ops/dashboard */
  getDashboard(
    params: OpsDashboardParams,
    signal?: AbortSignal,
  ): Promise<unknown> {
    return this.request<unknown>("GET", "/v3/ops/dashboard", {
      params: {
        start_date: params.start_date,
        end_date: params.end_date,
        agent_id: params.agent_id,
      },
      signal,
    });
  }

  /** List traces. GET /v3/ops/traces */
  getTraces(
    params: OpsTracesParams = {},
    signal?: AbortSignal,
  ): Promise<unknown> {
    return this.request<unknown>("GET", "/v3/ops/traces", {
      params: {
        agent_id: params.agent_id,
        start_date: params.start_date,
        end_date: params.end_date,
        page: params.page,
        limit: params.limit,
        count: params.count,
      },
      signal,
    });
  }

  /** Get a single trace. GET /v3/ops/trace/{trace_id} */
  getTrace(traceId: string, signal?: AbortSignal): Promise<unknown> {
    return this.request<unknown>(
      "GET",
      `/v3/ops/trace/${encodeURIComponent(traceId)}`,
      { signal },
    );
  }

  /** Get a specific run within a trace. GET /v3/ops/trace/{trace_id}/run/{run_id} */
  getTraceRun(
    traceId: string,
    runId: string,
    signal?: AbortSignal,
  ): Promise<unknown> {
    return this.request<unknown>(
      "GET",
      `/v3/ops/trace/${encodeURIComponent(traceId)}/run/${encodeURIComponent(runId)}`,
      { signal },
    );
  }

  /** Get grouped activity logs. GET /v3/ops/grouped-logs */
  getGroupedLogs(
    params: OpsGroupedLogsParams,
    signal?: AbortSignal,
  ): Promise<unknown> {
    return this.request<unknown>("GET", "/v3/ops/grouped-logs", {
      params: {
        trace_id: params.trace_id,
        run_id: params.run_id,
        log_id: params.log_id,
        page: params.page,
        limit: params.limit,
      },
      signal,
    });
  }

  /** Get agent tool logs. GET /v3/ops/logs */
  getAgentToolLogs(
    params: OpsLogsParams,
    signal?: AbortSignal,
  ): Promise<unknown> {
    return this.request<unknown>("GET", "/v3/ops/logs", {
      params: {
        trace_id: params.trace_id,
        run_id: params.run_id,
        log_id: params.log_id,
        feature: params.feature,
      },
      signal,
    });
  }
}
