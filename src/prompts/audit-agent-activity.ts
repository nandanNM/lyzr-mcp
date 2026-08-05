import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

/**
 * `audit_agent_activity` — produces a message that asks the model to pull an
 * agent's recent traces and audit-log activity and summarize anything notable.
 */
export const registerAuditAgentActivityPrompt = (server: McpServer) => {
  server.registerPrompt(
    "audit_agent_activity",
    {
      title: "Audit Agent Activity",
      description:
        "Pull an agent's recent traces + audit logs and summarize errors, latency, and notable events.",
      argsSchema: {
        agent_id: z.string().describe("The agent_id to audit"),
      },
    },
    ({ agent_id }) => ({
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text:
              `Audit recent activity for agent \`${agent_id}\`.\n` +
              `Use \`lyzr_list_traces\` (filtered to this agent if the tool supports it) and ` +
              `\`lyzr_list_resource_audit_logs\` to pull recent execution traces and audit ` +
              `events. Summarize: error rate, average latency, any destructive or unusual ` +
              `actions (deletes, publishes, credential changes), and whether anything needs ` +
              `follow-up (e.g. via \`lyzr_get_trace_summary\` on a failing trace).`,
          },
        },
      ],
    }),
  );
};
