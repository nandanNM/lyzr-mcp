import { describe, it, expect, vi } from "vitest";
import { GitAgentClient, LyzrApiError } from "../src/lyzr/git-agent";

const okJson = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });

const mk = (fetchImpl: typeof fetch, baseUrl = "https://agent.test") =>
  new GitAgentClient({ apiKey: "k", baseUrl, fetchImpl });

describe("GitAgentClient", () => {
  it("saveGitConfig PUTs /v3/git-agent/{agent_id}/config with body", async () => {
    const f = vi.fn(async () => okJson({ ok: true }));
    const c = mk(f as unknown as typeof fetch);
    await c.saveGitConfig("a1", { repo_name: "my-repo", org: "acme" });
    const [url, init] = f.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://agent.test/v3/git-agent/a1/config");
    expect(init.method).toBe("PUT");
    expect(JSON.parse(init.body as string)).toEqual({
      repo_name: "my-repo",
      org: "acme",
    });
  });

  it("disconnectGit DELETEs /v3/git-agent/{agent_id}/config with purge param", async () => {
    const f = vi.fn(async () => okJson({ ok: true }));
    const c = mk(f as unknown as typeof fetch);
    await c.disconnectGit("a1", true);
    const [url, init] = f.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://agent.test/v3/git-agent/a1/config?purge=true");
    expect(init.method).toBe("DELETE");
  });

  it("validateGitConfig POSTs /v3/git-agent/{agent_id}/config/validate", async () => {
    const f = vi.fn(async () => okJson({ valid: true }));
    const c = mk(f as unknown as typeof fetch);
    await c.validateGitConfig("a1", { repo_name: "r" });
    const [url, init] = f.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://agent.test/v3/git-agent/a1/config/validate");
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body as string)).toEqual({ repo_name: "r" });
  });

  it("pullFromGit POSTs /v3/git-agent/{agent_id}/pull with branch body", async () => {
    const f = vi.fn(async () => okJson({ ok: true }));
    const c = mk(f as unknown as typeof fetch);
    await c.pullFromGit("a1", { branch: "main" });
    const [url, init] = f.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://agent.test/v3/git-agent/a1/pull");
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body as string)).toEqual({ branch: "main" });
  });

  it("initGitRepo POSTs /v3/git-agent/{agent_id}/init", async () => {
    const f = vi.fn(async () => okJson({ ok: true }));
    const c = mk(f as unknown as typeof fetch);
    await c.initGitRepo("a1");
    const [url, init] = f.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://agent.test/v3/git-agent/a1/init");
    expect(init.method).toBe("POST");
  });

  it("getGitStatus GETs /v3/git-agent/{agent_id}/status", async () => {
    const f = vi.fn(async () => okJson({ status: "clean" }));
    const c = mk(f as unknown as typeof fetch);
    await c.getGitStatus("a1");
    const [url, init] = f.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://agent.test/v3/git-agent/a1/status");
    expect(init.method).toBe("GET");
  });

  it("listCommits GETs /v3/git-agent/{agent_id}/commits with branch param", async () => {
    const f = vi.fn(async () => okJson([{ sha: "abc" }]));
    const c = mk(f as unknown as typeof fetch);
    const commits = await c.listCommits("a1", "main");
    const [url] = f.mock.calls[0] as [string];
    expect(url).toBe("https://agent.test/v3/git-agent/a1/commits?branch=main");
    expect(commits).toEqual([{ sha: "abc" }]);
  });

  it("createPr POSTs /v3/git-agent/{agent_id}/pr with body", async () => {
    const f = vi.fn(async () => okJson({ id: "pr1" }));
    const c = mk(f as unknown as typeof fetch);
    await c.createPr("a1", {
      source_branch: "feat",
      target_branch: "main",
      title: "My PR",
    });
    const [url, init] = f.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://agent.test/v3/git-agent/a1/pr");
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body as string)).toEqual({
      source_branch: "feat",
      target_branch: "main",
      title: "My PR",
    });
  });

  it("listPrs GETs /v3/git-agent/{agent_id}/prs", async () => {
    const f = vi.fn(async () => okJson([{ id: "pr1" }]));
    const c = mk(f as unknown as typeof fetch);
    const prs = await c.listPrs("a1");
    const [url] = f.mock.calls[0] as [string];
    expect(url).toBe("https://agent.test/v3/git-agent/a1/prs");
    expect(prs).toEqual([{ id: "pr1" }]);
  });

  it("mergeBranches POSTs /v3/git-agent/{agent_id}/merge with body", async () => {
    const f = vi.fn(async () => okJson({ ok: true }));
    const c = mk(f as unknown as typeof fetch);
    await c.mergeBranches("a1", {
      source_branch: "feat",
      target_branch: "main",
    });
    const [url, init] = f.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://agent.test/v3/git-agent/a1/merge");
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body as string)).toEqual({
      source_branch: "feat",
      target_branch: "main",
    });
  });

  it("deployBranch POSTs /v3/git-agent/{agent_id}/deploy with body", async () => {
    const f = vi.fn(async () => okJson({ ok: true }));
    const c = mk(f as unknown as typeof fetch);
    await c.deployBranch("a1", { branch: "main" });
    const [url, init] = f.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://agent.test/v3/git-agent/a1/deploy");
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body as string)).toEqual({ branch: "main" });
  });

  it("updateReviewers PUTs /v3/git-agent/{agent_id}/reviewers with body", async () => {
    const f = vi.fn(async () => okJson({ ok: true }));
    const c = mk(f as unknown as typeof fetch);
    await c.updateReviewers("a1", { reviewers: ["bob", "alice"] });
    const [url, init] = f.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://agent.test/v3/git-agent/a1/reviewers");
    expect(init.method).toBe("PUT");
    expect(JSON.parse(init.body as string)).toEqual({
      reviewers: ["bob", "alice"],
    });
  });

  it("switchBranch PUTs /v3/git-agent/{agent_id}/branch with body", async () => {
    const f = vi.fn(async () => okJson({ ok: true }));
    const c = mk(f as unknown as typeof fetch);
    await c.switchBranch("a1", { branch: "dev" });
    const [url, init] = f.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://agent.test/v3/git-agent/a1/branch");
    expect(init.method).toBe("PUT");
    expect(JSON.parse(init.body as string)).toEqual({ branch: "dev" });
  });

  it("createBranch POSTs /v3/git-agent/{agent_id}/branches with body", async () => {
    const f = vi.fn(async () => okJson({ ok: true }));
    const c = mk(f as unknown as typeof fetch);
    await c.createBranch("a1", {
      branch_name: "feature-x",
      from_branch: "main",
    });
    const [url, init] = f.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://agent.test/v3/git-agent/a1/branches");
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body as string)).toEqual({
      branch_name: "feature-x",
      from_branch: "main",
    });
  });

  it("listBranches GETs /v3/git-agent/{agent_id}/branches", async () => {
    const f = vi.fn(async () => okJson(["main", "dev"]));
    const c = mk(f as unknown as typeof fetch);
    const branches = await c.listBranches("a1");
    const [url] = f.mock.calls[0] as [string];
    expect(url).toBe("https://agent.test/v3/git-agent/a1/branches");
    expect(branches).toEqual(["main", "dev"]);
  });

  it("getCommitSnapshot GETs /v3/git-agent/{agent_id}/commits/{commit_sha}/snapshot", async () => {
    const f = vi.fn(async () => okJson({ files: [] }));
    const c = mk(f as unknown as typeof fetch);
    await c.getCommitSnapshot("a1", "sha123");
    const [url, init] = f.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(
      "https://agent.test/v3/git-agent/a1/commits/sha123/snapshot",
    );
    expect(init.method).toBe("GET");
  });

  it("restoreCommit POSTs /v3/git-agent/{agent_id}/commits/{commit_sha}/restore", async () => {
    const f = vi.fn(async () => okJson({ ok: true }));
    const c = mk(f as unknown as typeof fetch);
    await c.restoreCommit("a1", "sha123");
    const [url, init] = f.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(
      "https://agent.test/v3/git-agent/a1/commits/sha123/restore",
    );
    expect(init.method).toBe("POST");
  });

  it("listRepoFiles GETs /v3/git-agent/{agent_id}/files with branch param", async () => {
    const f = vi.fn(async () => okJson(["a.py", "b.py"]));
    const c = mk(f as unknown as typeof fetch);
    const files = await c.listRepoFiles("a1", "main");
    const [url] = f.mock.calls[0] as [string];
    expect(url).toBe("https://agent.test/v3/git-agent/a1/files?branch=main");
    expect(files).toEqual(["a.py", "b.py"]);
  });

  it("getFileContent GETs /v3/git-agent/{agent_id}/files/content with query params", async () => {
    const f = vi.fn(async () => okJson({ content: "print(1)" }));
    const c = mk(f as unknown as typeof fetch);
    await c.getFileContent("a1", "src/a.py", "main");
    const [url, init] = f.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(
      "https://agent.test/v3/git-agent/a1/files/content?file_path=src%2Fa.py&branch=main",
    );
    expect(init.method).toBe("GET");
  });

  it("saveFileContent PUTs /v3/git-agent/{agent_id}/files/content with body", async () => {
    const f = vi.fn(async () => okJson({ ok: true }));
    const c = mk(f as unknown as typeof fetch);
    await c.saveFileContent("a1", {
      file_path: "src/a.py",
      content: "print(2)",
    });
    const [url, init] = f.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://agent.test/v3/git-agent/a1/files/content");
    expect(init.method).toBe("PUT");
    expect(JSON.parse(init.body as string)).toEqual({
      file_path: "src/a.py",
      content: "print(2)",
    });
  });

  it("getGovernance GETs /v3/git-agent/{agent_id}/governance", async () => {
    const f = vi.fn(async () => okJson({ gates: [] }));
    const c = mk(f as unknown as typeof fetch);
    await c.getGovernance("a1");
    const [url, init] = f.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://agent.test/v3/git-agent/a1/governance");
    expect(init.method).toBe("GET");
  });

  it("saveGovernance PUTs /v3/git-agent/{agent_id}/governance with body", async () => {
    const f = vi.fn(async () => okJson({ ok: true }));
    const c = mk(f as unknown as typeof fetch);
    await c.saveGovernance("a1", { name: "Pipeline", gates: [] });
    const [url, init] = f.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://agent.test/v3/git-agent/a1/governance");
    expect(init.method).toBe("PUT");
    expect(JSON.parse(init.body as string)).toEqual({
      name: "Pipeline",
      gates: [],
    });
  });

  it("deleteGovernance DELETEs /v3/git-agent/{agent_id}/governance", async () => {
    const f = vi.fn(async () => okJson({ ok: true }));
    const c = mk(f as unknown as typeof fetch);
    await c.deleteGovernance("a1");
    const [url, init] = f.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://agent.test/v3/git-agent/a1/governance");
    expect(init.method).toBe("DELETE");
  });

  it("syncGovernance POSTs /v3/git-agent/{agent_id}/governance/sync", async () => {
    const f = vi.fn(async () => okJson({ ok: true }));
    const c = mk(f as unknown as typeof fetch);
    await c.syncGovernance("a1");
    const [url, init] = f.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://agent.test/v3/git-agent/a1/governance/sync");
    expect(init.method).toBe("POST");
  });

  it("throws LyzrApiError on non-2xx response", async () => {
    const f = vi.fn(
      async () =>
        new Response("not found", {
          status: 404,
          headers: { "Content-Type": "text/plain" },
        }),
    );
    const c = mk(f as unknown as typeof fetch);
    await expect(c.getGitStatus("missing")).rejects.toBeInstanceOf(
      LyzrApiError,
    );
  });
});
