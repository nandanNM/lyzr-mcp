import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { GitAgentClient } from "../lyzr/git-agent.js";

const txt = (data: unknown) => ({
  content: [
    {
      type: "text" as const,
      text: typeof data === "string" ? data : JSON.stringify(data, null, 2),
    },
  ],
});

const approvalGateSchema = z
  .object({})
  .catchall(z.unknown())
  .describe("An approval gate definition for the governance pipeline");

/** Register the Git Agent tools. */
export const registerGitAgentTools = (
  server: McpServer,
  client: GitAgentClient,
) => {
  server.registerTool(
    "lyzr_git_save_config",
    {
      title: "Save Git Config",
      description:
        "Save or update the git connection (provider, repo, credentials) for an agent.",
      inputSchema: {
        agent_id: z.string().describe("Agent id"),
        provider: z
          .string()
          .optional()
          .describe("Git provider, e.g. github (default github)"),
        repo_name: z.string().describe("Repository name"),
        org: z.string().optional().describe("Organization/owner name"),
        pat: z.string().optional().describe("Personal access token"),
        branch: z
          .string()
          .optional()
          .describe("Default branch to use (default main)"),
        base_url: z
          .string()
          .optional()
          .describe("Base URL for self-hosted git providers"),
        environments: z
          .array(z.string())
          .optional()
          .describe("List of deployment environment names"),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async ({ agent_id, ...rest }, extra) =>
      txt(await client.saveGitConfig(agent_id, rest, extra.signal)),
  );

  server.registerTool(
    "lyzr_git_disconnect",
    {
      title: "Disconnect Git",
      description: "Disconnect the git integration for an agent.",
      inputSchema: {
        agent_id: z.string().describe("Agent id"),
        purge: z
          .boolean()
          .optional()
          .describe("Whether to purge stored git data (default false)"),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ agent_id, purge }, extra) =>
      txt(await client.disconnectGit(agent_id, purge, extra.signal)),
  );

  server.registerTool(
    "lyzr_git_validate_config",
    {
      title: "Validate Git Config",
      description:
        "Validate a git connection configuration for an agent without saving it.",
      inputSchema: {
        agent_id: z.string().describe("Agent id"),
        provider: z
          .string()
          .optional()
          .describe("Git provider, e.g. github (default github)"),
        repo_name: z.string().describe("Repository name"),
        org: z.string().optional().describe("Organization/owner name"),
        pat: z.string().optional().describe("Personal access token"),
        branch: z
          .string()
          .optional()
          .describe("Default branch to use (default main)"),
        base_url: z
          .string()
          .optional()
          .describe("Base URL for self-hosted git providers"),
        environments: z
          .array(z.string())
          .optional()
          .describe("List of deployment environment names"),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async ({ agent_id, ...rest }, extra) =>
      txt(await client.validateGitConfig(agent_id, rest, extra.signal)),
  );

  server.registerTool(
    "lyzr_git_pull",
    {
      title: "Pull From Git",
      description: "Pull the latest changes from git for an agent's repo.",
      inputSchema: {
        agent_id: z.string().describe("Agent id"),
        branch: z
          .string()
          .optional()
          .describe("Branch to pull (defaults to the configured branch)"),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async ({ agent_id, branch }, extra) =>
      txt(await client.pullFromGit(agent_id, { branch }, extra.signal)),
  );

  server.registerTool(
    "lyzr_git_init_repo",
    {
      title: "Init Git Repo",
      description: "Initialize the git repository for an agent.",
      inputSchema: {
        agent_id: z.string().describe("Agent id"),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async ({ agent_id }, extra) =>
      txt(await client.initGitRepo(agent_id, extra.signal)),
  );

  server.registerTool(
    "lyzr_git_get_status",
    {
      title: "Get Git Status",
      description: "Get the current git status for an agent's repo.",
      inputSchema: {
        agent_id: z.string().describe("Agent id"),
      },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ agent_id }, extra) =>
      txt(await client.getGitStatus(agent_id, extra.signal)),
  );

  server.registerTool(
    "lyzr_git_list_commits",
    {
      title: "List Commits",
      description:
        "List commits for an agent's git repo, optionally filtered by branch.",
      inputSchema: {
        agent_id: z.string().describe("Agent id"),
        branch: z.string().optional().describe("Branch to filter commits by"),
      },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ agent_id, branch }, extra) =>
      txt(await client.listCommits(agent_id, branch, extra.signal)),
  );

  server.registerTool(
    "lyzr_git_create_pr",
    {
      title: "Create PR",
      description:
        "Create a pull request between two branches of an agent's repo.",
      inputSchema: {
        agent_id: z.string().describe("Agent id"),
        source_branch: z.string().describe("Source branch"),
        target_branch: z.string().describe("Target branch"),
        title: z.string().describe("Pull request title"),
        description: z.string().optional().describe("Pull request description"),
        reviewers: z
          .array(z.string())
          .optional()
          .describe("List of reviewer usernames"),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async ({ agent_id, ...rest }, extra) =>
      txt(await client.createPr(agent_id, rest, extra.signal)),
  );

  server.registerTool(
    "lyzr_git_list_prs",
    {
      title: "List PRs",
      description: "List pull requests for an agent's git repo.",
      inputSchema: {
        agent_id: z.string().describe("Agent id"),
      },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ agent_id }, extra) =>
      txt(await client.listPrs(agent_id, extra.signal)),
  );

  server.registerTool(
    "lyzr_git_merge_branches",
    {
      title: "Merge Branches",
      description: "Merge one branch into another in an agent's git repo.",
      inputSchema: {
        agent_id: z.string().describe("Agent id"),
        source_branch: z.string().describe("Branch to merge from"),
        target_branch: z.string().describe("Branch to merge into"),
        commit_message: z
          .string()
          .optional()
          .describe("Custom merge commit message"),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async ({ agent_id, ...rest }, extra) =>
      txt(await client.mergeBranches(agent_id, rest, extra.signal)),
  );

  server.registerTool(
    "lyzr_git_deploy_branch",
    {
      title: "Deploy Branch",
      description: "Deploy a branch of an agent's git repo.",
      inputSchema: {
        agent_id: z.string().describe("Agent id"),
        branch: z.string().describe("Branch to deploy"),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async ({ agent_id, branch }, extra) =>
      txt(await client.deployBranch(agent_id, { branch }, extra.signal)),
  );

  server.registerTool(
    "lyzr_git_update_reviewers",
    {
      title: "Update Reviewers",
      description: "Update the list of reviewers for an agent's git repo.",
      inputSchema: {
        agent_id: z.string().describe("Agent id"),
        reviewers: z.array(z.string()).describe("List of reviewer usernames"),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async ({ agent_id, reviewers }, extra) =>
      txt(await client.updateReviewers(agent_id, { reviewers }, extra.signal)),
  );

  server.registerTool(
    "lyzr_git_switch_branch",
    {
      title: "Switch Branch",
      description: "Switch the active branch for an agent's git repo.",
      inputSchema: {
        agent_id: z.string().describe("Agent id"),
        branch: z.string().describe("Branch to switch to"),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async ({ agent_id, branch }, extra) =>
      txt(await client.switchBranch(agent_id, { branch }, extra.signal)),
  );

  server.registerTool(
    "lyzr_git_create_branch",
    {
      title: "Create Branch",
      description: "Create a new branch in an agent's git repo.",
      inputSchema: {
        agent_id: z.string().describe("Agent id"),
        branch_name: z.string().describe("Name of the new branch"),
        from_branch: z
          .string()
          .optional()
          .describe("Branch to create the new branch from"),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async ({ agent_id, ...rest }, extra) =>
      txt(await client.createBranch(agent_id, rest, extra.signal)),
  );

  server.registerTool(
    "lyzr_git_list_branches",
    {
      title: "List Branches",
      description: "List branches in an agent's git repo.",
      inputSchema: {
        agent_id: z.string().describe("Agent id"),
      },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ agent_id }, extra) =>
      txt(await client.listBranches(agent_id, extra.signal)),
  );

  server.registerTool(
    "lyzr_git_get_commit_snapshot",
    {
      title: "Get Commit Snapshot",
      description: "Get a snapshot of the repo state at a specific commit.",
      inputSchema: {
        agent_id: z.string().describe("Agent id"),
        commit_sha: z.string().describe("Commit SHA"),
      },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ agent_id, commit_sha }, extra) =>
      txt(await client.getCommitSnapshot(agent_id, commit_sha, extra.signal)),
  );

  server.registerTool(
    "lyzr_git_restore_commit",
    {
      title: "Restore Commit",
      description: "Restore the repo to the state of a specific commit.",
      inputSchema: {
        agent_id: z.string().describe("Agent id"),
        commit_sha: z.string().describe("Commit SHA to restore"),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async ({ agent_id, commit_sha }, extra) =>
      txt(await client.restoreCommit(agent_id, commit_sha, extra.signal)),
  );

  server.registerTool(
    "lyzr_git_list_repo_files",
    {
      title: "List Repo Files",
      description:
        "List files in an agent's git repo, optionally at a specific branch.",
      inputSchema: {
        agent_id: z.string().describe("Agent id"),
        branch: z.string().optional().describe("Branch to list files from"),
      },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ agent_id, branch }, extra) =>
      txt(await client.listRepoFiles(agent_id, branch, extra.signal)),
  );

  server.registerTool(
    "lyzr_git_get_file_content",
    {
      title: "Get File Content",
      description: "Get the content of a file in an agent's git repo.",
      inputSchema: {
        agent_id: z.string().describe("Agent id"),
        file_path: z.string().describe("Path to the file within the repo"),
        branch: z.string().optional().describe("Branch to read the file from"),
      },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ agent_id, file_path, branch }, extra) =>
      txt(
        await client.getFileContent(agent_id, file_path, branch, extra.signal),
      ),
  );

  server.registerTool(
    "lyzr_git_save_file_content",
    {
      title: "Save File Content",
      description:
        "Save (create or update) a file's content in an agent's git repo.",
      inputSchema: {
        agent_id: z.string().describe("Agent id"),
        file_path: z.string().describe("Path to the file within the repo"),
        content: z.string().describe("New file content"),
        message: z.string().optional().describe("Commit message"),
        branch: z.string().optional().describe("Branch to save the file to"),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async ({ agent_id, ...rest }, extra) =>
      txt(await client.saveFileContent(agent_id, rest, extra.signal)),
  );

  server.registerTool(
    "lyzr_git_get_governance",
    {
      title: "Get Governance",
      description: "Get the governance policy for an agent's git repo.",
      inputSchema: {
        agent_id: z.string().describe("Agent id"),
      },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ agent_id }, extra) =>
      txt(await client.getGovernance(agent_id, extra.signal)),
  );

  server.registerTool(
    "lyzr_git_save_governance",
    {
      title: "Save Governance",
      description:
        "Save or update the governance (approval pipeline) policy for an agent's git repo.",
      inputSchema: {
        agent_id: z.string().describe("Agent id"),
        entity_type: z
          .string()
          .optional()
          .describe("Entity type the policy applies to (default agent)"),
        name: z
          .string()
          .optional()
          .describe("Policy name (default 'Default Pipeline')"),
        gates: z
          .array(approvalGateSchema)
          .optional()
          .describe("List of approval gates in the pipeline"),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async ({ agent_id, ...rest }, extra) =>
      txt(await client.saveGovernance(agent_id, rest, extra.signal)),
  );

  server.registerTool(
    "lyzr_git_delete_governance",
    {
      title: "Delete Governance",
      description: "Delete the governance policy for an agent's git repo.",
      inputSchema: {
        agent_id: z.string().describe("Agent id"),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ agent_id }, extra) =>
      txt(await client.deleteGovernance(agent_id, extra.signal)),
  );

  server.registerTool(
    "lyzr_git_sync_governance",
    {
      title: "Sync Governance",
      description: "Sync the governance policy for an agent's git repo.",
      inputSchema: {
        agent_id: z.string().describe("Agent id"),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async ({ agent_id }, extra) =>
      txt(await client.syncGovernance(agent_id, extra.signal)),
  );
};
