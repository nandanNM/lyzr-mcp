import { describe, it, expect, vi } from "vitest";
import { RaiClient } from "../src/lyzr/rai";

const okJson = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });

const mk = (fetchImpl: typeof fetch, baseUrl = "https://rai.test") =>
  new RaiClient({
    apiKey: "test-key-123",
    baseUrl,
    fetchImpl,
  });

describe("RaiClient", () => {
  it("createPolicy sends description as an empty string, never null, when omitted", async () => {
    // Backend requires a string; null or omitted both 422.
    const f = vi.fn(async () => okJson({ _id: "policy-1", name: "p" }));
    const client = mk(f as unknown as typeof fetch);
    await client.createPolicy({ name: "p" });
    const [url, init] = f.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://rai.test/v1/rai/policies");
    expect(init.method).toBe("POST");
    const body = JSON.parse(init.body as string);
    expect(body.description).toBe("");
    expect(body.description).not.toBeNull();
  });

  it("createPolicy passes through an explicit description unchanged", async () => {
    const f = vi.fn(async () => okJson({ _id: "policy-1" }));
    const client = mk(f as unknown as typeof fetch);
    await client.createPolicy({ name: "p", description: "my policy" });
    const [, init] = f.mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(init.body as string);
    expect(body.description).toBe("my policy");
  });

  it("listPolicies GETs /v1/rai/policies", async () => {
    const f = vi.fn(async () => okJson({ policies: [] }));
    const client = mk(f as unknown as typeof fetch);
    await client.listPolicies();
    const [url, init] = f.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://rai.test/v1/rai/policies");
    expect(init.method).toBe("GET");
  });

  it("getPolicy GETs /v1/rai/policies/{id}", async () => {
    const f = vi.fn(async () => okJson({ _id: "p1" }));
    const client = mk(f as unknown as typeof fetch);
    await client.getPolicy("p1");
    const [url] = f.mock.calls[0] as [string];
    expect(url).toBe("https://rai.test/v1/rai/policies/p1");
  });

  it("deletePolicy DELETEs /v1/rai/policies/{id}", async () => {
    const f = vi.fn(async () => okJson({ success: true }));
    const client = mk(f as unknown as typeof fetch);
    await client.deletePolicy("p1");
    const [url, init] = f.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://rai.test/v1/rai/policies/p1");
    expect(init.method).toBe("DELETE");
  });
});
