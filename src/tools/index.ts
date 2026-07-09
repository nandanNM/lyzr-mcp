import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { LyzrClient } from "../lyzr/client.js";
import { RagClient } from "../lyzr/rag.js";
import { MemoryClient } from "../lyzr/memory.js";
import { SchedulerClient } from "../lyzr/scheduler.js";
import { RaiClient } from "../lyzr/rai.js";

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

/** The set of per-service clients handed to the tool registrars. */
export interface LyzrClients {
  client: LyzrClient;
  rag: RagClient;
  memory: MemoryClient;
  scheduler: SchedulerClient;
  rai: RaiClient;
}

/**
 * Register all Lyzr tools with the MCP server. One line per tool/tool-set — the
 * registry pattern. Each group targets the client for its Lyzr service host.
 */
export const registerTools = (server: McpServer, clients: LyzrClients) => {
  // Agent lifecycle + inference (host: agent-prod)
  registerCreateAgentTool(server, clients.client);
  registerUpdateAgentTool(server, clients.client);
  registerDeleteAgentTool(server, clients.client);
  registerListAgentsTool(server, clients.client);
  registerGetAgentTool(server, clients.client);
  registerChatTool(server, clients.client);
  registerStreamChatTool(server, clients.client);
  registerStartTaskTool(server, clients.client);
  registerGetTaskStatusTool(server, clients.client);

  // Knowledge Base / RAG (host: rag-prod)
  registerKnowledgeBaseTools(server, clients.rag);
  // Knowledge Graph / Cognis memory (host: memory.studio)
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
