import { describe, it, expect, vi } from "vitest";
import { A2AClient, LyzrApiError } from "../src/lyzr/a2a";

const okJson = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });

const mk = (fetchImpl: typeof fetch, baseUrl = "https://a2a.test") =>
  new A2AClient({ apiKey: "k", baseUrl, fetchImpl });

describe("A2AClient", () => {
  it("listAgents GETs /v3/a2a/agents/ and normalizes a bare array", async () => {
    const f = vi.fn(async () => okJson([{ agent_id: "a1" }]));
    const client = mk(f as unknown as typeof fetch);
    const result = await client.listAgents();
    const [url, init] = f.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://a2a.test/v3/a2a/agents/");
    expect(init.method).toBe("GET");
    expect(result).toEqual([{ agent_id: "a1" }]);
  });

  it("listAgents normalizes a wrapped 'agents' key", async () => {
    const f = vi.fn(async () => okJson({ agents: [{ agent_id: "a2" }] }));
    const client = mk(f as unknown as typeof fetch);
    const result = await client.listAgents();
    expect(result).toEqual([{ agent_id: "a2" }]);
  });

  it("createAgent POSTs /v3/a2a/agents/ with the config body", async () => {
    const f = vi.fn(async () => okJson({ agent_id: "a1" }));
    const client = mk(f as unknown as typeof fetch);
    await client.createAgent({
      base_url: "https://remote.example.com",
      name: "remote agent",
    });
    const [url, init] = f.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://a2a.test/v3/a2a/agents/");
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body as string)).toEqual({
      base_url: "https://remote.example.com",
      name: "remote agent",
    });
  });

  it("getAgent GETs /v3/a2a/agents/{agent_id}", async () => {
    const f = vi.fn(async () => okJson({ agent_id: "a1" }));
    const client = mk(f as unknown as typeof fetch);
    await client.getAgent("a1");
    const [url, init] = f.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://a2a.test/v3/a2a/agents/a1");
    expect(init.method).toBe("GET");
  });

  it("updateAgent PUTs /v3/a2a/agents/{agent_id} with the config body", async () => {
    const f = vi.fn(async () => okJson({ agent_id: "a1" }));
    const client = mk(f as unknown as typeof fetch);
    await client.updateAgent("a1", {
      base_url: "https://remote.example.com",
      version: "2.0",
    });
    const [url, init] = f.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://a2a.test/v3/a2a/agents/a1");
    expect(init.method).toBe("PUT");
    expect(JSON.parse(init.body as string)).toEqual({
      base_url: "https://remote.example.com",
      version: "2.0",
    });
  });

  it("deleteAgent DELETEs /v3/a2a/agents/{agent_id}", async () => {
    const f = vi.fn(async () => okJson({ ok: true }));
    const client = mk(f as unknown as typeof fetch);
    await client.deleteAgent("a1");
    const [url, init] = f.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://a2a.test/v3/a2a/agents/a1");
    expect(init.method).toBe("DELETE");
  });

  it("inferAgent POSTs /v3/a2a/agents/{agent_id}/infer with message + context_id", async () => {
    const f = vi.fn(async () => okJson({ response: "hi" }));
    const client = mk(f as unknown as typeof fetch);
    await client.inferAgent("a1", { message: "hello", context_id: "c1" });
    const [url, init] = f.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://a2a.test/v3/a2a/agents/a1/infer");
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body as string)).toEqual({
      message: "hello",
      context_id: "c1",
    });
  });

  it("createAgent does not send fields the backend model doesn't have", async () => {
    // Backend model has no such fields — offering them would silently do nothing.
    const f = vi.fn(async () => okJson({ agent_id: "a1" }));
    const client = mk(f as unknown as typeof fetch);
    await client.createAgent({
      base_url: "https://remote.example.com",
      name: "remote agent",
    });
    const [, init] = f.mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(init.body as string);
    expect(body).not.toHaveProperty("agent_card_path");
    expect(body).not.toHaveProperty("auth_type");
    expect(body).not.toHaveProperty("credential_id");
    expect(body).not.toHaveProperty("custom_tags");
    expect(body).not.toHaveProperty("custom_metadata");
  });

  it("does not expose a serve/agent-card/JSON-RPC client — no such backend route exists", () => {
    // No "/v3/a2a/serve/*" router exists in the backend (always 404), so these methods were removed.
    const client = mk((async () => okJson({})) as unknown as typeof fetch);
    expect((client as unknown as Record<string, unknown>).getAgentCard).toBeUndefined();
    expect(
      (client as unknown as Record<string, unknown>).getAgentCardConvenience,
    ).toBeUndefined();
    expect(
      (client as unknown as Record<string, unknown>).sendJsonRpc,
    ).toBeUndefined();
  });

  it("throws LyzrApiError on a non-2xx response", async () => {
    const f = vi.fn(
      async () => okJson({ detail: "not found" }, 404) as Response,
    );
    const client = mk(f as unknown as typeof fetch);
    await expect(client.getAgent("missing")).rejects.toBeInstanceOf(
      LyzrApiError,
    );
  });
});
