/**
 * Lyzr Audit Logs client (host: agent-prod).
 * Organization/user/resource/session audit log queries, stats, activity
 * metrics (DAU/MAU), and auth event logging.
 */
import { LyzrHttp, LyzrApiError } from "./http.js";

export { LyzrApiError };

export type AuditAction =
  | "create"
  | "read"
  | "update"
  | "delete"
  | "execute"
  | "login"
  | "logout"
  | "access_denied"
  | "export"
  | "import"
  | "parse"
  | "train"
  | "upload"
  | "download"
  | "reset"
  | "share"
  | "auth"
  | "clone"
  | "add";

export type AuditResource =
  | "agent"
  | "api"
  | "voice_agent"
  | "tool"
  | "provider"
  | "session"
  | "message"
  | "knowledge_base"
  | "knowledge_base_credential"
  | "knowledge_graph"
  | "semantic_data_model"
  | "memory"
  | "artifact"
  | "workflow"
  | "credential"
  | "user"
  | "organization"
  | "api_key"
  | "inference"
  | "guardrail"
  | "rai_policy"
  | "hm_policy"
  | "folder"
  | "context"
  | "blueprint"
  | "environment"
  | "persona"
  | "scenario"
  | "simulation"
  | "job"
  | "evaluation";

export type AuditResult = "success" | "failure" | "blocked" | "partial";

export type AuditSeverity = "low" | "medium" | "high" | "critical";

export interface AuditLogEntry {
  _id: string;
  timestamp: string;
  actor: Record<string, unknown>;
  action: string;
  target: Record<string, unknown>;
  result: string;
  error_message?: string | null;
  session_id?: string | null;
  request_id?: string | null;
  permission_required?: string | null;
  changes?: unknown[] | null;
  guardrail_violations?: unknown[] | null;
  metadata?: Record<string, unknown> | null;
  severity: string;
  [key: string]: unknown;
}

export interface AuditLogListResult {
  logs: AuditLogEntry[];
  total: number;
  limit: number;
  offset: number;
  has_more: boolean;
  [key: string]: unknown;
}

export interface ListOrgAuditLogsInput {
  user_id?: string;
  action?: AuditAction;
  resource_type?: AuditResource;
  resource_id?: string;
  result?: AuditResult;
  severity?: AuditSeverity;
  start_time?: string;
  end_time?: string;
  session_id?: string;
  limit?: number;
  offset?: number;
}

export interface ListMyAuditLogsInput {
  action?: AuditAction;
  resource_type?: AuditResource;
  resource_id?: string;
  result?: AuditResult;
  start_time?: string;
  end_time?: string;
  limit?: number;
  offset?: number;
}

export interface ListUserAuditLogsInput {
  action?: AuditAction;
  resource_type?: AuditResource;
  result?: AuditResult;
  start_time?: string;
  end_time?: string;
  limit?: number;
  offset?: number;
}

export interface ListResourceAuditLogsInput {
  action?: AuditAction;
  result?: AuditResult;
  start_time?: string;
  end_time?: string;
  limit?: number;
  offset?: number;
}

export interface ListSessionAuditLogsInput {
  limit?: number;
  offset?: number;
}

export interface AuditStatsInput {
  start_time?: string;
  end_time?: string;
}

export interface AuditStatsResult {
  total_events: number;
  events_by_action: Record<string, number>;
  events_by_resource: Record<string, number>;
  events_by_result: Record<string, number>;
  events_by_severity: Record<string, number>;
  time_range?: Record<string, unknown> | null;
  [key: string]: unknown;
}

export interface ActivityMetricsResult {
  org_id: string;
  date: string;
  dau: number;
  mau: number;
  daily_active_rate: number;
  [key: string]: unknown;
}

export interface DAUResult {
  org_id: string;
  date: string;
  dau: number;
  [key: string]: unknown;
}

export interface MAUResult {
  org_id: string;
  month: string;
  mau: number;
  [key: string]: unknown;
}

export interface DAUTrendResult {
  org_id: string;
  days: number;
  trend: Array<Record<string, unknown>>;
  [key: string]: unknown;
}

export interface MAUTrendResult {
  org_id: string;
  months: number;
  trend: Array<Record<string, unknown>>;
  [key: string]: unknown;
}

export interface AuthEventInput {
  event_type: "login" | "logout";
  user_email?: string;
  metadata?: Record<string, unknown>;
}

export interface AuthEventResult {
  status: string;
  message: string;
  [key: string]: unknown;
}

export class AuditLogsClient extends LyzrHttp {
  /** Get organization audit logs. GET /v3/audit-logs/ */
  listOrgAuditLogs(
    input: ListOrgAuditLogsInput = {},
    signal?: AbortSignal,
  ): Promise<AuditLogListResult> {
    return this.request<AuditLogListResult>("GET", "/v3/audit-logs/", {
      params: { ...input },
      signal,
    });
  }

  /** Get my (current user's) audit logs. GET /v3/audit-logs/me */
  listMyAuditLogs(
    input: ListMyAuditLogsInput = {},
    signal?: AbortSignal,
  ): Promise<AuditLogListResult> {
    return this.request<AuditLogListResult>("GET", "/v3/audit-logs/me", {
      params: { ...input },
      signal,
    });
  }

  /** Get audit logs for a specific user. GET /v3/audit-logs/user/{user_id} */
  listUserAuditLogs(
    userId: string,
    input: ListUserAuditLogsInput = {},
    signal?: AbortSignal,
  ): Promise<AuditLogListResult> {
    return this.request<AuditLogListResult>(
      "GET",
      `/v3/audit-logs/user/${encodeURIComponent(userId)}`,
      { params: { ...input }, signal },
    );
  }

  /** Get audit logs for a specific resource. GET /v3/audit-logs/resource/{resource_type}/{resource_id} */
  listResourceAuditLogs(
    resourceType: AuditResource,
    resourceId: string,
    input: ListResourceAuditLogsInput = {},
    signal?: AbortSignal,
  ): Promise<AuditLogListResult> {
    return this.request<AuditLogListResult>(
      "GET",
      `/v3/audit-logs/resource/${encodeURIComponent(resourceType)}/${encodeURIComponent(resourceId)}`,
      { params: { ...input }, signal },
    );
  }

  /** Get audit logs for a specific session. GET /v3/audit-logs/session/{session_id} */
  listSessionAuditLogs(
    sessionId: string,
    input: ListSessionAuditLogsInput = {},
    signal?: AbortSignal,
  ): Promise<AuditLogListResult> {
    return this.request<AuditLogListResult>(
      "GET",
      `/v3/audit-logs/session/${encodeURIComponent(sessionId)}`,
      { params: { ...input }, signal },
    );
  }

  /** Get audit statistics. GET /v3/audit-logs/stats */
  getStats(
    input: AuditStatsInput = {},
    signal?: AbortSignal,
  ): Promise<AuditStatsResult> {
    return this.request<AuditStatsResult>("GET", "/v3/audit-logs/stats", {
      params: { ...input },
      signal,
    });
  }

  /** Get combined DAU/MAU activity metrics. GET /v3/audit-logs/activity/metrics */
  getActivityMetrics(
    date?: string,
    signal?: AbortSignal,
  ): Promise<ActivityMetricsResult> {
    return this.request<ActivityMetricsResult>(
      "GET",
      "/v3/audit-logs/activity/metrics",
      { params: { date }, signal },
    );
  }

  /** Get daily active users. GET /v3/audit-logs/activity/dau */
  getDau(date?: string, signal?: AbortSignal): Promise<DAUResult> {
    return this.request<DAUResult>("GET", "/v3/audit-logs/activity/dau", {
      params: { date },
      signal,
    });
  }

  /** Get monthly active users. GET /v3/audit-logs/activity/mau */
  getMau(date?: string, signal?: AbortSignal): Promise<MAUResult> {
    return this.request<MAUResult>("GET", "/v3/audit-logs/activity/mau", {
      params: { date },
      signal,
    });
  }

  /** Get DAU trend over a period. GET /v3/audit-logs/activity/dau/trend */
  getDauTrend(days?: number, signal?: AbortSignal): Promise<DAUTrendResult> {
    return this.request<DAUTrendResult>(
      "GET",
      "/v3/audit-logs/activity/dau/trend",
      { params: { days }, signal },
    );
  }

  /** Get MAU trend over a period. GET /v3/audit-logs/activity/mau/trend */
  getMauTrend(
    months?: number,
    signal?: AbortSignal,
  ): Promise<MAUTrendResult> {
    return this.request<MAUTrendResult>(
      "GET",
      "/v3/audit-logs/activity/mau/trend",
      { params: { months }, signal },
    );
  }

  /** Log an auth event (login/logout). POST /v3/audit-logs/event */
  logAuthEvent(
    input: AuthEventInput,
    signal?: AbortSignal,
  ): Promise<AuthEventResult> {
    return this.request<AuthEventResult>("POST", "/v3/audit-logs/event", {
      body: input,
      signal,
    });
  }

  /** Get a single audit log by id. GET /v3/audit-logs/{log_id} */
  getAuditLog(logId: string, signal?: AbortSignal): Promise<AuditLogEntry> {
    return this.request<AuditLogEntry>(
      "GET",
      `/v3/audit-logs/${encodeURIComponent(logId)}`,
      { signal },
    );
  }
}
