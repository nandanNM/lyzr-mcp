import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { LyzrClient } from "../lyzr/client.js";

/**
 * Registers `lyzr_chat` — sends a message to a Lyzr agent and returns its reply.
 * `session_id` gives conversation continuity; if omitted we derive one from the
 * MCP request id. `user_id` defaults to "default_user" (matches the SDK).
 */
export const registerChatTool = (server: McpServer, client: LyzrClient) => {
  server.registerTool(
    "lyzr_chat",
    {
      title: "Chat with Lyzr Agent",
      description: "Send a message to a Lyzr agent and get its response.",
      inputSchema: {
        agent_id: z.string().describe("The agent_id to chat with"),
        message: z.string().describe("The user message to send"),
        session_id: z
          .string()
          .optional()
          .describe("Conversation/session id for continuity across turns"),
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
      const result = await client.chat(
        { agent_id, message, session_id: sid, user_id },
        extra.signal,
      );
      const text =
        typeof result.response === "string"
          ? result.response
          : JSON.stringify(result, null, 2);
      return { content: [{ type: "text", text }] };
    },
  );
};
