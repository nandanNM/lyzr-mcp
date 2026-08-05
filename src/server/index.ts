import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { LyzrClient } from "../lyzr/client.js";
import { RagClient } from "../lyzr/rag.js";
import { MemoryClient } from "../lyzr/memory.js";
import { SchedulerClient } from "../lyzr/scheduler.js";
import { RaiClient } from "../lyzr/rai.js";
import { SkillsClient } from "../lyzr/skills.js";
import { AgentExtrasClient } from "../lyzr/agent-extras.js";
import { RagAdminClient } from "../lyzr/rag-admin.js";
import { RagContentClient } from "../lyzr/rag-content.js";
import { RagCredentialsClient } from "../lyzr/rag-credentials.js";
import { KnowledgeGraphClient } from "../lyzr/knowledge-graph.js";
import { AgentLifecycleExtraClient } from "../lyzr/agent-lifecycle-extra.js";
import { InferenceExtraClient } from "../lyzr/inference-extra.js";
import { A2AClient } from "../lyzr/a2a.js";
import { AgentEvalClient } from "../lyzr/agent-eval.js";
import { ArtifactsClient } from "../lyzr/artifacts.js";
import { AssetsClient } from "../lyzr/assets.js";
import { AuditLogsClient } from "../lyzr/audit-logs.js";
import { ChannelsClient } from "../lyzr/channels.js";
import { ContextsClient } from "../lyzr/contexts.js";
import { PlatformAdminClient } from "../lyzr/platform-admin.js";
import { GitAgentClient } from "../lyzr/git-agent.js";
import { HumanFeedbackClient } from "../lyzr/human-feedback.js";
import { OrgLlmFallbacksClient } from "../lyzr/org-llm-fallbacks.js";
import { ReportsClient } from "../lyzr/reports.js";
import { SemanticModelClient } from "../lyzr/semantic-model.js";
import { SessionsV3Client } from "../lyzr/sessions-v3.js";
import { SharingClient } from "../lyzr/sharing.js";
import { ToolsV3CoreClient } from "../lyzr/tools-v3-core.js";
import { ToolIntegrationsClient } from "../lyzr/tools-v3-integrations.js";
import { TracesClient } from "../lyzr/traces.js";
import { MiscUsageWidgetUserAssetsClient } from "../lyzr/misc-usage-widget-userassets.js";
import { WorldModelCoreClient } from "../lyzr/world-model-core.js";
import { WorldModelEvalClient } from "../lyzr/world-model-eval.js";
import { AgentMemoryProvidersClient } from "../lyzr/agent-memory-providers.js";
import { OpsClient } from "../lyzr/ops.js";
import { ProvidersCoreClient } from "../lyzr/providers-core.js";
import { ProviderCredentialsClient } from "../lyzr/providers-credentials.js";
import { WorkflowsClient } from "../lyzr/workflows.js";
import { LiveSourcesExtraClient } from "../lyzr/rag-live-sources-extra.js";
import { KnowledgeGraphExtraClient } from "../lyzr/rag-knowledge-graph-extra.js";
import { RagMiscExtraClient } from "../lyzr/rag-misc-extra.js";
import { RagParseFilesClient } from "../lyzr/rag-parse-files.js";
import { RagTrainFilesClient } from "../lyzr/rag-train-files.js";
import { KbSyncConnectorsClient } from "../lyzr/kb-sync-connectors.js";
import { KbSyncCcPairsClient } from "../lyzr/kb-sync-cc-pairs.js";
import { KbSyncLegacyClient } from "../lyzr/kb-sync-oauth-legacy.js";
import {
  registerTools,
  registerConditionalTools,
  type LyzrClients,
} from "../tools/index.js";
import type { FeatureGroup } from "../tools/feature-groups.js";
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
export interface CreateServerOptions {
  /** Feature groups to enable (see tools/feature-groups.ts). Undefined = all. */
  features?: FeatureGroup[];
  /** If true, tools without readOnlyHint:true are registered then disabled. */
  readOnly?: boolean;
}

export const createServer = (
  apiKey: string,
  baseUrl: string = DEFAULT_BASE_URL,
  options: CreateServerOptions = {},
): ServerFactoryResponse => {
  const urls = getServiceUrls();
  const clients: LyzrClients = {
    client: new LyzrClient({ apiKey, baseUrl }), // agent host (param wins)
    rag: new RagClient({ apiKey, baseUrl: urls.rag }),
    memory: new MemoryClient({ apiKey, baseUrl: urls.memory }),
    scheduler: new SchedulerClient({ apiKey, baseUrl: urls.scheduler }),
    rai: new RaiClient({ apiKey, baseUrl: urls.rai }),
    skills: new SkillsClient({ apiKey, baseUrl: urls.skills }),
    agentExtras: new AgentExtrasClient({ apiKey, baseUrl }), // agent host
    ragAdmin: new RagAdminClient({ apiKey, baseUrl: urls.rag }),
    ragContent: new RagContentClient({ apiKey, baseUrl: urls.rag }),
    ragCredentials: new RagCredentialsClient({ apiKey, baseUrl: urls.rag }),
    knowledgeGraph: new KnowledgeGraphClient({ apiKey, baseUrl: urls.rag }),

    // Extended agent-dev OpenAPI surface (host: agent)
    agentLifecycleExtra: new AgentLifecycleExtraClient({ apiKey, baseUrl }),
    inferenceExtra: new InferenceExtraClient({ apiKey, baseUrl }),
    a2a: new A2AClient({ apiKey, baseUrl }),
    agentEval: new AgentEvalClient({ apiKey, baseUrl }),
    artifacts: new ArtifactsClient({ apiKey, baseUrl }),
    assets: new AssetsClient({ apiKey, baseUrl }),
    auditLogs: new AuditLogsClient({ apiKey, baseUrl }),
    channels: new ChannelsClient({ apiKey, baseUrl }),
    contexts: new ContextsClient({ apiKey, baseUrl }),
    platformAdmin: new PlatformAdminClient({ apiKey, baseUrl }),
    gitAgent: new GitAgentClient({ apiKey, baseUrl }),
    humanFeedback: new HumanFeedbackClient({ apiKey, baseUrl }),
    orgLlmFallbacks: new OrgLlmFallbacksClient({ apiKey, baseUrl }),
    reports: new ReportsClient({ apiKey, baseUrl }),
    semanticModel: new SemanticModelClient({ apiKey, baseUrl }),
    sessionsV3: new SessionsV3Client({ apiKey, baseUrl }),
    sharing: new SharingClient({ apiKey, baseUrl }),
    toolsV3Core: new ToolsV3CoreClient({ apiKey, baseUrl }),
    toolIntegrations: new ToolIntegrationsClient({ apiKey, baseUrl }),
    traces: new TracesClient({ apiKey, baseUrl }),
    miscUsageWidgetUserAssets: new MiscUsageWidgetUserAssetsClient({
      apiKey,
      baseUrl,
    }),
    worldModelCore: new WorldModelCoreClient({ apiKey, baseUrl }),
    worldModelEval: new WorldModelEvalClient({ apiKey, baseUrl }),
    agentMemoryProviders: new AgentMemoryProvidersClient({ apiKey, baseUrl }),
    ops: new OpsClient({ apiKey, baseUrl }),
    providersCore: new ProvidersCoreClient({ apiKey, baseUrl }),
    providerCredentials: new ProviderCredentialsClient({ apiKey, baseUrl }),
    workflows: new WorkflowsClient({ apiKey, baseUrl }),

    // Extended rag-dev OpenAPI surface (host: rag)
    liveSourcesExtra: new LiveSourcesExtraClient({ apiKey, baseUrl: urls.rag }),
    kgExtra: new KnowledgeGraphExtraClient({ apiKey, baseUrl: urls.rag }),
    ragMiscExtra: new RagMiscExtraClient({ apiKey, baseUrl: urls.rag }),
    ragParseFiles: new RagParseFilesClient({ apiKey, baseUrl: urls.rag }),
    ragTrainFiles: new RagTrainFilesClient({ apiKey, baseUrl: urls.rag }),
    kbSyncConnectors: new KbSyncConnectorsClient({ apiKey, baseUrl: urls.rag }),
    kbSyncCcPairs: new KbSyncCcPairsClient({ apiKey, baseUrl: urls.rag }),
    kbSyncLegacy: new KbSyncLegacyClient({ apiKey, baseUrl: urls.rag }),
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

  registerTools(server, clients, options);
  registerResources(server, {
    agents: clients.client,
    rag: clients.rag,
    sessions: clients.agentExtras,
    workflows: clients.workflows,
    a2a: clients.a2a,
    traces: clients.traces,
    worldModel: clients.worldModelCore,
  });
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
