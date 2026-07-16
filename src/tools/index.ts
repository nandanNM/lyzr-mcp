import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { LyzrClient } from "../lyzr/client.js";
import { RagClient } from "../lyzr/rag.js";
import { MemoryClient } from "../lyzr/memory.js";
import { SchedulerClient } from "../lyzr/scheduler.js";
import { RaiClient } from "../lyzr/rai.js";
import { AgentExtrasClient } from "../lyzr/agent-extras.js";
import { RagAdminClient } from "../lyzr/rag-admin.js";
import { RagContentClient } from "../lyzr/rag-content.js";
import { RagCredentialsClient } from "../lyzr/rag-credentials.js";
import { KnowledgeGraphClient } from "../lyzr/knowledge-graph.js";

import { registerCreateAgentTool } from "./create-agent.js";
import { registerChatTool } from "./chat.js";
import { registerListAgentsTool } from "./list-agents.js";
import { registerGetAgentTool } from "./get-agent.js";
import { registerStreamChatTool } from "./stream-chat.js";
import { registerStartTaskTool } from "./start-task.js";
import { registerGetTaskStatusTool } from "./get-task-status.js";
import { registerUpdateAgentTool } from "./update-agent.js";
import { registerDeleteAgentTool } from "./delete-agent.js";
import { registerKnowledgeBaseTools } from "./knowledge-base.js";
import { registerMemoryTools } from "./memory.js";
import { registerSchedulerTools } from "./scheduler.js";
import { registerRaiTools } from "./rai.js";
import { registerAgentExtrasTools } from "./agent-extras.js";
import { registerRagAdminTools } from "./rag-admin.js";
import { registerRagContentTools } from "./rag-content.js";
import { registerRagCredentialsTools } from "./rag-credentials.js";
import { registerKnowledgeGraphTools } from "./knowledge-graph.js";

/** The set of per-service clients handed to the tool registrars. */
export interface LyzrClients {
  client: LyzrClient;
  rag: RagClient;
  memory: MemoryClient;
  scheduler: SchedulerClient;
  rai: RaiClient;
  agentExtras: AgentExtrasClient;
  ragAdmin: RagAdminClient;
  ragContent: RagContentClient;
  ragCredentials: RagCredentialsClient;
  knowledgeGraph: KnowledgeGraphClient;
}

/**
 * Register all Lyzr tools with the MCP server. One line per tool/tool-set — the
 * registry pattern. Each group targets the client for its Lyzr service host.
 */
export const registerTools = (server: McpServer, clients: LyzrClients) => {
  // Agent lifecycle + inference (host: agent)
  registerCreateAgentTool(server, clients.client);
  registerUpdateAgentTool(server, clients.client);
  registerDeleteAgentTool(server, clients.client);
  registerListAgentsTool(server, clients.client);
  registerGetAgentTool(server, clients.client);
  registerChatTool(server, clients.client);
  registerStreamChatTool(server, clients.client);
  registerStartTaskTool(server, clients.client);
  registerGetTaskStatusTool(server, clients.client);

  // Sessions + agent templates/utility (host: agent)
  registerAgentExtrasTools(server, clients.agentExtras);

  // Knowledge Base / RAG (host: rag)
  registerKnowledgeBaseTools(server, clients.rag);
  registerRagAdminTools(server, clients.ragAdmin);
  registerRagContentTools(server, clients.ragContent);
  registerRagCredentialsTools(server, clients.ragCredentials);

  // Knowledge Graph v4 (host: rag)
  registerKnowledgeGraphTools(server, clients.knowledgeGraph);

  // Cognis memory (host: memory.studio)
  registerMemoryTools(server, clients.memory);
  // Scheduler (host: scheduler.studio)
  registerSchedulerTools(server, clients.scheduler);
  // RAI guardrails (host: rai-prod)
  registerRaiTools(server, clients.rai);
};

/**
 * Register tools gated on CLIENT capabilities. Called from the factory's
 * `oninitialized` hook — mirrors the reference server's `registerConditionalTools`.
 * No capability-gated Lyzr tools yet; the seam is kept for future sampling/elicitation.
 */
export const registerConditionalTools = (
  server: McpServer,
  clients: LyzrClients,
) => {
  void server;
  void clients;
};
