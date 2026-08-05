import { describe, it, expect, vi } from "vitest";
import { SkillsClient, LyzrApiError } from "../src/lyzr/skills";

const okJson = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });

const mk = (fetchImpl: typeof fetch, baseUrl = "https://skills.test") =>
  new SkillsClient({ apiKey: "k", baseUrl, fetchImpl });

describe("SkillsClient", () => {
  it("createSkill POSTs multipart form to /v1/skills with files + credential_id", async () => {
    const f = vi.fn(async () =>
      okJson({ id: "skill_1", name: "foo", description: "d", version: 1, message: "ok" }),
    );
    const client = mk(f as unknown as typeof fetch);
    const result = await client.createSkill(
      [{ data: Buffer.from("---\nname: foo\n---\n"), filename: "SKILL.md" }],
      "cred-1",
    );
    const [url, init] = f.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://skills.test/v1/skills");
    expect(init.method).toBe("POST");
    expect(init.body).toBeInstanceOf(FormData);
    const form = init.body as FormData;
    expect(form.get("credential_id")).toBe("cred-1");
    expect(result.id).toBe("skill_1");
  });

  it("createSkill rejects an empty file list", async () => {
    const client = mk((async () => okJson({})) as unknown as typeof fetch);
    await expect(client.createSkill([])).rejects.toThrow(/at least one file/);
  });

  it("importSkillFromGithub POSTs to /v1/skills/import-github", async () => {
    const f = vi.fn(async () =>
      okJson({ id: "skill_2", name: "bar", description: "d", version: 1, message: "ok" }),
    );
    const client = mk(f as unknown as typeof fetch);
    await client.importSkillFromGithub({
      github_url: "https://github.com/owner/repo/tree/main/skills/bar",
      branch: "main",
    });
    const [url, init] = f.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://skills.test/v1/skills/import-github");
    expect(JSON.parse(init.body as string)).toEqual({
      github_url: "https://github.com/owner/repo/tree/main/skills/bar",
      branch: "main",
    });
  });

  it("registerGlobalSkill POSTs {url} to /v1/skills/register-global", async () => {
    const f = vi.fn(async () =>
      okJson({ id: "skill_3", name: "g", description: "d", version: 1, message: "ok" }),
    );
    const client = mk(f as unknown as typeof fetch);
    await client.registerGlobalSkill("https://github.com/owner/repo");
    const [url, init] = f.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://skills.test/v1/skills/register-global");
    expect(JSON.parse(init.body as string)).toEqual({
      url: "https://github.com/owner/repo",
    });
  });

  it("listSkills GETs /v1/skills with params and normalizes the {items,total} shape", async () => {
    const f = vi.fn(async () =>
      okJson({ items: [{ skill_id: "s1" }], total: 1 }),
    );
    const client = mk(f as unknown as typeof fetch);
    const result = await client.listSkills({ limit: 10, search: "foo" });
    const [url] = f.mock.calls[0] as [string];
    expect(url).toBe("https://skills.test/v1/skills?limit=10&search=foo");
    expect(result).toEqual({ items: [{ skill_id: "s1" }], total: 1 });
  });

  it("listSkills normalizes a bare-array response (no total wrapper)", async () => {
    const f = vi.fn(async () => okJson([{ skill_id: "s1" }, { skill_id: "s2" }]));
    const client = mk(f as unknown as typeof fetch);
    const result = await client.listSkills();
    expect(result).toEqual({
      items: [{ skill_id: "s1" }, { skill_id: "s2" }],
      total: 2,
    });
  });

  it("listSkillsByIds POSTs {skill_ids} to /v1/skills/batch", async () => {
    const f = vi.fn(async () => okJson([{ skill_id: "s1" }]));
    const client = mk(f as unknown as typeof fetch);
    await client.listSkillsByIds(["s1", "s2"]);
    const [url, init] = f.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://skills.test/v1/skills/batch");
    expect(JSON.parse(init.body as string)).toEqual({ skill_ids: ["s1", "s2"] });
  });

  it("getSkill GETs /v1/skills/{id} with optional version param", async () => {
    const f = vi.fn(async () => okJson({ skill_id: "s1", version: 2 }));
    const client = mk(f as unknown as typeof fetch);
    await client.getSkill("s1", 2);
    const [url] = f.mock.calls[0] as [string];
    expect(url).toBe("https://skills.test/v1/skills/s1?version=2");
  });

  it("updateSkillMetadata PUTs /v1/skills/{id} with the update body", async () => {
    const f = vi.fn(async () => okJson({ id: "s1", message: "ok" }));
    const client = mk(f as unknown as typeof fetch);
    await client.updateSkillMetadata("s1", { name: "new", share_type: "organization" });
    const [url, init] = f.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://skills.test/v1/skills/s1");
    expect(init.method).toBe("PUT");
    expect(JSON.parse(init.body as string)).toEqual({
      name: "new",
      share_type: "organization",
    });
  });

  it("deleteSkill DELETEs /v1/skills/{id}", async () => {
    const f = vi.fn(async () => okJson({ id: "s1", deleted_records: 1, message: "ok" }));
    const client = mk(f as unknown as typeof fetch);
    await client.deleteSkill("s1");
    const [url, init] = f.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://skills.test/v1/skills/s1");
    expect(init.method).toBe("DELETE");
  });

  it("getSkillContent GETs /v1/skills/{id}/content with path + ref", async () => {
    const f = vi.fn(async () =>
      okJson({ id: "s1", path: "SKILL.md", is_binary: false, content: "hi" }),
    );
    const client = mk(f as unknown as typeof fetch);
    await client.getSkillContent("s1", "SKILL.md", "main");
    const [url] = f.mock.calls[0] as [string];
    expect(url).toBe(
      "https://skills.test/v1/skills/s1/content?path=SKILL.md&ref=main",
    );
  });

  it("createSkillVersion POSTs multipart form to /v1/skills/{id}/versions", async () => {
    const f = vi.fn(async () =>
      okJson({ id: "s1", version: 2, tag: "v2", commit_sha: "abc", message: "ok" }),
    );
    const client = mk(f as unknown as typeof fetch);
    await client.createSkillVersion("s1", [
      { data: Buffer.from("content"), filename: "SKILL.md" },
    ]);
    const [url, init] = f.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://skills.test/v1/skills/s1/versions");
    expect(init.method).toBe("POST");
    expect(init.body).toBeInstanceOf(FormData);
  });

  it("listSkillVersions GETs /v1/skills/{id}/versions", async () => {
    const f = vi.fn(async () => okJson({ items: [{ skill_id: "s1", version: 1 }], total: 1 }));
    const client = mk(f as unknown as typeof fetch);
    const result = await client.listSkillVersions("s1", { limit: 5 });
    const [url] = f.mock.calls[0] as [string];
    expect(url).toBe("https://skills.test/v1/skills/s1/versions?limit=5");
    expect(result.total).toBe(1);
  });

  it("deleteSkillVersion DELETEs /v1/skills/{id}/versions/{version}", async () => {
    const f = vi.fn(async () =>
      okJson({ id: "s1", version: 1, tag: "v1", deleted_records: 1, message: "ok" }),
    );
    const client = mk(f as unknown as typeof fetch);
    await client.deleteSkillVersion("s1", 1);
    const [url, init] = f.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://skills.test/v1/skills/s1/versions/1");
    expect(init.method).toBe("DELETE");
  });

  it("throws LyzrApiError on non-2xx and never leaks the api key", async () => {
    const f = vi.fn(async () => new Response("nope", { status: 404 }));
    const client = new SkillsClient({
      apiKey: "test-key-123",
      baseUrl: "https://skills.test",
      fetchImpl: f as unknown as typeof fetch,
    });
    try {
      await client.getSkill("missing");
      expect.unreachable("should have thrown");
    } catch (e) {
      expect(e).toBeInstanceOf(LyzrApiError);
      expect((e as LyzrApiError).status).toBe(404);
      expect((e as Error).message).not.toContain("test-key-123");
    }
  });
});
