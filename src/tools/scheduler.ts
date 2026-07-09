import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { SchedulerClient } from "../lyzr/scheduler.js";

const txt = (data: unknown) => ({
  content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
});

/** Register the scheduler tools (cron-run agents). */
export const registerSchedulerTools = (
  server: McpServer,
  scheduler: SchedulerClient,
) => {
  server.registerTool(
    "lyzr_schedule_create",
    {
      title: "Create Schedule",
      description:
        "Schedule an agent to run on a cron expression (5 fields: minute hour day month weekday).",
      inputSchema: {
        user_id: z.string().describe("Owning user id"),
        agent_id: z.string().describe("Agent to run"),
        cron_expression: z
          .string()
          .describe("5-field cron, e.g. '0 9 * * 1' (9am every Monday)"),
        message: z
          .string()
          .optional()
          .describe("Message sent to the agent each run"),
        timezone: z.string().optional().describe("IANA timezone (default UTC)"),
        max_retries: z.number().int().min(0).max(5).optional(),
        retry_delay: z.number().int().min(10).max(3600).optional(),
      },
      annotations: {
        readOnlyHint: false,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async (args, extra) => txt(await scheduler.create(args, extra.signal)),
  );

  server.registerTool(
    "lyzr_schedule_list",
    {
      title: "List Schedules",
      description: "List schedules (optionally filtered by user_id).",
      inputSchema: { user_id: z.string().optional() },
      annotations: {
        readOnlyHint: true,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ user_id }, extra) =>
      txt(await scheduler.list(user_id, extra.signal)),
  );

  server.registerTool(
    "lyzr_schedule_get",
    {
      title: "Get Schedule",
      description: "Fetch a schedule by id.",
      inputSchema: { schedule_id: z.string() },
      annotations: {
        readOnlyHint: true,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ schedule_id }, extra) =>
      txt(await scheduler.get(schedule_id, extra.signal)),
  );

  server.registerTool(
    "lyzr_schedule_pause",
    {
      title: "Pause Schedule",
      description: "Pause a schedule.",
      inputSchema: { schedule_id: z.string() },
      annotations: {
        readOnlyHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ schedule_id }, extra) =>
      txt(await scheduler.pause(schedule_id, extra.signal)),
  );

  server.registerTool(
    "lyzr_schedule_resume",
    {
      title: "Resume Schedule",
      description: "Resume a paused schedule.",
      inputSchema: { schedule_id: z.string() },
      annotations: {
        readOnlyHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ schedule_id }, extra) =>
      txt(await scheduler.resume(schedule_id, extra.signal)),
  );

  server.registerTool(
    "lyzr_schedule_trigger",
    {
      title: "Trigger Schedule Now",
      description: "Run a schedule immediately (out of band).",
      inputSchema: { schedule_id: z.string() },
      annotations: {
        readOnlyHint: false,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async ({ schedule_id }, extra) =>
      txt(await scheduler.trigger(schedule_id, extra.signal)),
  );

  server.registerTool(
    "lyzr_schedule_delete",
    {
      title: "Delete Schedule",
      description: "Delete a schedule by id.",
      inputSchema: { schedule_id: z.string() },
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ schedule_id }, extra) =>
      txt(await scheduler.delete(schedule_id, extra.signal)),
  );
};
