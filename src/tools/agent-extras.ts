import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { AgentExtrasClient } from "../lyzr/agent-extras.js";

const txt = (d: unknown) => ({
  content: [
    {
      type: "text" as const,
      text: typeof d === "string" ? d : JSON.stringify(d, null, 2),
    },
  ],
});

/** Session body fields shared by every session-writing tool (no agent_id). */
const sessionCoreShape = {
  user_id: z.string().describe("Owner of the session"),
  metadata: z
    .record(z.string(), z.any())
    .optional()
    .describe("Free-form session metadata (defaults to {})"),
  extra_fields: z
    .record(z.string(), z.any())
    .optional()
    .describe("Additional Session fields to merge into the body"),
};

/** Full Session request body shape, including optional agent_id (schema: Session). */
const sessionBodyShape = {
  ...sessionCoreShape,
  agent_id: z.string().optional().describe("Agent this session is bound to"),
};

/** Shared zod shape for a SingleTaskAgentConfig request body. */
const singleTaskBodyShape = {
  name: z.string().describe("Agent name"),
  provider_id: z.string().describe('LLM provider id, e.g. "openai"'),
  model: z.string().describe('Model name, e.g. "gpt-4o"'),
  top_p: z.number().describe("Nucleus sampling probability"),
  temperature: z.number().describe("Sampling temperature"),
  description: z.string().optional(),
  agent_role: z
    .string()
    .optional()
    .describe("System/role prompt for the agent"),
  agent_instructions: z
    .string()
    .optional()
    .describe("Task instructions for the agent"),
  agent_goal: z.string().optional().describe("The agent's goal"),
  llm_credential_id: z
    .string()
    .optional()
    .describe("Credential id for the LLM provider"),
  extra_fields: z
    .record(z.string(), z.any())
    .optional()
    .describe("Additional SingleTaskAgentConfig fields to merge into the body"),
};

/** Register the agent session/utility ("agent extras") tools. */
export const registerAgentExtrasTools = (
  server: McpServer,
  client: AgentExtrasClient,
) => {
  server.registerTool(
    "lyzr_session_create",
    {
      title: "Create Session",
      description: "Create a new session.",
      inputSchema: sessionBodyShape,
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
    "lyzr_session_create_for_agent",
    {
      title: "Create Session for Agent",
      description: "Create a new session bound to a specific agent.",
      inputSchema: {
        agent_id: z.string().describe("Agent id to create the session for"),
        ...sessionCoreShape,
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async ({ agent_id, ...body }, extra) =>
      txt(await client.createSessionForAgent(agent_id, body, extra.signal)),
  );

  server.registerTool(
    "lyzr_session_get",
    {
      title: "Get Session",
      description: "Fetch a session by id.",
      inputSchema: {
        session_id: z.string().describe("Session id"),
        timeout: z
          .number()
          .optional()
          .describe("Optional server-side wait timeout"),
      },
      annotations: {
        readOnlyHint: true,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ session_id, timeout }, extra) =>
      txt(await client.getSession(session_id, timeout, extra.signal)),
  );

  server.registerTool(
    "lyzr_session_update",
    {
      title: "Update Session",
      description: "Update an existing session by id.",
      inputSchema: {
        session_id: z.string().describe("Session id"),
        ...sessionBodyShape,
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ session_id, ...body }, extra) =>
      txt(await client.updateSession(session_id, body, extra.signal)),
  );

  server.registerTool(
    "lyzr_session_delete",
    {
      title: "Delete Session",
      description: "Permanently delete a session by id.",
      inputSchema: { session_id: z.string().describe("Session id") },
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
    "lyzr_session_history_by_agent",
    {
      title: "Get Session History by Agent",
      description: "Fetch a session's message history for a specific agent.",
      inputSchema: {
        session_id: z.string().describe("Session id"),
        agent_id: z.string().describe("Agent id"),
        unix: z
          .boolean()
          .optional()
          .describe("Return timestamps as unix epochs"),
      },
      annotations: {
        readOnlyHint: true,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ session_id, agent_id, unix }, extra) =>
      txt(
        await client.getSessionHistoryByAgent(
          session_id,
          agent_id,
          unix,
          extra.signal,
        ),
      ),
  );

  server.registerTool(
    "lyzr_session_history",
    {
      title: "Get Session History",
      description: "Fetch a session's message history.",
      inputSchema: {
        session_id: z.string().describe("Session id"),
        unix: z
          .boolean()
          .optional()
          .describe("Return timestamps as unix epochs"),
      },
      annotations: {
        readOnlyHint: true,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ session_id, unix }, extra) =>
      txt(await client.getSessionHistory(session_id, unix, extra.signal)),
  );

  server.registerTool(
    "lyzr_session_summary",
    {
      title: "Get Session Summary",
      description: "Fetch a session's summary.",
      inputSchema: { session_id: z.string().describe("Session id") },
      annotations: {
        readOnlyHint: true,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ session_id }, extra) =>
      txt(await client.getSessionSummary(session_id, extra.signal)),
  );

  server.registerTool(
    "lyzr_session_conversation",
    {
      title: "Get Session Conversation",
      description: "Fetch a session's conversation.",
      inputSchema: { session_id: z.string().describe("Session id") },
      annotations: {
        readOnlyHint: true,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ session_id }, extra) =>
      txt(await client.getSessionConversation(session_id, extra.signal)),
  );

  server.registerTool(
    "lyzr_agent_sessions",
    {
      title: "List Agent Sessions",
      description: "List sessions for an agent.",
      inputSchema: { agent_id: z.string().describe("Agent id") },
      annotations: {
        readOnlyHint: true,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ agent_id }, extra) =>
      txt(await client.getAgentSessions(agent_id, extra.signal)),
  );

  server.registerTool(
    "lyzr_agent_published_sessions",
    {
      title: "List Agent Published Sessions",
      description: "List published sessions for an agent.",
      inputSchema: { agent_id: z.string().describe("Agent id") },
      annotations: {
        readOnlyHint: true,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ agent_id }, extra) =>
      txt(await client.getAgentPublishedSessions(agent_id, extra.signal)),
  );

  server.registerTool(
    "lyzr_agent_id_by_name",
    {
      title: "Get Agent Id by Name",
      description: "Resolve an agent id by its name.",
      inputSchema: { agent_name: z.string().describe("Agent name") },
      annotations: {
        readOnlyHint: true,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ agent_name }, extra) =>
      txt(await client.getAgentIdByName(agent_name, extra.signal)),
  );

  server.registerTool(
    "lyzr_agent_create_single_task",
    {
      title: "Create Single-Task Agent",
      description: "Create a single-task template agent.",
      inputSchema: singleTaskBodyShape,
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async (args, extra) =>
      txt(await client.createSingleTaskAgent(args, extra.signal)),
  );

  server.registerTool(
    "lyzr_agent_update_single_task",
    {
      title: "Update Single-Task Agent",
      description: "Update a single-task template agent by id.",
      inputSchema: {
        agent_id: z.string().describe("Agent id to update"),
        ...singleTaskBodyShape,
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ agent_id, ...body }, extra) =>
      txt(await client.updateSingleTaskAgent(agent_id, body, extra.signal)),
  );
};
