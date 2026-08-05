import { describe, it, expect, vi } from "vitest";
import { ProvidersCoreClient } from "../src/lyzr/providers-core";
import { LyzrApiError } from "../src/lyzr/http";

const okJson = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });

const mk = (fetchImpl: typeof fetch, baseUrl = "https://prov.test") =>
  new ProvidersCoreClient({ apiKey: "test-key-123", baseUrl, fetchImpl });

describe("ProvidersCoreClient", () => {
  it("createProvider POSTs /v3/providers/", async () => {
    const f = vi.fn(async () => okJson({ provider_id: "p1" }));
    const client = mk(f as unknown as typeof fetch);
    await client.createProvider({
      provider_id: "p1",
      type: "openai",
      meta_data: { foo: "bar" },
    });
    const [url, init] = f.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://prov.test/v3/providers/");
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body as string)).toEqual({
      provider_id: "p1",
      type: "openai",
      meta_data: { foo: "bar" },
    });
  });

  it("createLyzrProvider POSTs /v3/providers/lyzr", async () => {
    const f = vi.fn(async () => okJson({ provider_id: "p2" }));
    const client = mk(f as unknown as typeof fetch);
    await client.createLyzrProvider({
      type: "openai",
      provider_id: "p2",
      meta_data: {},
    });
    const [url, init] = f.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://prov.test/v3/providers/lyzr");
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body as string)).toEqual({
      type: "openai",
      provider_id: "p2",
      meta_data: {},
    });
  });

  it("getProvidersByType GETs /v3/providers/type with query params", async () => {
    const f = vi.fn(async () => okJson({ providers: [{ provider_id: "p1" }] }));
    const client = mk(f as unknown as typeof fetch);
    const result = await client.getProvidersByType({
      provider_type: "llm",
      page: 2,
      limit: 10,
    });
    const [url, init] = f.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(
      "https://prov.test/v3/providers/type?provider_type=llm&page=2&limit=10",
    );
    expect(init.method).toBe("GET");
    expect(result).toEqual([{ provider_id: "p1" }]);
  });

  it("getProvidersByType normalizes a bare array response", async () => {
    const f = vi.fn(async () => okJson([{ provider_id: "p9" }]));
    const client = mk(f as unknown as typeof fetch);
    const result = await client.getProvidersByType({ provider_type: "llm" });
    expect(result).toEqual([{ provider_id: "p9" }]);
  });

  it("updateProvider PUTs /v3/providers/{provider_id}", async () => {
    const f = vi.fn(async () => okJson({ provider_id: "p1" }));
    const client = mk(f as unknown as typeof fetch);
    await client.updateProvider("p1", {
      type: "openai",
      form: { key: "v" },
      meta_data: { a: 1 },
    });
    const [url, init] = f.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://prov.test/v3/providers/p1");
    expect(init.method).toBe("PUT");
    expect(JSON.parse(init.body as string)).toEqual({
      type: "openai",
      form: { key: "v" },
      meta_data: { a: 1 },
    });
  });

  it("deleteProvider DELETEs by id", async () => {
    const f = vi.fn(async () => okJson({}));
    const client = mk(f as unknown as typeof fetch);
    await client.deleteProvider("p1");
    const [url, init] = f.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://prov.test/v3/providers/p1");
    expect(init.method).toBe("DELETE");
  });

  it("getProvider GETs /v3/providers/{provider_id}", async () => {
    const f = vi.fn(async () => okJson({ provider_id: "p1" }));
    const client = mk(f as unknown as typeof fetch);
    await client.getProvider("p1");
    const [url, init] = f.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://prov.test/v3/providers/p1");
    expect(init.method).toBe("GET");
  });

  it("getComposioActionLimit GETs the composio-action-limit endpoint", async () => {
    const f = vi.fn(async () => okJson({ limit: 100 }));
    const client = mk(f as unknown as typeof fetch);
    await client.getComposioActionLimit();
    const [url] = f.mock.calls[0] as [string];
    expect(url).toBe("https://prov.test/v3/providers/tools/composio-action-limit");
  });

  it("getToolsActions GETs the actions endpoint with query params", async () => {
    const f = vi.fn(async () => okJson({ actions: [] }));
    const client = mk(f as unknown as typeof fetch);
    await client.getToolsActions({
      provider_identifier: "slack",
      tool_source: "composio",
      app_id: "app1",
    });
    const [url] = f.mock.calls[0] as [string];
    expect(url).toBe(
      "https://prov.test/v3/providers/tools/actions/slack?tool_source=composio&app_id=app1",
    );
  });

  it("getAllTools GETs /v3/providers/tools/all", async () => {
    const f = vi.fn(async () => okJson({ tools: [] }));
    const client = mk(f as unknown as typeof fetch);
    await client.getAllTools();
    const [url] = f.mock.calls[0] as [string];
    expect(url).toBe("https://prov.test/v3/providers/tools/all");
  });

  it("deleteAciCustomApp DELETEs by app_id", async () => {
    const f = vi.fn(async () => okJson({}));
    const client = mk(f as unknown as typeof fetch);
    await client.deleteAciCustomApp("app1");
    const [url, init] = f.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://prov.test/v3/providers/aci/custom-apps/app1");
    expect(init.method).toBe("DELETE");
  });

  it("createAciCustomApp POSTs the custom-apps endpoint", async () => {
    const f = vi.fn(async () => okJson({ app_id: "app1" }));
    const client = mk(f as unknown as typeof fetch);
    await client.createAciCustomApp({
      app_json: { name: "myapp" },
      functions_json: [{ name: "fn1" }],
      secrets: { key: "val" },
    });
    const [url, init] = f.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://prov.test/v3/providers/aci/custom-apps");
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body as string)).toEqual({
      app_json: { name: "myapp" },
      functions_json: [{ name: "fn1" }],
      secrets: { key: "val" },
    });
  });

  it("listLyzrAciTools GETs /v3/providers/lyzr/aci-tools", async () => {
    const f = vi.fn(async () => okJson({ tools: [] }));
    const client = mk(f as unknown as typeof fetch);
    await client.listLyzrAciTools();
    const [url, init] = f.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://prov.test/v3/providers/lyzr/aci-tools");
    expect(init.method).toBe("GET");
  });

  it("createLyzrAciTool POSTs /v3/providers/lyzr/aci-tools", async () => {
    const f = vi.fn(async () => okJson({ provider_id: "p1" }));
    const client = mk(f as unknown as typeof fetch);
    await client.createLyzrAciTool({
      app_json: { name: "myapp" },
      functions_json: [{ name: "fn1" }],
      form: { key: "v" },
    });
    const [url, init] = f.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://prov.test/v3/providers/lyzr/aci-tools");
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body as string)).toEqual({
      app_json: { name: "myapp" },
      functions_json: [{ name: "fn1" }],
      form: { key: "v" },
    });
  });

  it("deleteLyzrAciTool DELETEs by provider_id", async () => {
    const f = vi.fn(async () => okJson({}));
    const client = mk(f as unknown as typeof fetch);
    await client.deleteLyzrAciTool("p1");
    const [url, init] = f.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://prov.test/v3/providers/lyzr/aci-tools/p1");
    expect(init.method).toBe("DELETE");
  });

  it("resolveLlmCredential GETs the resolve endpoint with query params", async () => {
    const f = vi.fn(async () => okJson({ credential_id: "c1" }));
    const client = mk(f as unknown as typeof fetch);
    await client.resolveLlmCredential({
      credential_id: "c1",
      provider_id: "p1",
    });
    const [url] = f.mock.calls[0] as [string];
    expect(url).toBe(
      "https://prov.test/v3/providers/internal/resolve-llm-credential?credential_id=c1&provider_id=p1",
    );
  });

  it("throws LyzrApiError on non-2xx and never leaks the api key", async () => {
    const f = vi.fn(async () => okJson({ detail: "not found" }, 404));
    const client = mk(f as unknown as typeof fetch);
    await expect(client.getProvider("missing")).rejects.toBeInstanceOf(
      LyzrApiError,
    );
    try {
      await client.getProvider("missing");
    } catch (e) {
      expect((e as Error).message).not.toContain("test-key-123");
    }
  });
});
