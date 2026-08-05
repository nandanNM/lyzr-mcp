import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

/**
 * `create_and_attach_skill` — creates (or imports) a skill and attaches it to
 * an existing agent's skills_catalog via `lyzr_update_agent`.
 */
export const registerCreateAndAttachSkillPrompt = (server: McpServer) => {
  server.registerPrompt(
    "create_and_attach_skill",
    {
      title: "Create and Attach a Skill",
      description:
        "Create (or import from GitHub) a skill, then attach it to an existing agent's skills_catalog.",
      argsSchema: {
        agent_id: z
          .string()
          .describe("The existing agent_id to attach the skill to"),
        skill_source: z
          .string()
          .describe(
            "A description of what the skill should do, or a GitHub URL to import from",
          ),
      },
    },
    ({ agent_id, skill_source }) => ({
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text:
              `Create and attach a skill to agent \`${agent_id}\`.\n` +
              `1. If "${skill_source}" looks like a URL, import it with \`lyzr_skill_import_github\`. ` +
              `Otherwise, write appropriate skill file content and create it with \`lyzr_skill_create\`.\n` +
              `2. Note the returned skill id.\n` +
              `3. Call \`lyzr_get_agent\` on \`${agent_id}\` first to fetch its existing \`skills_catalog\`.\n` +
              `4. Call \`lyzr_update_agent\` with \`skills_catalog\` set to the existing ids plus the new skill id — ` +
              `\`lyzr_update_agent\` is a full-replace, so omitting the existing entries will silently remove them.\n` +
              `Report the new skill_id and the final skills_catalog.`,
          },
        },
      ],
    }),
  );
};
