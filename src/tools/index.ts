import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { type FeatureGroup, applyReadOnlyGate } from "./feature-groups.js";
import type { LyzrClient } from "../lyzr/client.js";
import type { RagClient } from "../lyzr/rag.js";
import type { MemoryClient } from "../lyzr/memory.js";
import type { SchedulerClient } from "../lyzr/scheduler.js";
import type { RaiClient } from "../lyzr/rai.js";
import type { AgentExtrasClient } from "../lyzr/agent-extras.js";
import type { RagAdminClient } from "../lyzr/rag-admin.js";
import type { RagContentClient } from "../lyzr/rag-content.js";
import type { RagCredentialsClient } from "../lyzr/rag-credentials.js";
import type { KnowledgeGraphClient } from "../lyzr/knowledge-graph.js";
import type { AgentLifecycleExtraClient } from "../lyzr/agent-lifecycle-extra.js";
import type { InferenceExtraClient } from "../lyzr/inference-extra.js";
import type { A2AClient } from "../lyzr/a2a.js";
import type { AgentEvalClient } from "../lyzr/agent-eval.js";
import type { ArtifactsClient } from "../lyzr/artifacts.js";
import type { AssetsClient } from "../lyzr/assets.js";
import type { AuditLogsClient } from "../lyzr/audit-logs.js";
import type { ChannelsClient } from "../lyzr/channels.js";
import type { ContextsClient } from "../lyzr/contexts.js";
import type { PlatformAdminClient } from "../lyzr/platform-admin.js";
import type { GitAgentClient } from "../lyzr/git-agent.js";
import type { HumanFeedbackClient } from "../lyzr/human-feedback.js";
import type { OrgLlmFallbacksClient } from "../lyzr/org-llm-fallbacks.js";
import type { ReportsClient } from "../lyzr/reports.js";
import type { SemanticModelClient } from "../lyzr/semantic-model.js";
import type { SessionsV3Client } from "../lyzr/sessions-v3.js";
import type { SharingClient } from "../lyzr/sharing.js";
import type { ToolsV3CoreClient } from "../lyzr/tools-v3-core.js";
import type { ToolIntegrationsClient } from "../lyzr/tools-v3-integrations.js";
import type { TracesClient } from "../lyzr/traces.js";
import type { MiscUsageWidgetUserAssetsClient } from "../lyzr/misc-usage-widget-userassets.js";
import type { WorldModelCoreClient } from "../lyzr/world-model-core.js";
import type { WorldModelEvalClient } from "../lyzr/world-model-eval.js";
import type { AgentMemoryProvidersClient } from "../lyzr/agent-memory-providers.js";
import type { OpsClient } from "../lyzr/ops.js";
import type { ProvidersCoreClient } from "../lyzr/providers-core.js";
import type { ProviderCredentialsClient } from "../lyzr/providers-credentials.js";
import type { WorkflowsClient } from "../lyzr/workflows.js";
import type { LiveSourcesExtraClient } from "../lyzr/rag-live-sources-extra.js";
import type { KnowledgeGraphExtraClient } from "../lyzr/rag-knowledge-graph-extra.js";
import type { RagMiscExtraClient } from "../lyzr/rag-misc-extra.js";
import type { RagParseFilesClient } from "../lyzr/rag-parse-files.js";
import type { RagTrainFilesClient } from "../lyzr/rag-train-files.js";
import type { KbSyncConnectorsClient } from "../lyzr/kb-sync-connectors.js";
import type { KbSyncCcPairsClient } from "../lyzr/kb-sync-cc-pairs.js";
import type { KbSyncLegacyClient } from "../lyzr/kb-sync-oauth-legacy.js";

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
import { registerAgentLifecycleExtraTools } from "./agent-lifecycle-extra.js";
import { registerInferenceExtraTools } from "./inference-extra.js";
import { registerA2ATools } from "./a2a.js";
import { registerAgentEvalTools } from "./agent-eval.js";
import { registerArtifactsTools } from "./artifacts.js";
import { registerAssetsTools } from "./assets.js";
import { registerAuditLogsTools } from "./audit-logs.js";
import { registerChannelsTools } from "./channels.js";
import { registerContextsTools } from "./contexts.js";
import { registerPlatformAdminTools } from "./platform-admin.js";
import { registerGitAgentTools } from "./git-agent.js";
import { registerHumanFeedbackTools } from "./human-feedback.js";
import { registerOrgLlmFallbacksTools } from "./org-llm-fallbacks.js";
import { registerReportsTools } from "./reports.js";
import { registerSemanticModelTools } from "./semantic-model.js";
import { registerSessionsV3Tools } from "./sessions-v3.js";
import { registerSharingTools } from "./sharing.js";
import { registerToolsV3CoreTools } from "./tools-v3-core.js";
import { registerToolIntegrationsTools } from "./tools-v3-integrations.js";
import { registerTracesTools } from "./traces.js";
import { registerMiscUsageWidgetUserAssetsTools } from "./misc-usage-widget-userassets.js";
import { registerWorldModelCoreTools } from "./world-model-core.js";
import { registerWorldModelEvalTools } from "./world-model-eval.js";
import { registerAgentMemoryProvidersTools } from "./agent-memory-providers.js";
import { registerOpsTools } from "./ops.js";
import { registerProvidersCoreTools } from "./providers-core.js";
import { registerProviderCredentialsTools } from "./providers-credentials.js";
import { registerWorkflowsTools } from "./workflows.js";
import { registerLiveSourcesExtraTools } from "./rag-live-sources-extra.js";
import { registerKnowledgeGraphExtraTools } from "./rag-knowledge-graph-extra.js";
import { registerRagMiscExtraTools } from "./rag-misc-extra.js";
import { registerRagParseFilesTools } from "./rag-parse-files.js";
import { registerRagTrainFilesTools } from "./rag-train-files.js";
import { registerKbSyncConnectorsTools } from "./kb-sync-connectors.js";
import { registerKbSyncCcPairsTools } from "./kb-sync-cc-pairs.js";
import { registerKbSyncOauthLegacyTools } from "./kb-sync-oauth-legacy.js";

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
  agentLifecycleExtra: AgentLifecycleExtraClient;
  inferenceExtra: InferenceExtraClient;
  a2a: A2AClient;
  agentEval: AgentEvalClient;
  artifacts: ArtifactsClient;
  assets: AssetsClient;
  auditLogs: AuditLogsClient;
  channels: ChannelsClient;
  contexts: ContextsClient;
  platformAdmin: PlatformAdminClient;
  gitAgent: GitAgentClient;
  humanFeedback: HumanFeedbackClient;
  orgLlmFallbacks: OrgLlmFallbacksClient;
  reports: ReportsClient;
  semanticModel: SemanticModelClient;
  sessionsV3: SessionsV3Client;
  sharing: SharingClient;
  toolsV3Core: ToolsV3CoreClient;
  toolIntegrations: ToolIntegrationsClient;
  traces: TracesClient;
  miscUsageWidgetUserAssets: MiscUsageWidgetUserAssetsClient;
  worldModelCore: WorldModelCoreClient;
  worldModelEval: WorldModelEvalClient;
  agentMemoryProviders: AgentMemoryProvidersClient;
  ops: OpsClient;
  providersCore: ProvidersCoreClient;
  providerCredentials: ProviderCredentialsClient;
  workflows: WorkflowsClient;
  liveSourcesExtra: LiveSourcesExtraClient;
  kgExtra: KnowledgeGraphExtraClient;
  ragMiscExtra: RagMiscExtraClient;
  ragParseFiles: RagParseFilesClient;
  ragTrainFiles: RagTrainFilesClient;
  kbSyncConnectors: KbSyncConnectorsClient;
  kbSyncCcPairs: KbSyncCcPairsClient;
  kbSyncLegacy: KbSyncLegacyClient;
}

/** Options controlling which tools actually get registered. */
export interface RegisterToolsOptions {
  /** Feature groups to enable. Undefined = all (the default, back-compat). */
  features?: FeatureGroup[];
  /** If true, tools without `readOnlyHint: true` are registered then disabled. */
  readOnly?: boolean;
}

/**
 * One entry per tool-set: which feature group it belongs to, and the call that
 * registers it. Data-driven (rather than a flat list of calls) so `features`
 * can filter it — see feature-groups.ts and Supabase's own MCP server, which
 * uses the same --features/--read-only pattern.
 */
const buildRegistrations = (
  clients: LyzrClients,
): { group: FeatureGroup; register: (server: McpServer) => void }[] => [
  // core (host: agent)
  {
    group: "core",
    register: (s) => registerCreateAgentTool(s, clients.client),
  },
  {
    group: "core",
    register: (s) => registerUpdateAgentTool(s, clients.client),
  },
  {
    group: "core",
    register: (s) => registerDeleteAgentTool(s, clients.client),
  },
  { group: "core", register: (s) => registerListAgentsTool(s, clients.client) },
  { group: "core", register: (s) => registerGetAgentTool(s, clients.client) },
  { group: "core", register: (s) => registerChatTool(s, clients.client) },
  { group: "core", register: (s) => registerStreamChatTool(s, clients.client) },
  { group: "core", register: (s) => registerStartTaskTool(s, clients.client) },
  {
    group: "core",
    register: (s) => registerGetTaskStatusTool(s, clients.client),
  },
  {
    group: "core",
    register: (s) => registerAgentExtrasTools(s, clients.agentExtras),
  },
  {
    group: "core",
    register: (s) => registerSessionsV3Tools(s, clients.sessionsV3),
  },
  {
    group: "core",
    register: (s) =>
      registerAgentLifecycleExtraTools(s, clients.agentLifecycleExtra),
  },

  // rag (host: rag)
  { group: "rag", register: (s) => registerKnowledgeBaseTools(s, clients.rag) },
  { group: "rag", register: (s) => registerRagAdminTools(s, clients.ragAdmin) },
  {
    group: "rag",
    register: (s) => registerRagContentTools(s, clients.ragContent),
  },
  {
    group: "rag",
    register: (s) => registerRagCredentialsTools(s, clients.ragCredentials),
  },
  {
    group: "rag",
    register: (s) => registerKnowledgeGraphTools(s, clients.knowledgeGraph),
  },
  {
    group: "rag",
    register: (s) => registerLiveSourcesExtraTools(s, clients.liveSourcesExtra),
  },
  {
    group: "rag",
    register: (s) => registerKnowledgeGraphExtraTools(s, clients.kgExtra),
  },
  {
    group: "rag",
    register: (s) => registerRagMiscExtraTools(s, clients.ragMiscExtra),
  },
  {
    group: "rag",
    register: (s) => registerRagParseFilesTools(s, clients.ragParseFiles),
  },
  {
    group: "rag",
    register: (s) => registerRagTrainFilesTools(s, clients.ragTrainFiles),
  },

  // kb-sync (host: rag)
  {
    group: "kb-sync",
    register: (s) => registerKbSyncConnectorsTools(s, clients.kbSyncConnectors),
  },
  {
    group: "kb-sync",
    register: (s) => registerKbSyncCcPairsTools(s, clients.kbSyncCcPairs),
  },
  {
    group: "kb-sync",
    register: (s) => registerKbSyncOauthLegacyTools(s, clients.kbSyncLegacy),
  },

  // memory
  { group: "memory", register: (s) => registerMemoryTools(s, clients.memory) },
  {
    group: "memory",
    register: (s) =>
      registerAgentMemoryProvidersTools(s, clients.agentMemoryProviders),
  },

  // scheduler / rai / a2a
  {
    group: "scheduler",
    register: (s) => registerSchedulerTools(s, clients.scheduler),
  },
  { group: "rai", register: (s) => registerRaiTools(s, clients.rai) },
  { group: "a2a", register: (s) => registerA2ATools(s, clients.a2a) },

  // inference (extended)
  {
    group: "inference",
    register: (s) => registerInferenceExtraTools(s, clients.inferenceExtra),
  },

  // eval (agent eval + world model)
  {
    group: "eval",
    register: (s) => registerAgentEvalTools(s, clients.agentEval),
  },
  {
    group: "eval",
    register: (s) => registerWorldModelCoreTools(s, clients.worldModelCore),
  },
  {
    group: "eval",
    register: (s) => registerWorldModelEvalTools(s, clients.worldModelEval),
  },

  // git
  { group: "git", register: (s) => registerGitAgentTools(s, clients.gitAgent) },

  // tools v3
  {
    group: "tools",
    register: (s) => registerToolsV3CoreTools(s, clients.toolsV3Core),
  },
  {
    group: "tools",
    register: (s) => registerToolIntegrationsTools(s, clients.toolIntegrations),
  },

  // workflows
  {
    group: "workflows",
    register: (s) => registerWorkflowsTools(s, clients.workflows),
  },

  // admin (platform/org/access-control surface)
  {
    group: "admin",
    register: (s) => registerAuditLogsTools(s, clients.auditLogs),
  },
  {
    group: "admin",
    register: (s) => registerChannelsTools(s, clients.channels),
  },
  {
    group: "admin",
    register: (s) => registerContextsTools(s, clients.contexts),
  },
  {
    group: "admin",
    register: (s) => registerPlatformAdminTools(s, clients.platformAdmin),
  },
  { group: "admin", register: (s) => registerSharingTools(s, clients.sharing) },
  {
    group: "admin",
    register: (s) => registerOrgLlmFallbacksTools(s, clients.orgLlmFallbacks),
  },
  {
    group: "admin",
    register: (s) => registerProvidersCoreTools(s, clients.providersCore),
  },
  {
    group: "admin",
    register: (s) =>
      registerProviderCredentialsTools(s, clients.providerCredentials),
  },

  // content (artifacts/assets/semantic-model/human-feedback/skills)
  {
    group: "content",
    register: (s) => registerArtifactsTools(s, clients.artifacts),
  },
  { group: "content", register: (s) => registerAssetsTools(s, clients.assets) },
  {
    group: "content",
    register: (s) => registerSemanticModelTools(s, clients.semanticModel),
  },
  {
    group: "content",
    register: (s) => registerHumanFeedbackTools(s, clients.humanFeedback),
  },

  // ops (reports/traces/logs/usage)
  { group: "ops", register: (s) => registerOpsTools(s, clients.ops) },
  { group: "ops", register: (s) => registerReportsTools(s, clients.reports) },
  { group: "ops", register: (s) => registerTracesTools(s, clients.traces) },
  {
    group: "ops",
    register: (s) =>
      registerMiscUsageWidgetUserAssetsTools(
        s,
        clients.miscUsageWidgetUserAssets,
      ),
  },
];

/**
 * Register Lyzr tools with the MCP server, optionally scoped to a subset of
 * feature groups and/or gated to read-only (same pattern as Supabase's MCP
 * server's --features/--read-only). Defaults preserve prior behavior: every
 * tool registered, nothing disabled.
 */
export const registerTools = (
  server: McpServer,
  clients: LyzrClients,
  options: RegisterToolsOptions = {},
) => {
  const { features, readOnly = false } = options;
  const gatedServer = applyReadOnlyGate(server, readOnly);
  const enabled = features ? new Set(features) : undefined;

  for (const { group, register } of buildRegistrations(clients)) {
    if (enabled && !enabled.has(group)) continue;
    register(gatedServer);
  }
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
