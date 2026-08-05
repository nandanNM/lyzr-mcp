import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { LyzrClient } from "../lyzr/client.js";

/**
 * Registers `lyzr_get_task_status` — polls the status/result of a task started
 * with `lyzr_start_task`.
 */
export const registerGetTaskStatusTool = (
  server: McpServer,
  client: LyzrClient,
) => {
  server.registerTool(
    "lyzr_get_task_status",
    {
      title: "Get Lyzr Task Status",
      description:
        "Check the status and (when complete) result of a long-running Lyzr task.",
      inputSchema: {
        task_id: z.string().describe("The task_id returned by lyzr_start_task"),
      },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ task_id }, extra) => {
      const status = await client.getTaskStatus(task_id, extra.signal);
      return {
        content: [{ type: "text", text: JSON.stringify(status, null, 2) }],
      };
    },
  );
};
