import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerDraftSupportAgentPrompt } from "./draft-support-agent.js";
import { registerSummarizeConversationPrompt } from "./summarize-conversation.js";
import { registerSetupRagAgentPrompt } from "./setup-rag-agent.js";
import { registerDraftGuardrailPolicyPrompt } from "./draft-guardrail-policy.js";
import { registerDraftA2AAgentPrompt } from "./draft-a2a-agent.js";
import { registerAuditAgentActivityPrompt } from "./audit-agent-activity.js";
import { registerCreateAndAttachSkillPrompt } from "./create-and-attach-skill.js";
import { registerSetupAgentMemoryPrompt } from "./setup-agent-memory.js";
import { registerAttachRaiPolicyPrompt } from "./attach-rai-policy.js";

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
  registerCreateAndAttachSkillPrompt(server);
  registerSetupAgentMemoryPrompt(server);
  registerAttachRaiPolicyPrompt(server);
};
