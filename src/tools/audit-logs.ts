import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { AuditLogsClient } from "../lyzr/audit-logs.js";

const txt = (data: unknown) => ({
  content: [
    {
      type: "text" as const,
      text: typeof data === "string" ? data : JSON.stringify(data, null, 2),
    },
  ],
});

const AUDIT_ACTIONS = [
  "create",
  "read",
  "update",
  "delete",
  "execute",
  "login",
  "logout",
  "access_denied",
  "export",
  "import",
  "parse",
  "train",
  "upload",
  "download",
  "reset",
  "share",
  "auth",
  "clone",
  "add",
] as const;

const AUDIT_RESOURCES = [
  "agent",
  "api",
  "voice_agent",
  "tool",
  "provider",
  "session",
  "message",
  "knowledge_base",
  "knowledge_base_credential",
  "knowledge_graph",
  "semantic_data_model",
  "memory",
  "artifact",
  "workflow",
  "credential",
  "user",
  "organization",
  "api_key",
  "inference",
  "guardrail",
  "rai_policy",
  "hm_policy",
  "folder",
  "context",
  "blueprint",
  "environment",
  "persona",
  "scenario",
  "simulation",
  "job",
  "evaluation",
] as const;

const AUDIT_RESULTS = ["success", "failure", "blocked", "partial"] as const;
const AUDIT_SEVERITIES = ["low", "medium", "high", "critical"] as const;

const actionSchema = z
  .enum(AUDIT_ACTIONS)
  .optional()
  .describe("Filter by action type");
const resourceTypeSchema = z
  .enum(AUDIT_RESOURCES)
  .optional()
  .describe("Filter by resource type");
const resultSchema = z
  .enum(AUDIT_RESULTS)
  .optional()
  .describe("Filter by result");
const startTimeSchema = z
  .string()
  .optional()
  .describe("Start time for time range filter (ISO 8601 date-time)");
const endTimeSchema = z
  .string()
  .optional()
  .describe("End time for time range filter (ISO 8601 date-time)");

/** Register the Audit Logs tools. */
export const registerAuditLogsTools = (
  server: McpServer,
  client: AuditLogsClient,
) => {
  server.registerTool(
    "lyzr_list_org_audit_logs",
    {
      title: "List Organization Audit Logs",
      description: "Get audit logs for the whole organization, with optional filters.",
      inputSchema: {
        user_id: z.string().optional().describe("Filter by specific user ID"),
        action: actionSchema,
        resource_type: resourceTypeSchema,
        resource_id: z.string().optional().describe("Filter by resource ID"),
        result: resultSchema,
        severity: z
          .enum(AUDIT_SEVERITIES)
          .optional()
          .describe("Filter by severity"),
        start_time: startTimeSchema,
        end_time: endTimeSchema,
        session_id: z.string().optional().describe("Filter by session ID"),
        limit: z
          .number()
          .int()
          .min(1)
          .max(1000)
          .optional()
          .describe("Maximum number of results (default 100)"),
        offset: z
          .number()
          .int()
          .min(0)
          .optional()
          .describe("Number of results to skip (default 0)"),
      },
      annotations: {
        readOnlyHint: true,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async (args, extra) => txt(await client.listOrgAuditLogs(args, extra.signal)),
  );

  server.registerTool(
    "lyzr_list_my_audit_logs",
    {
      title: "List My Audit Logs",
      description: "Get audit logs for the current authenticated user, with optional filters.",
      inputSchema: {
        action: actionSchema,
        resource_type: resourceTypeSchema,
        resource_id: z.string().optional().describe("Filter by resource ID"),
        result: resultSchema,
        start_time: startTimeSchema,
        end_time: endTimeSchema,
        limit: z
          .number()
          .int()
          .min(1)
          .max(1000)
          .optional()
          .describe("Maximum number of results (default 100)"),
        offset: z
          .number()
          .int()
          .min(0)
          .optional()
          .describe("Number of results to skip (default 0)"),
      },
      annotations: {
        readOnlyHint: true,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async (args, extra) => txt(await client.listMyAuditLogs(args, extra.signal)),
  );

  server.registerTool(
    "lyzr_list_user_audit_logs",
    {
      title: "List User Audit Logs",
      description: "Get audit logs for a specific user by ID, with optional filters.",
      inputSchema: {
        user_id: z.string().describe("The user ID whose audit logs to fetch"),
        action: actionSchema,
        resource_type: resourceTypeSchema,
        result: resultSchema,
        start_time: startTimeSchema,
        end_time: endTimeSchema,
        limit: z
          .number()
          .int()
          .min(1)
          .max(1000)
          .optional()
          .describe("Maximum number of results (default 100)"),
        offset: z
          .number()
          .int()
          .min(0)
          .optional()
          .describe("Number of results to skip (default 0)"),
      },
      annotations: {
        readOnlyHint: true,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ user_id, ...rest }, extra) =>
      txt(await client.listUserAuditLogs(user_id, rest, extra.signal)),
  );

  server.registerTool(
    "lyzr_list_resource_audit_logs",
    {
      title: "List Resource Audit Logs",
      description: "Get audit logs for a specific resource type and ID, with optional filters.",
      inputSchema: {
        resource_type: z
          .enum(AUDIT_RESOURCES)
          .describe("Resource type to fetch audit logs for"),
        resource_id: z.string().describe("Resource ID to fetch audit logs for"),
        action: actionSchema,
        result: resultSchema,
        start_time: startTimeSchema,
        end_time: endTimeSchema,
        limit: z
          .number()
          .int()
          .min(1)
          .max(500)
          .optional()
          .describe("Maximum number of results (default 50)"),
        offset: z
          .number()
          .int()
          .min(0)
          .optional()
          .describe("Number of results to skip (default 0)"),
      },
      annotations: {
        readOnlyHint: true,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ resource_type, resource_id, ...rest }, extra) =>
      txt(
        await client.listResourceAuditLogs(
          resource_type,
          resource_id,
          rest,
          extra.signal,
        ),
      ),
  );

  server.registerTool(
    "lyzr_list_session_audit_logs",
    {
      title: "List Session Audit Logs",
      description: "Get audit logs for a specific session ID.",
      inputSchema: {
        session_id: z.string().describe("Session ID to fetch audit logs for"),
        limit: z
          .number()
          .int()
          .min(1)
          .max(500)
          .optional()
          .describe("Maximum number of results (default 100)"),
        offset: z
          .number()
          .int()
          .min(0)
          .optional()
          .describe("Number of results to skip (default 0)"),
      },
      annotations: {
        readOnlyHint: true,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ session_id, ...rest }, extra) =>
      txt(await client.listSessionAuditLogs(session_id, rest, extra.signal)),
  );

  server.registerTool(
    "lyzr_get_audit_stats",
    {
      title: "Get Audit Stats",
      description: "Get aggregated audit log statistics for an optional time range.",
      inputSchema: {
        start_time: z
          .string()
          .optional()
          .describe("Start time for stats calculation (ISO 8601 date-time)"),
        end_time: z
          .string()
          .optional()
          .describe("End time for stats calculation (ISO 8601 date-time)"),
      },
      annotations: {
        readOnlyHint: true,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async (args, extra) => txt(await client.getStats(args, extra.signal)),
  );

  server.registerTool(
    "lyzr_get_activity_metrics",
    {
      title: "Get Activity Metrics",
      description: "Get combined DAU/MAU activity metrics for a given date (defaults to today UTC).",
      inputSchema: {
        date: z
          .string()
          .optional()
          .describe("Date to query, ISO 8601 date-time (defaults to today UTC)"),
      },
      annotations: {
        readOnlyHint: true,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ date }, extra) =>
      txt(await client.getActivityMetrics(date, extra.signal)),
  );

  server.registerTool(
    "lyzr_get_dau",
    {
      title: "Get Daily Active Users",
      description: "Get the daily active user count for a given date (defaults to today UTC).",
      inputSchema: {
        date: z
          .string()
          .optional()
          .describe("Date to query, ISO 8601 date-time (defaults to today UTC)"),
      },
      annotations: {
        readOnlyHint: true,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ date }, extra) => txt(await client.getDau(date, extra.signal)),
  );

  server.registerTool(
    "lyzr_get_mau",
    {
      title: "Get Monthly Active Users",
      description: "Get the monthly active user count for the month containing a given date (defaults to current month UTC).",
      inputSchema: {
        date: z
          .string()
          .optional()
          .describe(
            "Date within the month to query, ISO 8601 date-time (defaults to current month UTC)",
          ),
      },
      annotations: {
        readOnlyHint: true,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ date }, extra) => txt(await client.getMau(date, extra.signal)),
  );

  server.registerTool(
    "lyzr_get_dau_trend",
    {
      title: "Get DAU Trend",
      description: "Get the daily active users trend over the last N days.",
      inputSchema: {
        days: z
          .number()
          .int()
          .min(1)
          .max(90)
          .optional()
          .describe("Number of days to include in trend (default 7)"),
      },
      annotations: {
        readOnlyHint: true,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ days }, extra) => txt(await client.getDauTrend(days, extra.signal)),
  );

  server.registerTool(
    "lyzr_get_mau_trend",
    {
      title: "Get MAU Trend",
      description: "Get the monthly active users trend over the last N months.",
      inputSchema: {
        months: z
          .number()
          .int()
          .min(1)
          .max(24)
          .optional()
          .describe("Number of months to include in trend (default 6)"),
      },
      annotations: {
        readOnlyHint: true,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ months }, extra) =>
      txt(await client.getMauTrend(months, extra.signal)),
  );

  server.registerTool(
    "lyzr_log_auth_event",
    {
      title: "Log Auth Event",
      description: "Log a login or logout event from the frontend into the audit log.",
      inputSchema: {
        event_type: z
          .enum(["login", "logout"])
          .describe("Event type: 'login' or 'logout'"),
        user_email: z
          .string()
          .optional()
          .describe("User email or display name"),
        metadata: z
          .record(z.unknown())
          .optional()
          .describe("Additional metadata for the event"),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async (args, extra) => {
      const result = await client.logAuthEvent(args, extra.signal);
      return txt(`Logged ${args.event_type} event.\n\n${JSON.stringify(result, null, 2)}`);
    },
  );

  server.registerTool(
    "lyzr_get_audit_log",
    {
      title: "Get Audit Log By ID",
      description: "Fetch a single audit log entry by its id.",
      inputSchema: {
        log_id: z.string().describe("Audit log id"),
      },
      annotations: {
        readOnlyHint: true,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ log_id }, extra) => txt(await client.getAuditLog(log_id, extra.signal)),
  );
};
