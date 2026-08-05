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
    const f = vi.fn(async () =>
      okJson({ c1: { resource: "r", action: "a", is_active: true } }),
    );
    const client = mk(f as unknown as typeof fetch);
    await client.getCachedCredits();
    const [url, init] = f.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://platform.test/v3/credits/cache");
    expect(init.method).toBe("GET");
  });

  it("getCachedCredits sends x-server-token as a HEADER, not a query param", async () => {
    const f = vi.fn(async () => okJson({}));
    const client = mk(f as unknown as typeof fetch);
    await client.getCachedCredits("tok123");
    const [url, init] = f.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://platform.test/v3/credits/cache");
    expect((init.headers as Record<string, string>)["x-server-token"]).toBe(
      "tok123",
    );
  });

  it("refreshCreditCache sends x-server-token as a HEADER, not a query param", async () => {
    const f = vi.fn(async () => okJson({}));
    const client = mk(f as unknown as typeof fetch);
    await client.refreshCreditCache("tok123");
    const [url, init] = f.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://platform.test/v3/credits/cache/refresh");
    expect((init.headers as Record<string, string>)["x-server-token"]).toBe(
      "tok123",
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

  it("listFeatureFlagsAdmin GETs /v3/admin/feature-flags with a Bearer admin token, not x-api-key", async () => {
    const f = vi.fn(async () => okJson({ flags: [], total: 0 }));
    const client = mk(f as unknown as typeof fetch);
    const result = await client.listFeatureFlagsAdmin("admin-secret");
    const [url, init] = f.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://platform.test/v3/admin/feature-flags");
    expect((init.headers as Record<string, string>).Authorization).toBe(
      "Bearer admin-secret",
    );
    expect(result).toEqual({ flags: [], total: 0 });
  });

  it("createFeatureFlag POSTs /v3/admin/feature-flags with body and Bearer admin token", async () => {
    const f = vi.fn(async () => okJson({}));
    const client = mk(f as unknown as typeof fetch);
    await client.createFeatureFlag("admin-secret", {
      key: "new-flag",
      description: "desc",
      url: "/x",
      enabled_for_roles: ["admin"],
    });
    const [url, init] = f.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://platform.test/v3/admin/feature-flags");
    expect(init.method).toBe("POST");
    expect((init.headers as Record<string, string>).Authorization).toBe(
      "Bearer admin-secret",
    );
    expect(JSON.parse(init.body as string)).toEqual({
      key: "new-flag",
      description: "desc",
      url: "/x",
      enabled_for_roles: ["admin"],
    });
  });

  it("getFeatureFlagAdmin GETs /v3/admin/feature-flags/{key} with Bearer admin token", async () => {
    const f = vi.fn(async () =>
      okJson({ key: "flag1", description: "d", url: "/u" }),
    );
    const client = mk(f as unknown as typeof fetch);
    await client.getFeatureFlagAdmin("admin-secret", "flag1");
    const [url, init] = f.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://platform.test/v3/admin/feature-flags/flag1");
    expect((init.headers as Record<string, string>).Authorization).toBe(
      "Bearer admin-secret",
    );
  });

  it("updateFeatureFlag PATCHes /v3/admin/feature-flags/{key} with body and Bearer admin token", async () => {
    const f = vi.fn(async () =>
      okJson({ key: "flag1", description: "new", url: "/u" }),
    );
    const client = mk(f as unknown as typeof fetch);
    await client.updateFeatureFlag("admin-secret", "flag1", {
      description: "new",
    });
    const [url, init] = f.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://platform.test/v3/admin/feature-flags/flag1");
    expect(init.method).toBe("PATCH");
    expect((init.headers as Record<string, string>).Authorization).toBe(
      "Bearer admin-secret",
    );
    expect(JSON.parse(init.body as string)).toEqual({ description: "new" });
  });

  it("deleteFeatureFlag DELETEs /v3/admin/feature-flags/{key} with Bearer admin token", async () => {
    const f = vi.fn(async () => okJson({}));
    const client = mk(f as unknown as typeof fetch);
    await client.deleteFeatureFlag("admin-secret", "flag1");
    const [url, init] = f.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://platform.test/v3/admin/feature-flags/flag1");
    expect(init.method).toBe("DELETE");
    expect((init.headers as Record<string, string>).Authorization).toBe(
      "Bearer admin-secret",
    );
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
    await expect(
      client.getFeatureFlagAdmin("admin-secret", "missing"),
    ).rejects.toBeInstanceOf(LyzrApiError);
  });
});
