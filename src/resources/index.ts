import {
  type McpServer,
  ResourceTemplate,
} from "@modelcontextprotocol/sdk/server/mcp.js";
import type { LyzrClient } from "../lyzr/client.js";
import type { RagClient } from "../lyzr/rag.js";
import type { AgentExtrasClient } from "../lyzr/agent-extras.js";
import type { WorkflowsClient } from "../lyzr/workflows.js";
import type { A2AClient } from "../lyzr/a2a.js";
import type { TracesClient } from "../lyzr/traces.js";
import type { WorldModelCoreClient } from "../lyzr/world-model-core.js";

/** Clients the resources read from. */
export interface ResourceDeps {
  agents: LyzrClient;
  rag: RagClient;
  sessions: AgentExtrasClient;
  workflows: WorkflowsClient;
  a2a: A2AClient;
  traces: TracesClient;
  worldModel: WorldModelCoreClient;
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
 *   - lyzr://workflows                -> list of your workflows
 *   - lyzr://workflow/{flowId}        -> one workflow's config
 *   - lyzr://a2a-agents                -> list of your A2A agents
 *   - lyzr://a2a-agent/{agentId}      -> one A2A agent's card/config
 *   - lyzr://traces                    -> recent execution traces
 *   - lyzr://world-model/{agentId}    -> world models for one agent
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

  server.registerResource(
    "lyzr-workflows",
    "lyzr://workflows",
    {
      title: "Lyzr Workflows",
      description: "All workflows available to your Lyzr API key.",
      mimeType: "application/json",
    },
    async (uri) => json(uri, await deps.workflows.listWorkflows()),
  );

  server.registerResource(
    "lyzr-workflow",
    new ResourceTemplate("lyzr://workflow/{flowId}", { list: undefined }),
    {
      title: "Lyzr Workflow",
      description: "A single workflow's config by its flow_id.",
      mimeType: "application/json",
    },
    async (uri, variables) =>
      json(uri, await deps.workflows.getWorkflow(String(variables.flowId))),
  );

  server.registerResource(
    "lyzr-a2a-agents",
    "lyzr://a2a-agents",
    {
      title: "Lyzr A2A Agents",
      description: "All A2A (agent-to-agent) agents on your Lyzr API key.",
      mimeType: "application/json",
    },
    async (uri) => json(uri, await deps.a2a.listAgents()),
  );

  server.registerResource(
    "lyzr-a2a-agent",
    new ResourceTemplate("lyzr://a2a-agent/{agentId}", { list: undefined }),
    {
      title: "Lyzr A2A Agent",
      description: "A single A2A agent's card/config by its agent_id.",
      mimeType: "application/json",
    },
    async (uri, variables) =>
      json(uri, await deps.a2a.getAgent(String(variables.agentId))),
  );

  server.registerResource(
    "lyzr-traces",
    "lyzr://traces",
    {
      title: "Lyzr Traces",
      description: "Recent execution traces across your agents.",
      mimeType: "application/json",
    },
    async (uri) => json(uri, await deps.traces.listTraces()),
  );

  server.registerResource(
    "lyzr-world-model",
    new ResourceTemplate("lyzr://world-model/{agentId}", { list: undefined }),
    {
      title: "Lyzr World Model",
      description: "World models registered for a given agent_id.",
      mimeType: "application/json",
    },
    async (uri, variables) =>
      json(uri, await deps.worldModel.listByAgent(String(variables.agentId))),
  );
};
