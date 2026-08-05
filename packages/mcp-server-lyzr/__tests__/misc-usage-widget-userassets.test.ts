import { describe, it, expect, vi } from "vitest";
import { MiscUsageWidgetUserAssetsClient } from "../src/lyzr/misc-usage-widget-userassets";
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

describe("MiscUsageWidgetUserAssetsClient", () => {
  it("listUserAssets GETs /v3/user-assets/ with only page/limit/type query params", async () => {
    const f = vi.fn(async () =>
      okJson({ assets: [{ id: "a1" }], total: 1, page: 1, limit: 10 }),
    );
    const client = mk(
      MiscUsageWidgetUserAssetsClient,
      f as unknown as typeof fetch,
      "https://agent.test",
    );
    const result = await client.listUserAssets({
      page: 2,
      limit: 20,
      type: "agent",
    });
    const [url, init] = f.mock.calls[0] as [string, RequestInit];
    // Backend only accepts page/limit/type; other filter fields were never read by the server.
    expect(url).toBe(
      "https://agent.test/v3/user-assets/?page=2&limit=20&type=agent",
    );
    expect(init.method).toBe("GET");
    expect(result.assets).toEqual([{ id: "a1" }]);
    expect(result.total).toBe(1);
  });

  it("searchUserAssets GETs /v3/user-assets/search with q + filters", async () => {
    const f = vi.fn(async () => okJson({ assets: [], total: 0 }));
    const client = mk(
      MiscUsageWidgetUserAssetsClient,
      f as unknown as typeof fetch,
      "https://agent.test",
    );
    await client.searchUserAssets({ q: "hello", page: 1, limit: 10 });
    const [url, init] = f.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(
      "https://agent.test/v3/user-assets/search?q=hello&page=1&limit=10",
    );
    expect(init.method).toBe("GET");
  });

  it("throws LyzrApiError on a non-2xx response", async () => {
    const f = vi.fn(async () => new Response("nope", { status: 500 }));
    const client = mk(
      MiscUsageWidgetUserAssetsClient,
      f as unknown as typeof fetch,
      "https://agent.test",
    );
    await expect(client.listUserAssets()).rejects.toThrow(LyzrApiError);
  });
});
