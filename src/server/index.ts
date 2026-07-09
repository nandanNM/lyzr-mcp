import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { LyzrClient } from "../lyzr/client.js";
import { RagClient } from "../lyzr/rag.js";
import { MemoryClient } from "../lyzr/memory.js";
import { SchedulerClient } from "../lyzr/scheduler.js";
import { RaiClient } from "../lyzr/rai.js";
import {
  registerTools,
  registerConditionalTools,
  LyzrClients,
} from "../tools/index.js";
import { registerResources } from "../resources/index.js";
import { registerPrompts } from "../prompts/index.js";
import {
  setSubscriptionHandlers,
  stopResourceUpdates,
} from "../resources/subscriptions.js";
import { stopLogging } from "./logging.js";
import { syncRoots } from "./roots.js";
import { DEFAULT_BASE_URL, getServiceUrls } from "../config.js";

export type ServerFactoryResponse = {
  server: McpServer;
  cleanup: (sessionId?: string) => void;
};

const INSTRUCTIONS = `Lyzr Enterprise MCP server.

Uses YOUR Lyzr API key (never a shared key). Tools cover: agents (create/update/delete/
chat/stream/tasks), Knowledge Base / RAG (create/train/query), Cognis memory (the
"knowledge graph"), scheduler (cron-run agents), and RAI guardrail policies.
Agents are also exposed as resources (lyzr://agents, lyzr://agent/{id}).`;

/**
 * Server factory — mirrors the "everything" reference server's shape.
 *
 * Transport-agnostic: every transport builds the server identically and differs
 * only in HOW it obtains the per-user API key. The key is passed in and fanned
 * out to one client per Lyzr service host (agent/rag/memory/scheduler/rai).
 */
export const createServer = (
  apiKey: string,
  baseUrl: string = DEFAULT_BASE_URL,
): ServerFactoryResponse => {
  const urls = getServiceUrls();
  const clients: LyzrClients = {
    client: new LyzrClient({ apiKey, baseUrl }), // agent host (param wins)
    rag: new RagClient({ apiKey, baseUrl: urls.rag }),
    memory: new MemoryClient({ apiKey, baseUrl: urls.memory }),
    scheduler: new SchedulerClient({ apiKey, baseUrl: urls.scheduler }),
    rai: new RaiClient({ apiKey, baseUrl: urls.rai }),
  };

  let initializeTimeout: ReturnType<typeof setTimeout> | null = null;

  const server = new McpServer(
    {
      name: "lyzr-mcp",
      title: "Lyzr Enterprise MCP Server",
      version: "0.1.0",
    },
    {
      capabilities: {
        tools: { listChanged: true },
        resources: { subscribe: true, listChanged: true },
        prompts: { listChanged: true },
        logging: {},
      },
      instructions: INSTRUCTIONS,
    },
  );

  registerTools(server, clients);
  registerResources(server, clients.client);
  registerPrompts(server);
  setSubscriptionHandlers(server);

  server.server.oninitialized = async () => {
    registerConditionalTools(server, clients);
    const sessionId = server.server.transport?.sessionId;
    initializeTimeout = setTimeout(
      () => void syncRoots(server, sessionId),
      350,
    );
  };

  return {
    server,
    cleanup: (sessionId?: string) => {
      stopLogging(sessionId);
      stopResourceUpdates(sessionId);
      if (initializeTimeout) clearTimeout(initializeTimeout);
    },
  };
};
