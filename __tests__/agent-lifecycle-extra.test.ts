import { describe, it, expect, vi } from "vitest";
import {
  AgentLifecycleExtraClient,
} from "../src/lyzr/agent-lifecycle-extra";
import { LyzrApiError } from "../src/lyzr/http";

const okJson = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });

const mk = <T>(
  Cls: new (cfg: any) => T,
  fetchImpl: typeof fetch,
  baseUrl: string,
) => new Cls({ apiKey: "k", baseUrl, fetchImpl });

describe("AgentLifecycleExtraClient", () => {
  it("setAgentStatus PATCHes /v3/agents/{id}/status", async () => {
    const f = vi.fn(async () => okJson({ ok: true }));
    const c = mk(
      AgentLifecycleExtraClient,
      f as unknown as typeof fetch,
      "https://agent.test",
    );
    await c.setAgentStatus("a1", { is_active: false });
    const [url, init] = f.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://agent.test/v3/agents/a1/status");
    expect(init.method).toBe("PATCH");
    expect(JSON.parse(init.body as string)).toEqual({ is_active: false });
  });

  it("setAgentLock PATCHes /v3/agents/{id}/lock with environment", async () => {
    const f = vi.fn(async () => okJson({ ok: true }));
    const c = mk(
      AgentLifecycleExtraClient,
      f as unknown as typeof fetch,
      "https://agent.test",
    );
    await c.setAgentLock("a1", { is_locked: true, environment: "prod" });
    const [url, init] = f.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://agent.test/v3/agents/a1/lock");
    expect(init.method).toBe("PATCH");
    expect(JSON.parse(init.body as string)).toEqual({
      is_locked: true,
      environment: "prod",
    });
  });

  it("bulkDeleteAgents POSTs /v3/agents/bulk-delete", async () => {
    const f = vi.fn(async () => okJson({ deleted: 2 }));
    const c = mk(
      AgentLifecycleExtraClient,
      f as unknown as typeof fetch,
      "https://agent.test",
    );
    await c.bulkDeleteAgents({ agent_ids: ["a1", "a2"] });
    const [url, init] = f.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://agent.test/v3/agents/bulk-delete");
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body as string)).toEqual({
      agent_ids: ["a1", "a2"],
    });
  });

  it("listOrgAgents GETs /v3/agents/org with query params", async () => {
    const f = vi.fn(async () => okJson({ agents: [{ agent_id: "a1" }] }));
    const c = mk(
      AgentLifecycleExtraClient,
      f as unknown as typeof fetch,
      "https://agent.test",
    );
    const result = await c.listOrgAgents({
      search: "foo",
      page: 2,
      limit: 5,
    });
    const [url, init] = f.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(
      "https://agent.test/v3/agents/org?search=foo&page=2&limit=5",
    );
    expect(init.method).toBe("GET");
    expect(result).toEqual([{ agent_id: "a1" }]);
  });

  it("listOrgAgents handles a bare array response", async () => {
    const f = vi.fn(async () => okJson([{ agent_id: "a1" }]));
    const c = mk(
      AgentLifecycleExtraClient,
      f as unknown as typeof fetch,
      "https://agent.test",
    );
    const result = await c.listOrgAgents({});
    expect(result).toEqual([{ agent_id: "a1" }]);
  });

  it("listAgentVersions GETs /v3/agents/{id}/versions", async () => {
    const f = vi.fn(async () =>
      okJson({ versions: [{ version_id: "v1" }] }),
    );
    const c = mk(
      AgentLifecycleExtraClient,
      f as unknown as typeof fetch,
      "https://agent.test",
    );
    const result = await c.listAgentVersions("a1");
    const [url, init] = f.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://agent.test/v3/agents/a1/versions");
    expect(init.method).toBe("GET");
    expect(result).toEqual([{ version_id: "v1" }]);
  });

  it("getAgentVersion GETs /v3/agents/{id}/versions/{version_id}", async () => {
    const f = vi.fn(async () => okJson({ version_id: "v1" }));
    const c = mk(
      AgentLifecycleExtraClient,
      f as unknown as typeof fetch,
      "https://agent.test",
    );
    await c.getAgentVersion("a1", "v1");
    const [url, init] = f.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://agent.test/v3/agents/a1/versions/v1");
    expect(init.method).toBe("GET");
  });

  it("activateAgentVersion POSTs the activate path", async () => {
    const f = vi.fn(async () => okJson({ ok: true }));
    const c = mk(
      AgentLifecycleExtraClient,
      f as unknown as typeof fetch,
      "https://agent.test",
    );
    await c.activateAgentVersion("a1", "v1");
    const [url, init] = f.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(
      "https://agent.test/v3/agents/a1/versions/v1/activate",
    );
    expect(init.method).toBe("POST");
  });

  it("cloneAgent POSTs /v3/agents/clone", async () => {
    const f = vi.fn(async () => okJson({ agent_id: "a2" }));
    const c = mk(
      AgentLifecycleExtraClient,
      f as unknown as typeof fetch,
      "https://agent.test",
    );
    await c.cloneAgent({ agent_id: "a1" });
    const [url, init] = f.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://agent.test/v3/agents/clone");
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body as string)).toEqual({ agent_id: "a1" });
  });

  it("reassignAgent POSTs /v3/agents/reassign", async () => {
    const f = vi.fn(async () => okJson({ ok: true }));
    const c = mk(
      AgentLifecycleExtraClient,
      f as unknown as typeof fetch,
      "https://agent.test",
    );
    await c.reassignAgent({ agent_id: "a1", target_email: "x@y.com" });
    const [url, init] = f.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://agent.test/v3/agents/reassign");
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body as string)).toEqual({
      agent_id: "a1",
      target_email: "x@y.com",
    });
  });

  it("publishAgents POSTs /v3/agents/publish with default access_level", async () => {
    const f = vi.fn(async () => okJson({ ok: true }));
    const c = mk(
      AgentLifecycleExtraClient,
      f as unknown as typeof fetch,
      "https://agent.test",
    );
    await c.publishAgents({ agent_ids: ["a1", "a2"] });
    const [url, init] = f.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://agent.test/v3/agents/publish");
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body as string)).toEqual({
      agent_ids: ["a1", "a2"],
      access_level: "public",
    });
  });

  it("publishAgents respects an explicit access_level", async () => {
    const f = vi.fn(async () => okJson({ ok: true }));
    const c = mk(
      AgentLifecycleExtraClient,
      f as unknown as typeof fetch,
      "https://agent.test",
    );
    await c.publishAgents({ agent_ids: ["a1"], access_level: "private" });
    const [, init] = f.mock.calls[0] as [string, RequestInit];
    expect(JSON.parse(init.body as string)).toEqual({
      agent_ids: ["a1"],
      access_level: "private",
    });
  });

  it("throws LyzrApiError on a non-2xx response", async () => {
    const f = vi.fn(async () => okJson({ detail: "nope" }, 404));
    const c = mk(
      AgentLifecycleExtraClient,
      f as unknown as typeof fetch,
      "https://agent.test",
    );
    await expect(c.getAgentVersion("a1", "v1")).rejects.toBeInstanceOf(
      LyzrApiError,
    );
  });
});
