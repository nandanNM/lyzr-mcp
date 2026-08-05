import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { SkillsClient } from "../lyzr/skills.js";

/**
 * Registers the Skills tools (host: skills — a standalone service, see
 * src/lyzr/skills.ts's header comment for how this differs from agent-prod's
 * read-only skills proxy already wrapped in human-feedback.ts).
 */
export const registerSkillsTools = (server: McpServer, client: SkillsClient) => {
  server.registerTool(
    "lyzr_skill_create",
    {
      title: "Create Skill (upload)",
      description:
        "Upload a new skill from raw file content (must include a SKILL.md). For an existing public/private " +
        "GitHub repo, prefer lyzr_skill_import_github instead — it references the repo directly with no re-upload.",
      inputSchema: {
        files: z
          .array(
            z.object({
              filename: z.string().describe("File path/name, e.g. SKILL.md"),
              content_base64: z.string().describe("Base64-encoded file content"),
            }),
          )
          .min(1)
          .describe("Files to upload — must include one named SKILL.md"),
        credential_id: z
          .string()
          .optional()
          .describe("GitHub credential id to use for this upload, if any"),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async ({ files, credential_id }, extra) => {
      const result = await client.createSkill(
        files.map((f) => ({
          data: Buffer.from(f.content_base64, "base64"),
          filename: f.filename,
        })),
        credential_id,
        extra.signal,
      );
      return {
        content: [
          {
            type: "text",
            text: `Created skill \`${result.id}\` (v${result.version}).\n\n${JSON.stringify(result, null, 2)}`,
          },
        ],
      };
    },
  );

  server.registerTool(
    "lyzr_skill_import_github",
    {
      title: "Import Skill from GitHub",
      description:
        "Import a skill from a public (or credentialed private) GitHub repo by URL — references the repo " +
        "directly, no files re-uploaded. URL may point at a repo root or a subdirectory (e.g. .../tree/main/skills/foo).",
      inputSchema: {
        github_url: z.string().describe("GitHub repo or subdirectory URL"),
        branch: z.string().optional().describe("Branch to use (default: main)"),
        credential_id: z
          .string()
          .optional()
          .describe("GitHub credential id, for private repos"),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async (args, extra) => {
      const result = await client.importSkillFromGithub(args, extra.signal);
      return {
        content: [
          {
            type: "text",
            text: `Imported skill \`${result.id}\` (v${result.version}) from GitHub.\n\n${JSON.stringify(result, null, 2)}`,
          },
        ],
      };
    },
  );

  server.registerTool(
    "lyzr_skill_register_global",
    {
      title: "Register Global Skill (admin)",
      description:
        "Register a GitHub-hosted skill as globally available to all users. Requires the org's master/admin key — " +
        "will fail for a normal user API key.",
      inputSchema: {
        url: z.string().describe("GitHub repo or subdirectory URL"),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async ({ url }, extra) => {
      const result = await client.registerGlobalSkill(url, extra.signal);
      return {
        content: [
          { type: "text", text: JSON.stringify(result, null, 2) },
        ],
      };
    },
  );

  server.registerTool(
    "lyzr_skill_list",
    {
      title: "List Skills",
      description: "List skills, optionally filtered by search text or type.",
      inputSchema: {
        limit: z.number().int().min(1).max(200).optional().describe("Default 50"),
        offset: z.number().int().min(0).optional(),
        search: z.string().optional().describe("Filter by name or description"),
        skill_type: z
          .enum(["global", "user", "org", "shared"])
          .optional()
          .describe("Filter by skill type"),
      },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async (args, extra) => {
      const result = await client.listSkills(args, extra.signal);
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    },
  );

  server.registerTool(
    "lyzr_skill_list_by_ids",
    {
      title: "Batch Get Skills",
      description: "Fetch latest metadata for a specific set of skill ids in one call.",
      inputSchema: {
        skill_ids: z.array(z.string()).min(1),
      },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ skill_ids }, extra) => {
      const result = await client.listSkillsByIds(skill_ids, extra.signal);
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    },
  );

  server.registerTool(
    "lyzr_skill_get",
    {
      title: "Get Skill",
      description: "Fetch a single skill's metadata.",
      inputSchema: {
        skill_id: z.string(),
        version: z.number().int().min(1).optional().describe("Specific version, defaults to latest"),
      },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ skill_id, version }, extra) => {
      const result = await client.getSkill(skill_id, version, extra.signal);
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    },
  );

  server.registerTool(
    "lyzr_skill_update",
    {
      title: "Update Skill Metadata",
      description: "Update a skill's name, description, or sharing (private vs organization-wide).",
      inputSchema: {
        skill_id: z.string(),
        name: z.string().optional(),
        description: z.string().optional(),
        share_type: z.enum(["private", "organization"]).optional(),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ skill_id, ...updates }, extra) => {
      const result = await client.updateSkillMetadata(skill_id, updates, extra.signal);
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    },
  );

  server.registerTool(
    "lyzr_skill_delete",
    {
      title: "Delete Skill",
      description: "Permanently delete a skill (its DB record and GitHub repo). Irreversible.",
      inputSchema: {
        skill_id: z.string(),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ skill_id }, extra) => {
      const result = await client.deleteSkill(skill_id, extra.signal);
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    },
  );

  server.registerTool(
    "lyzr_skill_get_content",
    {
      title: "Get Skill File Content",
      description: "Fetch a file's content from a skill's repo (default SKILL.md).",
      inputSchema: {
        skill_id: z.string(),
        path: z.string().optional().describe("File path inside the repo (default SKILL.md)"),
        ref: z.string().optional().describe("Git ref: branch, tag, or commit SHA"),
      },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ skill_id, path, ref }, extra) => {
      const result = await client.getSkillContent(skill_id, path, ref, extra.signal);
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    },
  );

  server.registerTool(
    "lyzr_skill_create_version",
    {
      title: "Create Skill Version",
      description: "Upload a new version of an existing skill's files.",
      inputSchema: {
        skill_id: z.string(),
        files: z
          .array(
            z.object({
              filename: z.string(),
              content_base64: z.string(),
            }),
          )
          .min(1),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async ({ skill_id, files }, extra) => {
      const result = await client.createSkillVersion(
        skill_id,
        files.map((f) => ({
          data: Buffer.from(f.content_base64, "base64"),
          filename: f.filename,
        })),
        extra.signal,
      );
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    },
  );

  server.registerTool(
    "lyzr_skill_list_versions",
    {
      title: "List Skill Versions",
      description: "List a skill's version history.",
      inputSchema: {
        skill_id: z.string(),
        limit: z.number().int().min(1).max(200).optional(),
        offset: z.number().int().min(0).optional(),
      },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ skill_id, ...params }, extra) => {
      const result = await client.listSkillVersions(skill_id, params, extra.signal);
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    },
  );

  server.registerTool(
    "lyzr_skill_delete_version",
    {
      title: "Delete Skill Version",
      description: "Delete a specific version of a skill. Irreversible.",
      inputSchema: {
        skill_id: z.string(),
        version: z.number().int().min(1),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ skill_id, version }, extra) => {
      const result = await client.deleteSkillVersion(skill_id, version, extra.signal);
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    },
  );
};
