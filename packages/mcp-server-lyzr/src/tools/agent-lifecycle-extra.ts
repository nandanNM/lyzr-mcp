import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { AgentLifecycleExtraClient } from "../lyzr/agent-lifecycle-extra.js";

const txt = (data: unknown) => ({
  content: [
    {
      type: "text" as const,
      text: typeof data === "string" ? data : JSON.stringify(data, null, 2),
    },
  ],
});

/**
 * Register the Agent Lifecycle Extra tools
 * (bulk-delete/org/versions/clone/reassign).
 *
 * `lyzr_set_agent_status`, `lyzr_set_agent_lock`, and `lyzr_publish_agents`
 * were removed: the first two target `/v3/agents/{id}/status` and
 * `/v3/agents/{id}/lock`, neither of which exists in the backend (confirmed
 * live 404 / 405 — see agent-lifecycle-extra.ts); the third,
 * `POST /v3/agents/publish`, exists but requires a server-to-server
 * `x-server-token` secret no MCP caller's API key can supply (confirmed
 * live 403).
 */
export const registerAgentLifecycleExtraTools = (
  server: McpServer,
  client: AgentLifecycleExtraClient,
) => {
  server.registerTool(
    "lyzr_bulk_delete_agents",
    {
      title: "Bulk Delete Agents",
      description: "Permanently delete multiple agents by id.",
      inputSchema: {
        agent_ids: z
          .array(z.string())
          .min(1)
          .describe("List of agent IDs to delete"),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async ({ agent_ids }, extra) =>
      txt(await client.bulkDeleteAgents({ agent_ids }, extra.signal)),
  );

  server.registerTool(
    "lyzr_list_org_agents",
    {
      title: "List Org Agents",
      description:
        "List agents across the organization, with optional search and pagination.",
      inputSchema: {
        search: z.string().optional().describe("Optional search term"),
        page: z
          .number()
          .int()
          .min(1)
          .optional()
          .describe("Page number (default 1)"),
        limit: z
          .number()
          .int()
          .min(1)
          .optional()
          .describe("Results per page (default 10)"),
      },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ search, page, limit }, extra) =>
      txt(await client.listOrgAgents({ search, page, limit }, extra.signal)),
  );

  server.registerTool(
    "lyzr_list_agent_versions",
    {
      title: "List Agent Versions",
      description: "List the version history of an agent.",
      inputSchema: {
        agent_id: z.string().describe("The agent_id whose versions to list"),
      },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ agent_id }, extra) =>
      txt(await client.listAgentVersions(agent_id, extra.signal)),
  );

  server.registerTool(
    "lyzr_get_agent_version",
    {
      title: "Get Agent Version",
      description: "Fetch a specific version of an agent.",
      inputSchema: {
        agent_id: z.string().describe("The agent_id"),
        version_id: z.string().describe("The version_id to fetch"),
      },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ agent_id, version_id }, extra) =>
      txt(await client.getAgentVersion(agent_id, version_id, extra.signal)),
  );

  server.registerTool(
    "lyzr_activate_agent_version",
    {
      title: "Activate Agent Version",
      description:
        "Activate a specific version of an agent, making it the live version.",
      inputSchema: {
        agent_id: z.string().describe("The agent_id"),
        version_id: z.string().describe("The version_id to activate"),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async ({ agent_id, version_id }, extra) =>
      txt(
        await client.activateAgentVersion(agent_id, version_id, extra.signal),
      ),
  );

  server.registerTool(
    "lyzr_clone_agent",
    {
      title: "Clone Agent",
      description: "Create a copy of an existing agent.",
      inputSchema: {
        agent_id: z.string().describe("The agent_id to clone"),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async ({ agent_id }, extra) =>
      txt(await client.cloneAgent({ agent_id }, extra.signal)),
  );

  server.registerTool(
    "lyzr_reassign_agent",
    {
      title: "Reassign Agent",
      description: "Reassign ownership of an agent to another user by email.",
      inputSchema: {
        agent_id: z.string().describe("The agent_id to reassign"),
        target_email: z.string().describe("Email address of the new owner"),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async ({ agent_id, target_email }, extra) =>
      txt(await client.reassignAgent({ agent_id, target_email }, extra.signal)),
  );
};
