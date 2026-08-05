import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { TracesClient } from "../lyzr/traces.js";

const txt = (data: unknown) => ({
  content: [
    {
      type: "text" as const,
      text: typeof data === "string" ? data : JSON.stringify(data, null, 2),
    },
  ],
});

/** Register the Traces (observability) tools. */
export const registerTracesTools = (
  server: McpServer,
  traces: TracesClient,
) => {
  server.registerTool(
    "lyzr_list_traces",
    {
      title: "List Traces",
      description: "List agent execution traces, optionally filtered by time range, agent, session, user, or customer.",
      inputSchema: {
        start_time: z
          .string()
          .optional()
          .describe("Filter traces after this time (ISO 8601 date-time)"),
        end_time: z
          .string()
          .optional()
          .describe("Filter traces before this time (ISO 8601 date-time)"),
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
          .describe("Pagination offset (default 0)"),
        agent_id: z.string().optional().describe("Filter by agent ID"),
        trace_id: z.string().optional().describe("Filter by trace ID"),
        session_id: z.string().optional().describe("Filter by session ID"),
        query_user_id: z.string().optional().describe("Filter by user ID"),
        customer_id: z.string().optional().describe("Filter by customer ID"),
      },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async (args, extra) => txt(await traces.listTraces(args, extra.signal)),
  );

  server.registerTool(
    "lyzr_get_trace_gantt",
    {
      title: "Get Trace Gantt Chart",
      description: "Fetch the Gantt chart (span tree with timings) for a trace.",
      inputSchema: {
        trace_id: z.string().describe("Trace id"),
      },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ trace_id }, extra) =>
      txt(await traces.getTraceGantt(trace_id, extra.signal)),
  );

  server.registerTool(
    "lyzr_get_trace_summary",
    {
      title: "Get Trace Summary",
      description: "Fetch the detailed summary (agent, LLM, tool call, token, and cost info) for a trace.",
      inputSchema: {
        trace_id: z.string().describe("Trace id"),
      },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ trace_id }, extra) =>
      txt(await traces.getTraceSummary(trace_id, extra.signal)),
  );

  server.registerTool(
    "lyzr_kill_switch_trace",
    {
      title: "Kill Switch Trace Agents",
      description: "Trigger the kill switch to stop agents running under a trace.",
      inputSchema: {
        trace_id: z.string().describe("Trace id"),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async ({ trace_id }, extra) => {
      const result = await traces.killSwitchTrace(trace_id, extra.signal);
      return txt(`Kill switch triggered for trace ${trace_id}.\n${JSON.stringify(result, null, 2)}`);
    },
  );

  server.registerTool(
    "lyzr_get_traces_dashboard",
    {
      title: "Get Traces Dashboard Metrics",
      description: "Fetch aggregate dashboard metrics (credits, traces, spans, tokens, latency, error rate) across traces, optionally filtered.",
      inputSchema: {
        start_time: z
          .string()
          .optional()
          .describe("Filter traces after this time (ISO 8601 date-time)"),
        end_time: z
          .string()
          .optional()
          .describe("Filter traces before this time (ISO 8601 date-time)"),
        agent_id: z.string().optional().describe("Filter by agent ID"),
        session_id: z.string().optional().describe("Filter by session ID"),
        query_user_id: z.string().optional().describe("Filter by user ID"),
        customer_id: z.string().optional().describe("Filter by customer ID"),
      },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async (args, extra) =>
      txt(await traces.getDashboardMetrics(args, extra.signal)),
  );

  server.registerTool(
    "lyzr_get_trace_details",
    {
      title: "Get Trace Details",
      description: "Fetch raw details for a trace by id.",
      inputSchema: {
        trace_id: z.string().describe("Trace id"),
      },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ trace_id }, extra) =>
      txt(await traces.getTraceDetails(trace_id, extra.signal)),
  );
};
