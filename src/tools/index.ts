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

  // Extended agent-dev OpenAPI surface (host: agent) — see .claude/skills/lyzr-api-endpoint
registerAgentLifecycleExtraTools(server, clients.agentLifecycleExtra);
  registerInferenceExtraTools(server, clients.inferenceExtra);
  registerA2ATools(server, clients.a2a);
  registerAgentEvalTools(server, clients.agentEval);
  registerArtifactsTools(server, clients.artifacts);
  registerAssetsTools(server, clients.assets);
  registerAuditLogsTools(server, clients.auditLogs);
  registerChannelsTools(server, clients.channels);
  registerContextsTools(server, clients.contexts);
  registerPlatformAdminTools(server, clients.platformAdmin);
  registerGitAgentTools(server, clients.gitAgent);
  registerHumanFeedbackTools(server, clients.humanFeedback);
  registerOrgLlmFallbacksTools(server, clients.orgLlmFallbacks);
  registerReportsTools(server, clients.reports);
  registerSemanticModelTools(server, clients.semanticModel);
  registerSessionsV3Tools(server, clients.sessionsV3);
  registerSharingTools(server, clients.sharing);
  registerToolsV3CoreTools(server, clients.toolsV3Core);
  registerToolIntegrationsTools(server, clients.toolIntegrations);
  registerTracesTools(server, clients.traces);
  registerMiscUsageWidgetUserAssetsTools(server, clients.miscUsageWidgetUserAssets);
  registerWorldModelCoreTools(server, clients.worldModelCore);
  registerWorldModelEvalTools(server, clients.worldModelEval);
  registerAgentMemoryProvidersTools(server, clients.agentMemoryProviders);
  registerOpsTools(server, clients.ops);
  registerProvidersCoreTools(server, clients.providersCore);
  registerProviderCredentialsTools(server, clients.providerCredentials);
  registerWorkflowsTools(server, clients.workflows);

  // Extended rag-dev OpenAPI surface (host: rag)
registerLiveSourcesExtraTools(server, clients.liveSourcesExtra);
  registerKnowledgeGraphExtraTools(server, clients.kgExtra);
  registerRagMiscExtraTools(server, clients.ragMiscExtra);
  registerRagParseFilesTools(server, clients.ragParseFiles);
  registerRagTrainFilesTools(server, clients.ragTrainFiles);
  registerKbSyncConnectorsTools(server, clients.kbSyncConnectors);
  registerKbSyncCcPairsTools(server, clients.kbSyncCcPairs);
  registerKbSyncOauthLegacyTools(server, clients.kbSyncLegacy);
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
