import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { ReportsClient } from "../lyzr/reports.js";

const txt = (data: unknown) => ({
  content: [
    {
      type: "text" as const,
      text: typeof data === "string" ? data : JSON.stringify(data, null, 2),
    },
  ],
});

const TIMEFRAME_VALUES = [
  "this_week",
  "this_month",
  "last_week",
  "last_month",
  "last_7d",
  "last_30d",
  "last_3_months",
  "last_6_months",
  "last_12_months",
  "custom",
] as const;

const GROUP_BY_VALUES = ["month", "billing_cycle"] as const;

const REPORT_TYPE_VALUES = [
  "usage_by_agent",
  "usage_by_user",
  "usage_by_model",
  "usage_by_sub_account",
] as const;

const REPORT_STATUS_VALUES = ["queued", "running", "ready", "failed"] as const;

const timeframeSchema = z
  .enum(TIMEFRAME_VALUES)
  .describe(
    "Timeframe preset for the report window. Use 'custom' with start_date/end_date.",
  );

const baseReportFields = {
  timeframe: timeframeSchema,
  start_date: z
    .string()
    .optional()
    .describe("Start date (YYYY-MM-DD), required when timeframe is 'custom'"),
  end_date: z
    .string()
    .optional()
    .describe("End date (YYYY-MM-DD), required when timeframe is 'custom'"),
  group_by: z
    .enum(GROUP_BY_VALUES)
    .optional()
    .describe(
      "Optional row-splitting dimension: 'month' splits by calendar month, 'billing_cycle' splits by the org's subscription cycle. Omit for a single aggregated row per entity.",
    ),
};

/** Register the Reports tools. */
export const registerReportsTools = (
  server: McpServer,
  reports: ReportsClient,
) => {
  server.registerTool(
    "lyzr_report_usage_by_agent",
    {
      title: "Request Usage-By-Agent Report",
      description:
        "Request an async usage report broken down by agent. Returns a job_id; poll with lyzr_report_get_status.",
      inputSchema: {
        ...baseReportFields,
        agent_type: z.string().optional().describe("Filter by agent type"),
        model: z.string().optional().describe("Filter by model name"),
        created_by: z
          .string()
          .optional()
          .describe("user_id to filter agents by creator"),
        include_sub_orgs: z
          .boolean()
          .optional()
          .describe(
            "When true, include agents from the current org AND all its sub-orgs",
          ),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async (args, extra) =>
      txt(await reports.requestUsageByAgentReport(args, extra.signal)),
  );

  server.registerTool(
    "lyzr_report_usage_by_user",
    {
      title: "Request Usage-By-User Report",
      description:
        "Request an async usage report broken down by user. Returns a job_id; poll with lyzr_report_get_status.",
      inputSchema: {
        ...baseReportFields,
        include_sub_orgs: z
          .boolean()
          .optional()
          .describe(
            "When true, include usage from the current org AND all its sub-orgs",
          ),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async (args, extra) =>
      txt(await reports.requestUsageByUserReport(args, extra.signal)),
  );

  server.registerTool(
    "lyzr_report_usage_by_model",
    {
      title: "Request Usage-By-Model Report",
      description:
        "Request an async usage report broken down by model. Returns a job_id; poll with lyzr_report_get_status.",
      inputSchema: {
        ...baseReportFields,
        provider_id: z
          .string()
          .optional()
          .describe("Filter by LLM provider id"),
        model: z.string().optional().describe("Filter by model name"),
        include_sub_orgs: z
          .boolean()
          .optional()
          .describe(
            "When true, include usage from the current org AND all its sub-orgs",
          ),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async (args, extra) =>
      txt(await reports.requestUsageByModelReport(args, extra.signal)),
  );

  server.registerTool(
    "lyzr_report_usage_by_sub_account",
    {
      title: "Request Usage-By-Sub-Account Report",
      description:
        "Request an async usage report broken down by sub-account. Returns a job_id; poll with lyzr_report_get_status.",
      inputSchema: {
        ...baseReportFields,
        sub_org_id: z
          .string()
          .optional()
          .describe("Narrow to a single sub-account's organization_id"),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async (args, extra) =>
      txt(await reports.requestUsageBySubAccountReport(args, extra.signal)),
  );

  server.registerTool(
    "lyzr_report_get_status",
    {
      title: "Get Report Status",
      description:
        "Get the status of a report job, including a download_url once it is ready.",
      inputSchema: {
        job_id: z.string().describe("The report job id"),
      },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ job_id }, extra) =>
      txt(await reports.getReportStatus(job_id, extra.signal)),
  );

  server.registerTool(
    "lyzr_report_list",
    {
      title: "List Reports",
      description: "List report jobs, optionally filtered by type or status.",
      inputSchema: {
        skip: z
          .number()
          .int()
          .min(0)
          .optional()
          .describe("Number of jobs to skip (default 0)"),
        limit: z
          .number()
          .int()
          .min(1)
          .max(100)
          .optional()
          .describe("Max jobs to return (default 20, max 100)"),
        report_type: z
          .enum(REPORT_TYPE_VALUES)
          .optional()
          .describe("Filter by report type"),
        status: z
          .enum(REPORT_STATUS_VALUES)
          .optional()
          .describe("Filter by status"),
      },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async (args, extra) => txt(await reports.listReports(args, extra.signal)),
  );
};
