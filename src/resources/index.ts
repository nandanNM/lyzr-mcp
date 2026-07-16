import {
  McpServer,
  ResourceTemplate,
} from "@modelcontextprotocol/sdk/server/mcp.js";
import { LyzrClient } from "../lyzr/client.js";
import { RagClient } from "../lyzr/rag.js";
import { AgentExtrasClient } from "../lyzr/agent-extras.js";

/** Clients the resources read from. */
export interface ResourceDeps {
  agents: LyzrClient;
  rag: RagClient;
  sessions: AgentExtrasClient;
}

const json = (uri: URL, data: unknown) => ({
  contents: [
    {
      uri: uri.href,
      mimeType: "application/json",
      text: JSON.stringify(data, null, 2),
    },
  ],
});

/**
 * Expose Lyzr data as MCP resources (readable by URI):
 *   - lyzr://agents                  -> list of your agents
 *   - lyzr://agent/{agentId}         -> one agent's details
 *   - lyzr://kb/{ragId}              -> one knowledge base's config
 *   - lyzr://kb/{ragId}/documents    -> documents indexed in a KB
 *   - lyzr://session/{sessionId}     -> a session's conversation
 */
export const registerResources = (server: McpServer, deps: ResourceDeps) => {
  server.registerResource(
    "lyzr-agents",
    "lyzr://agents",
    {
      title: "Lyzr Agents",
      description: "All agents available to your Lyzr API key.",
      mimeType: "application/json",
    },
    async (uri) => json(uri, await deps.agents.listAgents()),
  );

  server.registerResource(
    "lyzr-agent",
    new ResourceTemplate("lyzr://agent/{agentId}", { list: undefined }),
    {
      title: "Lyzr Agent",
      description: "Details of a single Lyzr agent by its agent_id.",
      mimeType: "application/json",
    },
    async (uri, variables) =>
      json(uri, await deps.agents.getAgent(String(variables.agentId))),
  );

  server.registerResource(
    "lyzr-kb",
    new ResourceTemplate("lyzr://kb/{ragId}", { list: undefined }),
    {
      title: "Lyzr Knowledge Base",
      description: "A knowledge base (RAG) configuration by its id.",
      mimeType: "application/json",
    },
    async (uri, variables) =>
      json(uri, await deps.rag.getKb(String(variables.ragId))),
  );

  server.registerResource(
    "lyzr-kb-documents",
    new ResourceTemplate("lyzr://kb/{ragId}/documents", { list: undefined }),
    {
      title: "Lyzr KB Documents",
      description: "The documents indexed in a knowledge base.",
      mimeType: "application/json",
    },
    async (uri, variables) =>
      json(uri, await deps.rag.listDocuments(String(variables.ragId))),
  );

  server.registerResource(
    "lyzr-session",
    new ResourceTemplate("lyzr://session/{sessionId}", { list: undefined }),
    {
      title: "Lyzr Session Conversation",
      description: "The full conversation for a session by its session_id.",
      mimeType: "application/json",
    },
    async (uri, variables) =>
      json(
        uri,
        await deps.sessions.getSessionConversation(String(variables.sessionId)),
      ),
  );
};
