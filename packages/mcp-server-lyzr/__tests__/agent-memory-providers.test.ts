import { describe, it, expect, vi } from "vitest";
import { AgentMemoryProvidersClient } from "../src/lyzr/agent-memory-providers";
import { LyzrApiError } from "../src/lyzr/http";

const okJson = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });

const mk = (fetchImpl: typeof fetch, baseUrl = "https://mem-agent.test") =>
  new AgentMemoryProvidersClient({
    apiKey: "test-key-123",
    baseUrl,
    fetchImpl,
  });

describe("AgentMemoryProvidersClient", () => {
  it("listProviders GETs /v3/memory/providers", async () => {
    const f = vi.fn(async () => okJson([{ id: "aws-agentcore" }]));
    const client = mk(f as unknown as typeof fetch);
    const res = await client.listProviders();
    const [url, init] = f.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://mem-agent.test/v3/memory/providers");
    expect(init.method).toBe("GET");
    expect(res).toEqual([{ id: "aws-agentcore" }]);
  });

  it("getProvider GETs /v3/memory/providers/{provider_id}", async () => {
    const f = vi.fn(async () => okJson({ id: "mem0" }));
    const client = mk(f as unknown as typeof fetch);
    await client.getProvider("mem0");
    const [url, init] = f.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://mem-agent.test/v3/memory/providers/mem0");
    expect(init.method).toBe("GET");
  });

  it("validateAwsAgentcore GETs the validate endpoint", async () => {
    const f = vi.fn(async () => okJson({ valid: true }));
    const client = mk(f as unknown as typeof fetch);
    await client.validateAwsAgentcore("cred-1");
    const [url, init] = f.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(
      "https://mem-agent.test/v3/memory/aws-agentcore/cred-1/validate",
    );
    expect(init.method).toBe("GET");
  });

  it("getAwsAgentcoreStatus GETs the status endpoint", async () => {
    const f = vi.fn(async () => okJson({ status: "provisioned" }));
    const client = mk(f as unknown as typeof fetch);
    await client.getAwsAgentcoreStatus("cred-1");
    const [url] = f.mock.calls[0] as [string];
    expect(url).toBe(
      "https://mem-agent.test/v3/memory/aws-agentcore/cred-1/status",
    );
  });

  it("listAwsAgentcoreResources GETs the resources endpoint", async () => {
    const f = vi.fn(async () => okJson([{ resource_id: "r1" }]));
    const client = mk(f as unknown as typeof fetch);
    await client.listAwsAgentcoreResources("cred-1");
    const [url] = f.mock.calls[0] as [string];
    expect(url).toBe(
      "https://mem-agent.test/v3/memory/aws-agentcore/cred-1/resources",
    );
  });

  it("useExistingAwsAgentcoreMemory POSTs with memory_id body", async () => {
    const f = vi.fn(async () => okJson({ ok: true }));
    const client = mk(f as unknown as typeof fetch);
    await client.useExistingAwsAgentcoreMemory("cred-1", {
      memory_id: "mem-1",
    });
    const [url, init] = f.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(
      "https://mem-agent.test/v3/memory/aws-agentcore/cred-1/use-existing",
    );
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body as string)).toEqual({ memory_id: "mem-1" });
  });

  it("provisionAwsAgentcoreMemory POSTs with the provision body", async () => {
    const f = vi.fn(async () => okJson({ ok: true }));
    const client = mk(f as unknown as typeof fetch);
    await client.provisionAwsAgentcoreMemory("cred-1", {
      memory_name: "my-memory",
      event_expiry_days: 45,
      memory_strategy: null,
    });
    const [url, init] = f.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(
      "https://mem-agent.test/v3/memory/aws-agentcore/cred-1/provision",
    );
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body as string)).toEqual({
      memory_name: "my-memory",
      event_expiry_days: 45,
      memory_strategy: null,
    });
  });

  it("deleteAwsAgentcoreResource DELETEs the aws-resource endpoint", async () => {
    const f = vi.fn(async () => okJson({}, 200));
    const client = mk(f as unknown as typeof fetch);
    await client.deleteAwsAgentcoreResource("cred-1");
    const [url, init] = f.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(
      "https://mem-agent.test/v3/memory/aws-agentcore/cred-1/aws-resource",
    );
    expect(init.method).toBe("DELETE");
  });

  it("validateMem0 GETs /v3/memory/mem0/{credential_id}/validate", async () => {
    const f = vi.fn(async () => okJson({ valid: true }));
    const client = mk(f as unknown as typeof fetch);
    await client.validateMem0("cred-2");
    const [url] = f.mock.calls[0] as [string];
    expect(url).toBe("https://mem-agent.test/v3/memory/mem0/cred-2/validate");
  });

  it("getMem0Status GETs /v3/memory/mem0/{credential_id}/status", async () => {
    const f = vi.fn(async () => okJson({ status: "ok" }));
    const client = mk(f as unknown as typeof fetch);
    await client.getMem0Status("cred-2");
    const [url] = f.mock.calls[0] as [string];
    expect(url).toBe("https://mem-agent.test/v3/memory/mem0/cred-2/status");
  });

  it("validateSupermemory GETs /v3/memory/supermemory/{credential_id}/validate", async () => {
    const f = vi.fn(async () => okJson({ valid: true }));
    const client = mk(f as unknown as typeof fetch);
    await client.validateSupermemory("cred-3");
    const [url] = f.mock.calls[0] as [string];
    expect(url).toBe(
      "https://mem-agent.test/v3/memory/supermemory/cred-3/validate",
    );
  });

  it("getSupermemoryStatus GETs /v3/memory/supermemory/{credential_id}/status", async () => {
    const f = vi.fn(async () => okJson({ status: "ok" }));
    const client = mk(f as unknown as typeof fetch);
    await client.getSupermemoryStatus("cred-3");
    const [url] = f.mock.calls[0] as [string];
    expect(url).toBe(
      "https://mem-agent.test/v3/memory/supermemory/cred-3/status",
    );
  });

  it("throws LyzrApiError on non-2xx and never leaks the api key", async () => {
    const f = vi.fn(async () => new Response("forbidden", { status: 403 }));
    const client = mk(f as unknown as typeof fetch);
    await expect(client.getProvider("mem0")).rejects.toBeInstanceOf(
      LyzrApiError,
    );
    try {
      await client.getProvider("mem0");
    } catch (e) {
      expect((e as Error).message).not.toContain("test-key-123");
    }
  });
});
