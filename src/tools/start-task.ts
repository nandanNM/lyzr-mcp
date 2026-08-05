import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { LyzrClient } from "../lyzr/client.js";

/**
 * Registers `lyzr_start_task` — submits a long-running task and returns a
 * task_id to poll with `lyzr_get_task_status` (non-blocking).
 */
export const registerStartTaskTool = (
  server: McpServer,
  client: LyzrClient,
) => {
  server.registerTool(
    "lyzr_start_task",
    {
      title: "Start Lyzr Task",
      description:
        "Submit a long-running task to a Lyzr agent. Returns a task_id to poll with lyzr_get_task_status.",
      inputSchema: {
        agent_id: z.string().describe("The agent_id to run"),
        message: z.string().describe("The task prompt / message"),
        session_id: z
          .string()
          .optional()
          .describe("Conversation/session id for continuity"),
        user_id: z
          .string()
          .optional()
          .describe("End-user identifier (default: default_user)"),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async ({ agent_id, message, session_id, user_id }, extra) => {
      const sid = session_id ?? `mcp-${extra.requestId}`;
      const result = await client.startTask(
        { agent_id, message, session_id: sid, user_id },
        extra.signal,
      );
      return {
        content: [
          {
            type: "text",
            text: `Task started: \`${result.task_id}\` (status: ${result.status ?? "pending"}). Poll it with lyzr_get_task_status.\n\n${JSON.stringify(result, null, 2)}`,
          },
        ],
      };
    },
  );
};
