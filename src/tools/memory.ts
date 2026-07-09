import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { MemoryClient } from "../lyzr/memory.js";

const txt = (data: unknown) => ({
  content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
});

const idFields = {
  owner_id: z.string().optional().describe("Owner/user id"),
  agent_id: z.string().optional().describe("Agent id"),
  session_id: z.string().optional().describe("Session id"),
};

/** Register the Cognis memory ("knowledge graph") tools. */
export const registerMemoryTools = (
  server: McpServer,
  memory: MemoryClient,
) => {
  server.registerTool(
    "lyzr_memory_add",
    {
      title: "Add Memory",
      description:
        "Store conversation messages in Cognis memory. At least one of owner_id/agent_id/session_id is required.",
      inputSchema: {
        messages: z
          .array(z.object({ role: z.string(), content: z.string() }))
          .min(1)
          .describe("Messages with role + content"),
        ...idFields,
      },
      annotations: {
        readOnlyHint: false,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async ({ messages, owner_id, agent_id, session_id }, extra) =>
      txt(
        await memory.add(
          messages,
          { owner_id, agent_id, session_id },
          extra.signal,
        ),
      ),
  );

  server.registerTool(
    "lyzr_memory_search",
    {
      title: "Search Memory",
      description: "Semantic search over stored memories.",
      inputSchema: {
        query: z.string().describe("Search query"),
        ...idFields,
        limit: z.number().int().min(1).optional(),
        cross_session: z
          .boolean()
          .optional()
          .describe("Search across sessions"),
      },
      annotations: {
        readOnlyHint: true,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async (
      { query, owner_id, agent_id, session_id, limit, cross_session },
      extra,
    ) =>
      txt(
        await memory.search(
          query,
          { owner_id, agent_id, session_id },
          { limit, cross_session },
          extra.signal,
        ),
      ),
  );

  server.registerTool(
    "lyzr_memory_list",
    {
      title: "List Memories",
      description: "List stored memories for the given identifiers.",
      inputSchema: {
        ...idFields,
        limit: z.number().int().min(1).optional(),
        offset: z.number().int().min(0).optional(),
        cross_session: z.boolean().optional(),
      },
      annotations: {
        readOnlyHint: true,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async (
      { owner_id, agent_id, session_id, limit, offset, cross_session },
      extra,
    ) =>
      txt(
        await memory.list(
          { owner_id, agent_id, session_id },
          { limit, offset, cross_session },
          extra.signal,
        ),
      ),
  );

  server.registerTool(
    "lyzr_memory_get",
    {
      title: "Get Memory",
      description: "Fetch a single memory record by id.",
      inputSchema: {
        memory_id: z.string().describe("Memory record id"),
        owner_id: z.string().optional(),
      },
      annotations: {
        readOnlyHint: true,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ memory_id, owner_id }, extra) =>
      txt(await memory.getMemory(memory_id, owner_id, extra.signal)),
  );

  server.registerTool(
    "lyzr_memory_update",
    {
      title: "Update Memory",
      description: "Update a memory record's content and/or metadata.",
      inputSchema: {
        memory_id: z.string().describe("Memory record id"),
        content: z.string().optional().describe("New content"),
        owner_id: z.string().optional(),
      },
      annotations: {
        readOnlyHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ memory_id, content, owner_id }, extra) =>
      txt(await memory.update(memory_id, { content, owner_id }, extra.signal)),
  );

  server.registerTool(
    "lyzr_memory_delete",
    {
      title: "Delete Memory",
      description: "Delete a memory record by id.",
      inputSchema: {
        memory_id: z.string().describe("Memory record id"),
        owner_id: z.string().optional(),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ memory_id, owner_id }, extra) =>
      txt(await memory.delete(memory_id, owner_id, extra.signal)),
  );
};
