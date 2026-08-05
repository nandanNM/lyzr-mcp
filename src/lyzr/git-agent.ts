/**
 * Lyzr Git Agent client (host: agent-prod).
 * Manages an agent's git integration: config, branches, commits, PRs, merges,
 * deploys, file content, reviewers, and governance policies.
 */
import { LyzrHttp, LyzrApiError, normalizeList } from "./http.js";

export { LyzrApiError };

export interface GitConfigInput {
  provider?: string;
  repo_name: string;
  org?: string | null;
  pat?: string | null;
  branch?: string;
  base_url?: string | null;
  environments?: string[] | null;
  [key: string]: unknown;
}

export interface PullConfigInput {
  branch?: string | null;
}

export interface CreatePRInput {
  source_branch: string;
  target_branch: string;
  title: string;
  description?: string | null;
  reviewers?: string[] | null;
}

export interface MergeBranchInput {
  source_branch: string;
  target_branch: string;
  commit_message?: string | null;
}

export interface DeployBranchInput {
  branch: string;
}

export interface UpdateReviewersInput {
  reviewers: string[];
}

export interface SwitchBranchInput {
  branch: string;
}

export interface CreateBranchInput {
  branch_name: string;
  from_branch?: string | null;
}

export interface SaveFileInput {
  file_path: string;
  content: string;
  message?: string | null;
  branch?: string | null;
}

export interface ApprovalGate {
  [key: string]: unknown;
}

export interface GovernancePolicyInput {
  entity_type?: string;
  name?: string;
  gates?: ApprovalGate[];
}

export interface GitAgentResult {
  [key: string]: unknown;
}

export class GitAgentClient extends LyzrHttp {
  /** Save Git Config. PUT /v3/git-agent/{agent_id}/config */
  saveGitConfig(
    agentId: string,
    input: GitConfigInput,
    signal?: AbortSignal,
  ): Promise<GitAgentResult> {
    return this.request<GitAgentResult>(
      "PUT",
      `/v3/git-agent/${agentId}/config`,
      { body: input, signal },
    );
  }

  /** Disconnect Git. DELETE /v3/git-agent/{agent_id}/config */
  disconnectGit(
    agentId: string,
    purge?: boolean,
    signal?: AbortSignal,
  ): Promise<GitAgentResult> {
    return this.request<GitAgentResult>(
      "DELETE",
      `/v3/git-agent/${agentId}/config`,
      { params: { purge }, signal },
    );
  }

  /** Validate Git Config. POST /v3/git-agent/{agent_id}/config/validate */
  validateGitConfig(
    agentId: string,
    input: GitConfigInput,
    signal?: AbortSignal,
  ): Promise<GitAgentResult> {
    return this.request<GitAgentResult>(
      "POST",
      `/v3/git-agent/${agentId}/config/validate`,
      { body: input, signal },
    );
  }

  /** Pull From Git. POST /v3/git-agent/{agent_id}/pull */
  pullFromGit(
    agentId: string,
    input: PullConfigInput = {},
    signal?: AbortSignal,
  ): Promise<GitAgentResult> {
    return this.request<GitAgentResult>(
      "POST",
      `/v3/git-agent/${agentId}/pull`,
      { body: input, signal },
    );
  }

  /** Init Git Repo. POST /v3/git-agent/{agent_id}/init */
  initGitRepo(agentId: string, signal?: AbortSignal): Promise<GitAgentResult> {
    return this.request<GitAgentResult>(
      "POST",
      `/v3/git-agent/${agentId}/init`,
      { signal },
    );
  }

  /** Get Git Status. GET /v3/git-agent/{agent_id}/status */
  getGitStatus(agentId: string, signal?: AbortSignal): Promise<GitAgentResult> {
    return this.request<GitAgentResult>(
      "GET",
      `/v3/git-agent/${agentId}/status`,
      { signal },
    );
  }

  /** List Commits. GET /v3/git-agent/{agent_id}/commits */
  listCommits(
    agentId: string,
    branch?: string,
    signal?: AbortSignal,
  ): Promise<unknown[]> {
    return this.request<unknown[]>("GET", `/v3/git-agent/${agentId}/commits`, {
      params: { branch },
      signal,
    }).then((raw) => normalizeList(raw, "commits"));
  }

  /** Create Pr. POST /v3/git-agent/{agent_id}/pr */
  createPr(
    agentId: string,
    input: CreatePRInput,
    signal?: AbortSignal,
  ): Promise<GitAgentResult> {
    return this.request<GitAgentResult>("POST", `/v3/git-agent/${agentId}/pr`, {
      body: input,
      signal,
    });
  }

  /** List Prs. GET /v3/git-agent/{agent_id}/prs */
  listPrs(agentId: string, signal?: AbortSignal): Promise<unknown[]> {
    return this.request<unknown[]>("GET", `/v3/git-agent/${agentId}/prs`, {
      signal,
    }).then((raw) => normalizeList(raw, "prs"));
  }

  /** Merge Branches. POST /v3/git-agent/{agent_id}/merge */
  mergeBranches(
    agentId: string,
    input: MergeBranchInput,
    signal?: AbortSignal,
  ): Promise<GitAgentResult> {
    return this.request<GitAgentResult>(
      "POST",
      `/v3/git-agent/${agentId}/merge`,
      { body: input, signal },
    );
  }

  /** Deploy Branch. POST /v3/git-agent/{agent_id}/deploy */
  deployBranch(
    agentId: string,
    input: DeployBranchInput,
    signal?: AbortSignal,
  ): Promise<GitAgentResult> {
    return this.request<GitAgentResult>(
      "POST",
      `/v3/git-agent/${agentId}/deploy`,
      { body: input, signal },
    );
  }

  /** Update Reviewers. PUT /v3/git-agent/{agent_id}/reviewers */
  updateReviewers(
    agentId: string,
    input: UpdateReviewersInput,
    signal?: AbortSignal,
  ): Promise<GitAgentResult> {
    return this.request<GitAgentResult>(
      "PUT",
      `/v3/git-agent/${agentId}/reviewers`,
      { body: input, signal },
    );
  }

  /** Switch Branch. PUT /v3/git-agent/{agent_id}/branch */
  switchBranch(
    agentId: string,
    input: SwitchBranchInput,
    signal?: AbortSignal,
  ): Promise<GitAgentResult> {
    return this.request<GitAgentResult>(
      "PUT",
      `/v3/git-agent/${agentId}/branch`,
      { body: input, signal },
    );
  }

  /** Create Branch. POST /v3/git-agent/{agent_id}/branches */
  createBranch(
    agentId: string,
    input: CreateBranchInput,
    signal?: AbortSignal,
  ): Promise<GitAgentResult> {
    return this.request<GitAgentResult>(
      "POST",
      `/v3/git-agent/${agentId}/branches`,
      { body: input, signal },
    );
  }

  /** List Branches. GET /v3/git-agent/{agent_id}/branches */
  listBranches(agentId: string, signal?: AbortSignal): Promise<unknown[]> {
    return this.request<unknown[]>("GET", `/v3/git-agent/${agentId}/branches`, {
      signal,
    }).then((raw) => normalizeList(raw, "branches"));
  }

  /** Get Commit Snapshot. GET /v3/git-agent/{agent_id}/commits/{commit_sha}/snapshot */
  getCommitSnapshot(
    agentId: string,
    commitSha: string,
    signal?: AbortSignal,
  ): Promise<GitAgentResult> {
    return this.request<GitAgentResult>(
      "GET",
      `/v3/git-agent/${agentId}/commits/${commitSha}/snapshot`,
      { signal },
    );
  }

  /** Restore Commit. POST /v3/git-agent/{agent_id}/commits/{commit_sha}/restore */
  restoreCommit(
    agentId: string,
    commitSha: string,
    signal?: AbortSignal,
  ): Promise<GitAgentResult> {
    return this.request<GitAgentResult>(
      "POST",
      `/v3/git-agent/${agentId}/commits/${commitSha}/restore`,
      { signal },
    );
  }

  /** List Repo Files. GET /v3/git-agent/{agent_id}/files */
  listRepoFiles(
    agentId: string,
    branch?: string,
    signal?: AbortSignal,
  ): Promise<unknown[]> {
    return this.request<unknown[]>("GET", `/v3/git-agent/${agentId}/files`, {
      params: { branch },
      signal,
    }).then((raw) => normalizeList(raw, "files"));
  }

  /** Get File Content. GET /v3/git-agent/{agent_id}/files/content */
  getFileContent(
    agentId: string,
    filePath: string,
    branch?: string,
    signal?: AbortSignal,
  ): Promise<unknown> {
    return this.request<unknown>(
      "GET",
      `/v3/git-agent/${agentId}/files/content`,
      { params: { file_path: filePath, branch }, signal },
    );
  }

  /** Save File Content. PUT /v3/git-agent/{agent_id}/files/content */
  saveFileContent(
    agentId: string,
    input: SaveFileInput,
    signal?: AbortSignal,
  ): Promise<GitAgentResult> {
    return this.request<GitAgentResult>(
      "PUT",
      `/v3/git-agent/${agentId}/files/content`,
      { body: input, signal },
    );
  }

  /** Get Governance. GET /v3/git-agent/{agent_id}/governance */
  getGovernance(
    agentId: string,
    signal?: AbortSignal,
  ): Promise<GitAgentResult> {
    return this.request<GitAgentResult>(
      "GET",
      `/v3/git-agent/${agentId}/governance`,
      { signal },
    );
  }

  /** Save Governance. PUT /v3/git-agent/{agent_id}/governance */
  saveGovernance(
    agentId: string,
    input: GovernancePolicyInput,
    signal?: AbortSignal,
  ): Promise<GitAgentResult> {
    return this.request<GitAgentResult>(
      "PUT",
      `/v3/git-agent/${agentId}/governance`,
      { body: input, signal },
    );
  }

  /** Delete Governance. DELETE /v3/git-agent/{agent_id}/governance */
  deleteGovernance(
    agentId: string,
    signal?: AbortSignal,
  ): Promise<GitAgentResult> {
    return this.request<GitAgentResult>(
      "DELETE",
      `/v3/git-agent/${agentId}/governance`,
      { signal },
    );
  }

  /** Sync Governance. POST /v3/git-agent/{agent_id}/governance/sync */
  syncGovernance(
    agentId: string,
    signal?: AbortSignal,
  ): Promise<GitAgentResult> {
    return this.request<GitAgentResult>(
      "POST",
      `/v3/git-agent/${agentId}/governance/sync`,
      { signal },
    );
  }
}
