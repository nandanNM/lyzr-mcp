import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { SessionsV3Client } from "../lyzr/sessions-v3.js";

const txt = (data: unknown) => ({
  content: [
    {
      type: "text" as const,
      text: typeof data === "string" ? data : JSON.stringify(data, null, 2),
    },
  ],
});

/** Register the Sessions v3 tools (/v3/sessions). */
export const registerSessionsV3Tools = (
  server: McpServer,
  client: SessionsV3Client,
) => {
  server.registerTool(
    "lyzr_session3_create",
    {
      title: "Create Session (v3)",
      description: "Create a new v3 session, optionally tied to an agent.",
      inputSchema: {
        session_id: z.string().describe("Unique id for the new session"),
        agent_id: z
          .string()
          .nullable()
          .optional()
          .describe("Agent id this session belongs to"),
        metadata: z
          .record(z.unknown())
          .optional()
          .describe("Arbitrary metadata to attach to the session"),
        source: z
          .literal("playground")
          .nullable()
          .optional()
          .describe("Session source, e.g. 'playground'"),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async (args, extra) => txt(await client.createSession(args, extra.signal)),
  );

  server.registerTool(
    "lyzr_session3_list",
    {
      title: "List Sessions (v3)",
      description: "List v3 sessions, optionally filtered by agent or source.",
      inputSchema: {
        agent_id: z
          .string()
          .nullable()
          .optional()
          .describe("Filter by agent ID"),
        source: z
          .literal("playground")
          .nullable()
          .optional()
          .describe("Filter by session source (e.g. 'playground')"),
        limit: z
          .number()
          .int()
          .min(1)
          .max(100)
          .optional()
          .describe("Max results to return (default 20)"),
        offset: z
          .number()
          .int()
          .min(0)
          .optional()
          .describe("Pagination offset (default 0)"),
      },
      annotations: {
        readOnlyHint: true,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async (args, extra) => txt(await client.listSessions(args, extra.signal)),
  );

  server.registerTool(
    "lyzr_session3_get",
    {
      title: "Get Session (v3)",
      description: "Fetch a v3 session by id.",
      inputSchema: {
        session_id: z.string().describe("Session id to fetch"),
      },
      annotations: {
        readOnlyHint: true,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ session_id }, extra) =>
      txt(await client.getSession(session_id, extra.signal)),
  );

  server.registerTool(
    "lyzr_session3_update",
    {
      title: "Update Session (v3)",
      description: "Update a v3 session's metadata.",
      inputSchema: {
        session_id: z.string().describe("Session id to update"),
        metadata: z
          .record(z.unknown())
          .describe("Metadata to set on the session"),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async ({ session_id, metadata }, extra) =>
      txt(await client.updateSession(session_id, { metadata }, extra.signal)),
  );

  server.registerTool(
    "lyzr_session3_delete",
    {
      title: "Delete Session (v3)",
      description: "Permanently delete a v3 session by id.",
      inputSchema: {
        session_id: z.string().describe("Session id to delete"),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ session_id }, extra) =>
      txt(await client.deleteSession(session_id, extra.signal)),
  );

  server.registerTool(
    "lyzr_session3_list_messages",
    {
      title: "List Session Messages (v3)",
      description: "List messages in a v3 session, with optional filters.",
      inputSchema: {
        session_id: z.string().describe("Session id"),
        limit: z
          .number()
          .int()
          .min(1)
          .max(100)
          .optional()
          .describe("Max results to return (default 20)"),
        offset: z
          .number()
          .int()
          .min(0)
          .optional()
          .describe("Pagination offset (default 0)"),
        role: z
          .string()
          .nullable()
          .optional()
          .describe("Filter by message role (e.g. user, assistant)"),
        after: z
          .string()
          .nullable()
          .optional()
          .describe(
            "Only return messages with created_at after this ISO timestamp",
          ),
      },
      annotations: {
        readOnlyHint: true,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ session_id, ...params }, extra) =>
      txt(await client.listMessages(session_id, params, extra.signal)),
  );

  server.registerTool(
    "lyzr_session3_branch",
    {
      title: "Branch Session (v3)",
      description: "Branch a v3 session off from a specific message.",
      inputSchema: {
        session_id: z.string().describe("Session id to branch from"),
        from_message_id: z
          .string()
          .describe("Message id the new branch starts from"),
        new_session_id: z
          .string()
          .nullable()
          .optional()
          .describe("Id to assign to the new branched session"),
        branch_name: z
          .string()
          .nullable()
          .optional()
          .describe("Human-readable name for the branch"),
        metadata: z
          .record(z.unknown())
          .optional()
          .describe("Metadata to attach to the new branch"),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async ({ session_id, ...body }, extra) =>
      txt(await client.branchSession(session_id, body, extra.signal)),
  );

  server.registerTool(
    "lyzr_session3_list_branches",
    {
      title: "List Session Branches (v3)",
      description: "List the branches created from a v3 session.",
      inputSchema: {
        session_id: z.string().describe("Session id"),
      },
      annotations: {
        readOnlyHint: true,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ session_id }, extra) =>
      txt(await client.listBranches(session_id, extra.signal)),
  );

  server.registerTool(
    "lyzr_session3_tree",
    {
      title: "Get Session Tree (v3)",
      description: "Get the full branch tree rooted at a v3 session.",
      inputSchema: {
        session_id: z.string().describe("Session id (any node in the tree)"),
      },
      annotations: {
        readOnlyHint: true,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ session_id }, extra) =>
      txt(await client.getSessionTree(session_id, extra.signal)),
  );

  server.registerTool(
    "lyzr_session3_ancestry",
    {
      title: "Get Session Ancestry (v3)",
      description: "Get the ancestry chain of a v3 session, root to leaf.",
      inputSchema: {
        session_id: z.string().describe("Session id to trace ancestry for"),
      },
      annotations: {
        readOnlyHint: true,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ session_id }, extra) =>
      txt(await client.getSessionAncestry(session_id, extra.signal)),
  );
};
