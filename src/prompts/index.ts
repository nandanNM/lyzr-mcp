import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerDraftSupportAgentPrompt } from "./draft-support-agent.js";
import { registerSummarizeConversationPrompt } from "./summarize-conversation.js";
import { registerSetupRagAgentPrompt } from "./setup-rag-agent.js";
import { registerDraftGuardrailPolicyPrompt } from "./draft-guardrail-policy.js";
import { registerDraftA2AAgentPrompt } from "./draft-a2a-agent.js";
import { registerAuditAgentActivityPrompt } from "./audit-agent-activity.js";

/**
 * Register the prompts with the MCP server (registry pattern, one line per prompt).
 */
export const registerPrompts = (server: McpServer) => {
  registerDraftSupportAgentPrompt(server);
  registerSummarizeConversationPrompt(server);
  registerSetupRagAgentPrompt(server);
  registerDraftGuardrailPolicyPrompt(server);
  registerDraftA2AAgentPrompt(server);
  registerAuditAgentActivityPrompt(server);
};
