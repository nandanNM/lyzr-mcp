import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { A2AClient } from "../lyzr/a2a.js";

const txt = (data: unknown) => ({
  content: [
    {
      type: "text" as const,
      text: typeof data === "string" ? data : JSON.stringify(data, null, 2),
    },
  ],
});

const a2aAgentConfigSchema = {
  base_url: z
    .string()
    .url()
    .describe("Base URL of the remote A2A agent"),
  agent_provider: z
    .string()
    .optional()
    .describe("Provider of the remote agent"),
  agent_card_path: z
    .string()
    .optional()
    .describe("Path to the agent card, relative to base_url"),
  name: z.string().optional().describe("Agent name"),
  description: z.string().optional().describe("Agent description"),
  version: z.string().optional().describe("Agent version"),
  protocol_version: z.string().optional().describe("A2A protocol version"),
  assistant_id: z.string().optional().describe("Assistant id"),
  a2a_tools: z
    .array(z.string())
    .optional()
    .describe("Tool names exposed by the A2A agent"),
  skills: z
    .array(z.record(z.unknown()))
    .optional()
    .describe("Skill definitions advertised by the agent"),
  agent_type: z
    .string()
    .optional()
    .describe("Agent type, defaults to 'a2a'"),
  auth_type: z.string().optional().describe("Authentication type"),
  credential_id: z
    .string()
    .optional()
    .describe("Credential id used to authenticate with the remote agent"),
  custom_tags: z
    .array(z.string())
    .optional()
    .describe("Custom tags for the agent"),
  custom_metadata: z
    .string()
    .optional()
    .describe("Custom metadata (string, e.g. JSON-encoded)"),
};

/** Register the A2A (Agent-to-Agent) tools. */
export const registerA2ATools = (server: McpServer, client: A2AClient) => {
  server.registerTool(
    "lyzr_list_a2a_agents",
    {
      title: "List A2A Agents",
      description: "List all registered A2A (agent-to-agent) agents.",
      inputSchema: {},
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async (_args, extra) => txt(await client.listAgents(extra.signal)),
  );

  server.registerTool(
    "lyzr_create_a2a_agent",
    {
      title: "Create A2A Agent",
      description:
        "Register a new A2A agent record pointing at a remote agent's base URL.",
      inputSchema: a2aAgentConfigSchema,
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async (args, extra) => txt(await client.createAgent(args, extra.signal)),
  );

  server.registerTool(
    "lyzr_get_a2a_agent",
    {
      title: "Get A2A Agent",
      description: "Fetch a registered A2A agent record by id.",
      inputSchema: {
        agent_id: z.string().describe("The A2A agent id"),
      },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ agent_id }, extra) =>
      txt(await client.getAgent(agent_id, extra.signal)),
  );

  server.registerTool(
    "lyzr_update_a2a_agent",
    {
      title: "Update A2A Agent",
      description: "Update an existing A2A agent record.",
      inputSchema: {
        agent_id: z.string().describe("The A2A agent id to update"),
        ...a2aAgentConfigSchema,
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ agent_id, ...updates }, extra) =>
      txt(await client.updateAgent(agent_id, updates, extra.signal)),
  );

  server.registerTool(
    "lyzr_delete_a2a_agent",
    {
      title: "Delete A2A Agent",
      description: "Permanently delete an A2A agent record by id.",
      inputSchema: {
        agent_id: z.string().describe("The A2A agent id to delete"),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ agent_id }, extra) =>
      txt(await client.deleteAgent(agent_id, extra.signal)),
  );

  server.registerTool(
    "lyzr_infer_a2a_agent",
    {
      title: "Infer A2A Agent",
      description: "Send a message to a registered A2A agent and get its response.",
      inputSchema: {
        agent_id: z.string().describe("The A2A agent id to infer against"),
        message: z.string().describe("The message to send to the agent"),
        context_id: z
          .string()
          .optional()
          .describe("Optional context id to continue a prior conversation"),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async ({ agent_id, ...input }, extra) =>
      txt(await client.inferAgent(agent_id, input, extra.signal)),
  );

  server.registerTool(
    "lyzr_get_a2a_agent_card",
    {
      title: "Get A2A Agent Card",
      description:
        "Fetch the A2A agent card (the .well-known/agent-card.json descriptor) for a served agent.",
      inputSchema: {
        agent_id: z.string().describe("The A2A agent id"),
      },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ agent_id }, extra) =>
      txt(await client.getAgentCard(agent_id, extra.signal)),
  );

  server.registerTool(
    "lyzr_get_a2a_agent_card_convenience",
    {
      title: "Get A2A Agent Card (Convenience)",
      description:
        "Fetch the A2A agent card via the convenience path (without .well-known/agent-card.json).",
      inputSchema: {
        agent_id: z.string().describe("The A2A agent id"),
      },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ agent_id }, extra) =>
      txt(await client.getAgentCardConvenience(agent_id, extra.signal)),
  );

  server.registerTool(
    "lyzr_send_a2a_jsonrpc",
    {
      title: "Send A2A JSON-RPC Request",
      description:
        "Send a raw JSON-RPC 2.0 request to a served A2A agent's endpoint.",
      inputSchema: {
        agent_id: z.string().describe("The A2A agent id to send the request to"),
        request: z
          .record(z.unknown())
          .describe("The JSON-RPC 2.0 request payload (method, params, id, etc.)"),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async ({ agent_id, request }, extra) =>
      txt(await client.sendJsonRpc(agent_id, request, extra.signal)),
  );
};
