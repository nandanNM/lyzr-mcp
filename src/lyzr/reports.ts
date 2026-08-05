/**
 * Lyzr Reports client (host: agent-prod).
 * Usage/billing report generation (async job) + status/list polling.
 */
import { LyzrHttp, LyzrApiError, normalizeList } from "./http.js";

export { LyzrApiError };

export type TimeframePreset =
  | "this_week"
  | "this_month"
  | "last_week"
  | "last_month"
  | "last_7d"
  | "last_30d"
  | "last_3_months"
  | "last_6_months"
  | "last_12_months"
  | "custom";

export type GroupByOption = "month" | "billing_cycle";

export type ReportType =
  | "usage_by_agent"
  | "usage_by_user"
  | "usage_by_model"
  | "usage_by_sub_account";

export type ReportStatus = "queued" | "running" | "ready" | "failed";

/** Shared fields across all usage-report request bodies. */
export interface BaseReportRequest {
  timeframe: TimeframePreset;
  start_date?: string | null;
  end_date?: string | null;
  group_by?: GroupByOption | null;
  [key: string]: unknown;
}

export interface UsageByAgentReportRequest extends BaseReportRequest {
  agent_type?: string | null;
  model?: string | null;
  created_by?: string | null;
  include_sub_orgs?: boolean;
}

export interface UsageByUserReportRequest extends BaseReportRequest {
  include_sub_orgs?: boolean;
}

export interface UsageByModelReportRequest extends BaseReportRequest {
  provider_id?: string | null;
  model?: string | null;
  include_sub_orgs?: boolean;
}

export interface UsageBySubAccountReportRequest extends BaseReportRequest {
  sub_org_id?: string | null;
}

export interface ReportJobResponse {
  job_id: string;
  status: ReportStatus;
  message: string;
  [key: string]: unknown;
}

export interface ReportJobStatusResponse {
  job_id: string;
  report_type: ReportType;
  status: ReportStatus;
  filters?: Record<string, unknown>;
  download_url?: string | null;
  expires_at?: string | null;
  error?: string | null;
  row_count?: number | null;
  requested_by_email?: string | null;
  created_at: string;
  completed_at?: string | null;
  [key: string]: unknown;
}

export interface ListReportsParams {
  skip?: number;
  limit?: number;
  report_type?: ReportType;
  status?: ReportStatus;
}

export interface ReportJobListResponse {
  jobs: ReportJobStatusResponse[];
  total: number;
  skip: number;
  limit: number;
}

export class ReportsClient extends LyzrHttp {
  /** Request a usage-by-agent report. POST /v3/reports/usage-by-agent */
  requestUsageByAgentReport(
    input: UsageByAgentReportRequest,
    signal?: AbortSignal,
  ): Promise<ReportJobResponse> {
    return this.request<ReportJobResponse>(
      "POST",
      "/v3/reports/usage-by-agent",
      { body: input, signal },
    );
  }

  /** Request a usage-by-user report. POST /v3/reports/usage-by-user */
  requestUsageByUserReport(
    input: UsageByUserReportRequest,
    signal?: AbortSignal,
  ): Promise<ReportJobResponse> {
    return this.request<ReportJobResponse>(
      "POST",
      "/v3/reports/usage-by-user",
      { body: input, signal },
    );
  }

  /** Request a usage-by-model report. POST /v3/reports/usage-by-model */
  requestUsageByModelReport(
    input: UsageByModelReportRequest,
    signal?: AbortSignal,
  ): Promise<ReportJobResponse> {
    return this.request<ReportJobResponse>(
      "POST",
      "/v3/reports/usage-by-model",
      { body: input, signal },
    );
  }

  /** Request a usage-by-sub-account report. POST /v3/reports/usage-by-sub-account */
  requestUsageBySubAccountReport(
    input: UsageBySubAccountReportRequest,
    signal?: AbortSignal,
  ): Promise<ReportJobResponse> {
    return this.request<ReportJobResponse>(
      "POST",
      "/v3/reports/usage-by-sub-account",
      { body: input, signal },
    );
  }

  /** Get report job status. GET /v3/reports/{job_id} */
  getReportStatus(
    jobId: string,
    signal?: AbortSignal,
  ): Promise<ReportJobStatusResponse> {
    return this.request<ReportJobStatusResponse>(
      "GET",
      `/v3/reports/${encodeURIComponent(jobId)}`,
      { signal },
    );
  }

  /** List report jobs. GET /v3/reports */
  async listReports(
    params: ListReportsParams = {},
    signal?: AbortSignal,
  ): Promise<ReportJobListResponse> {
    const raw = await this.request<unknown>("GET", "/v3/reports", {
      params: {
        skip: params.skip,
        limit: params.limit,
        report_type: params.report_type,
        status: params.status,
      },
      signal,
    });
    if (raw && typeof raw === "object" && "jobs" in (raw as object)) {
      return raw as ReportJobListResponse;
    }
    const jobs = normalizeList<ReportJobStatusResponse>(raw, "jobs");
    return { jobs, total: jobs.length, skip: params.skip ?? 0, limit: params.limit ?? 20 };
  }
}
