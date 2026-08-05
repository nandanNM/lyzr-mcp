import { describe, it, expect, vi } from "vitest";
import { PlatformAdminClient } from "../src/lyzr/platform-admin";
import { LyzrApiError } from "../src/lyzr/http";

const okJson = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });

const mk = (fetchImpl: typeof fetch, baseUrl = "https://platform.test") =>
  new PlatformAdminClient({ apiKey: "k", baseUrl, fetchImpl });

describe("PlatformAdminClient", () => {
  it("getCachedCredits GETs /v3/credits/cache without token", async () => {
    const f = vi.fn(async () => okJson({ c1: { resource: "r", action: "a", is_active: true } }));
    const client = mk(f as unknown as typeof fetch);
    await client.getCachedCredits();
    const [url, init] = f.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://platform.test/v3/credits/cache");
    expect(init.method).toBe("GET");
  });

  it("getCachedCredits passes x-server-token as query param", async () => {
    const f = vi.fn(async () => okJson({}));
    const client = mk(f as unknown as typeof fetch);
    await client.getCachedCredits("tok123");
    const [url] = f.mock.calls[0] as [string];
    expect(url).toBe(
      "https://platform.test/v3/credits/cache?x-server-token=tok123",
    );
  });

  it("refreshCreditCache POSTs /v3/credits/cache/refresh", async () => {
    const f = vi.fn(async () => okJson({}));
    const client = mk(f as unknown as typeof fetch);
    await client.refreshCreditCache();
    const [url, init] = f.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://platform.test/v3/credits/cache/refresh");
    expect(init.method).toBe("POST");
  });

  it("getFeatureFlags GETs /v3/feature-flags", async () => {
    const f = vi.fn(async () => okJson({ flags: {} }));
    const client = mk(f as unknown as typeof fetch);
    await client.getFeatureFlags();
    const [url, init] = f.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://platform.test/v3/feature-flags");
    expect(init.method).toBe("GET");
  });

  it("listFeatureFlagsAdmin GETs /v3/admin/feature-flags", async () => {
    const f = vi.fn(async () => okJson({ flags: [], total: 0 }));
    const client = mk(f as unknown as typeof fetch);
    const result = await client.listFeatureFlagsAdmin();
    const [url] = f.mock.calls[0] as [string];
    expect(url).toBe("https://platform.test/v3/admin/feature-flags");
    expect(result).toEqual({ flags: [], total: 0 });
  });

  it("createFeatureFlag POSTs /v3/admin/feature-flags with body", async () => {
    const f = vi.fn(async () => okJson({}));
    const client = mk(f as unknown as typeof fetch);
    await client.createFeatureFlag({
      key: "new-flag",
      description: "desc",
      url: "/x",
      enabled_for_roles: ["admin"],
    });
    const [url, init] = f.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://platform.test/v3/admin/feature-flags");
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body as string)).toEqual({
      key: "new-flag",
      description: "desc",
      url: "/x",
      enabled_for_roles: ["admin"],
    });
  });

  it("getFeatureFlagAdmin GETs /v3/admin/feature-flags/{key}", async () => {
    const f = vi.fn(async () => okJson({ key: "flag1", description: "d", url: "/u" }));
    const client = mk(f as unknown as typeof fetch);
    await client.getFeatureFlagAdmin("flag1");
    const [url] = f.mock.calls[0] as [string];
    expect(url).toBe("https://platform.test/v3/admin/feature-flags/flag1");
  });

  it("updateFeatureFlag PATCHes /v3/admin/feature-flags/{key} with body", async () => {
    const f = vi.fn(async () => okJson({ key: "flag1", description: "new", url: "/u" }));
    const client = mk(f as unknown as typeof fetch);
    await client.updateFeatureFlag("flag1", { description: "new" });
    const [url, init] = f.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://platform.test/v3/admin/feature-flags/flag1");
    expect(init.method).toBe("PATCH");
    expect(JSON.parse(init.body as string)).toEqual({ description: "new" });
  });

  it("deleteFeatureFlag DELETEs /v3/admin/feature-flags/{key}", async () => {
    const f = vi.fn(async () => okJson({}));
    const client = mk(f as unknown as typeof fetch);
    await client.deleteFeatureFlag("flag1");
    const [url, init] = f.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://platform.test/v3/admin/feature-flags/flag1");
    expect(init.method).toBe("DELETE");
  });

  it("getModules GETs /v3/modules", async () => {
    const f = vi.fn(async () => okJson({ modules: [] }));
    const client = mk(f as unknown as typeof fetch);
    await client.getModules();
    const [url] = f.mock.calls[0] as [string];
    expect(url).toBe("https://platform.test/v3/modules");
  });

  it("listModulesAdmin GETs /v3/admin/modules", async () => {
    const f = vi.fn(async () => okJson({ modules: [], total: 0, flags: [] }));
    const client = mk(f as unknown as typeof fetch);
    const result = await client.listModulesAdmin();
    const [url] = f.mock.calls[0] as [string];
    expect(url).toBe("https://platform.test/v3/admin/modules");
    expect(result.total).toBe(0);
  });

  it("createModule POSTs /v3/admin/modules with body", async () => {
    const f = vi.fn(async () => okJson({}));
    const client = mk(f as unknown as typeof fetch);
    await client.createModule({
      key: "mod1",
      description: "desc",
      url: "/m",
      name: "Module One",
      order: 1,
    });
    const [url, init] = f.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://platform.test/v3/admin/modules");
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body as string)).toEqual({
      key: "mod1",
      description: "desc",
      url: "/m",
      name: "Module One",
      order: 1,
    });
  });

  it("getModuleAdmin GETs /v3/admin/modules/{key}", async () => {
    const f = vi.fn(async () => okJson({ key: "mod1", description: "d", url: "/u" }));
    const client = mk(f as unknown as typeof fetch);
    await client.getModuleAdmin("mod1");
    const [url] = f.mock.calls[0] as [string];
    expect(url).toBe("https://platform.test/v3/admin/modules/mod1");
  });

  it("updateModule PATCHes /v3/admin/modules/{key} with body", async () => {
    const f = vi.fn(async () => okJson({ key: "mod1", description: "new", url: "/u" }));
    const client = mk(f as unknown as typeof fetch);
    await client.updateModule("mod1", { description: "new", order: 2 });
    const [url, init] = f.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://platform.test/v3/admin/modules/mod1");
    expect(init.method).toBe("PATCH");
    expect(JSON.parse(init.body as string)).toEqual({
      description: "new",
      order: 2,
    });
  });

  it("deleteModule DELETEs /v3/admin/modules/{key}", async () => {
    const f = vi.fn(async () => okJson({}));
    const client = mk(f as unknown as typeof fetch);
    await client.deleteModule("mod1");
    const [url, init] = f.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://platform.test/v3/admin/modules/mod1");
    expect(init.method).toBe("DELETE");
  });

  it("getFeatures GETs /v3/features/", async () => {
    const f = vi.fn(async () => okJson({ some_feature: true }));
    const client = mk(f as unknown as typeof fetch);
    const result = await client.getFeatures();
    const [url] = f.mock.calls[0] as [string];
    expect(url).toBe("https://platform.test/v3/features/");
    expect(result).toEqual({ some_feature: true });
  });

  it("throws LyzrApiError on non-2xx response", async () => {
    const f = vi.fn(async () => okJson({ detail: "not found" }, 404));
    const client = mk(f as unknown as typeof fetch);
    await expect(client.getModuleAdmin("missing")).rejects.toBeInstanceOf(
      LyzrApiError,
    );
  });
});
