import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { OpsClient } from "../lyzr/ops.js";

const txt = (data: unknown) => ({
  content: [
    {
      type: "text" as const,
      text: typeof data === "string" ? data : JSON.stringify(data, null, 2),
    },
  ],
});

/** Register the Ops (observability) tools. */
export const registerOpsTools = (server: McpServer, ops: OpsClient) => {
  server.registerTool(
    "lyzr_ops_generate_report",
    {
      title: "Generate Ops Report",
      description: "Generate an operations report for a date range.",
      inputSchema: {
        start_date: z.string().describe("Start date (YYYY-MM-DD)"),
        end_date: z.string().describe("End date (YYYY-MM-DD)"),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async ({ start_date, end_date }, extra) =>
      txt(await ops.generateReport({ start_date, end_date }, extra.signal)),
  );

  server.registerTool(
    "lyzr_ops_export_report_csv",
    {
      title: "Export Ops Report CSV",
      description: "Export an operations report as CSV for a date range.",
      inputSchema: {
        start_date: z.string().describe("Start date (YYYY-MM-DD)"),
        end_date: z.string().describe("End date (YYYY-MM-DD)"),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async ({ start_date, end_date }, extra) =>
      txt(await ops.exportReportCsv({ start_date, end_date }, extra.signal)),
  );

  server.registerTool(
    "lyzr_ops_get_dashboard",
    {
      title: "Get Ops Dashboard",
      description: "Fetch the operations dashboard for a date range, optionally scoped to one agent.",
      inputSchema: {
        start_date: z.string().describe("Start date-time (ISO 8601)"),
        end_date: z.string().describe("End date-time (ISO 8601)"),
        agent_id: z.string().optional().describe("Restrict to a single agent id"),
      },
      annotations: {
        readOnlyHint: true,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ start_date, end_date, agent_id }, extra) =>
      txt(await ops.getDashboard({ start_date, end_date, agent_id }, extra.signal)),
  );

  server.registerTool(
    "lyzr_ops_get_traces",
    {
      title: "List Ops Traces",
      description: "List execution traces, optionally filtered by agent and date range.",
      inputSchema: {
        agent_id: z.string().optional().describe("Restrict to a single agent id"),
        start_date: z.string().optional().describe("Start date-time (ISO 8601)"),
        end_date: z.string().optional().describe("End date-time (ISO 8601)"),
        page: z.number().int().optional().default(1).describe("Page number"),
        limit: z.number().int().optional().default(10).describe("Page size"),
        count: z.boolean().optional().default(false).describe("Include total count"),
      },
      annotations: {
        readOnlyHint: true,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async (args, extra) => txt(await ops.getTraces(args, extra.signal)),
  );

  server.registerTool(
    "lyzr_ops_get_trace",
    {
      title: "Get Ops Trace",
      description: "Fetch a single execution trace by id.",
      inputSchema: {
        trace_id: z.string().describe("Trace id"),
      },
      annotations: {
        readOnlyHint: true,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ trace_id }, extra) => txt(await ops.getTrace(trace_id, extra.signal)),
  );

  server.registerTool(
    "lyzr_ops_get_trace_run",
    {
      title: "Get Ops Trace Run",
      description: "Fetch a specific run within a trace.",
      inputSchema: {
        trace_id: z.string().describe("Trace id"),
        run_id: z.string().describe("Run id"),
      },
      annotations: {
        readOnlyHint: true,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ trace_id, run_id }, extra) =>
      txt(await ops.getTraceRun(trace_id, run_id, extra.signal)),
  );

  server.registerTool(
    "lyzr_ops_get_grouped_logs",
    {
      title: "Get Grouped Activity Logs",
      description: "Fetch grouped activity logs for a trace/run/log combination.",
      inputSchema: {
        trace_id: z.string().describe("Trace id"),
        run_id: z.string().describe("Run id"),
        log_id: z.string().describe("Log id"),
        page: z.number().int().optional().default(1).describe("Page number"),
        limit: z.number().int().optional().default(20).describe("Page size"),
      },
      annotations: {
        readOnlyHint: true,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async (args, extra) => txt(await ops.getGroupedLogs(args, extra.signal)),
  );

  server.registerTool(
    "lyzr_ops_get_agent_tool_logs",
    {
      title: "Get Agent Tool Logs",
      description: "Fetch agent tool logs for a trace/run/log/feature combination.",
      inputSchema: {
        trace_id: z.string().describe("Trace id"),
        run_id: z.string().describe("Run id"),
        log_id: z.string().describe("Log id"),
        feature: z.string().describe("Feature name"),
      },
      annotations: {
        readOnlyHint: true,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async (args, extra) => txt(await ops.getAgentToolLogs(args, extra.signal)),
  );
};
