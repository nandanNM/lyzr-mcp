import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerDraftSupportAgentPrompt } from "./draft-support-agent.js";
import { registerSummarizeConversationPrompt } from "./summarize-conversation.js";

/**
 * Register the prompts with the MCP server (registry pattern, one line per prompt).
 */
export const registerPrompts = (server: McpServer) => {
  registerDraftSupportAgentPrompt(server);
  registerSummarizeConversationPrompt(server);
};
