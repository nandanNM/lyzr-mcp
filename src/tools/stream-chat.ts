import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { LyzrClient } from "../lyzr/client.js";

/**
 * Registers `lyzr_stream_chat` — like lyzr_chat but consumes the streaming
 * endpoint. Emits an MCP progress notification per chunk (when the client sent a
 * progressToken) and returns the full accumulated response.
 */
export const registerStreamChatTool = (
  server: McpServer,
  client: LyzrClient,
) => {
  server.registerTool(
    "lyzr_stream_chat",
    {
      title: "Stream Chat with Lyzr Agent",
      description:
        "Send a message to a Lyzr agent over the streaming endpoint; streams progress and returns the full response.",
      inputSchema: {
        agent_id: z.string().describe("The agent_id to chat with"),
        message: z.string().describe("The user message to send"),
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
      const progressToken = extra._meta?.progressToken;
      let chunkIndex = 0;

      const onChunk = (delta: string) => {
        if (progressToken === undefined) return;
        chunkIndex += 1;
        try {
          server.server
            .notification(
              {
                method: "notifications/progress",
                params: { progressToken, progress: chunkIndex, message: delta },
              },
              { relatedRequestId: extra.requestId },
            )
            .catch(() => {});
        } catch {
          // ignore progress delivery failures
        }
      };

      const full = await client.streamChat(
        { agent_id, message, session_id: sid, user_id },
        onChunk,
        extra.signal,
      );
      return { content: [{ type: "text", text: full || "(no content)" }] };
    },
  );
};
