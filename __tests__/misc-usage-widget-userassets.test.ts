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
  it("runUsageAlerts POSTs /v3/usage-alerts/run and includes x-server-token header when given", async () => {
    const f = vi.fn(async () => okJson({ ok: true }));
    const client = mk(
      MiscUsageWidgetUserAssetsClient,
      f as unknown as typeof fetch,
      "https://agent.test",
    );
    await client.runUsageAlerts("secret-token");
    const [url, init] = f.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://agent.test/v3/usage-alerts/run");
    expect(init.method).toBe("POST");
    const headers = init.headers as Record<string, string>;
    expect(headers["x-server-token"]).toBe("secret-token");
  });

  it("runUsageAlerts omits x-server-token header when not given", async () => {
    const f = vi.fn(async () => okJson({ ok: true }));
    const client = mk(
      MiscUsageWidgetUserAssetsClient,
      f as unknown as typeof fetch,
      "https://agent.test",
    );
    await client.runUsageAlerts();
    const [, init] = f.mock.calls[0] as [string, RequestInit];
    const headers = init.headers as Record<string, string>;
    expect(headers["x-server-token"]).toBeUndefined();
  });

  it("widgetStream POSTs /v3/widget/stream/ with message + session_id and returns streamed text", async () => {
    const encoder = new TextEncoder();
    const chunks = [
      `data: ${JSON.stringify({ content: "Hel" })}\n\n`,
      `data: ${JSON.stringify({ content: "lo" })}\n\n`,
      `data: [DONE]\n\n`,
    ];
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        for (const c of chunks) controller.enqueue(encoder.encode(c));
        controller.close();
      },
    });
    const f = vi.fn(
      async () =>
        new Response(stream, {
          status: 200,
          headers: { "Content-Type": "text/event-stream" },
        }),
    );
    const client = mk(
      MiscUsageWidgetUserAssetsClient,
      f as unknown as typeof fetch,
      "https://agent.test",
    );
    const onChunk = vi.fn();
    const full = await client.widgetStream(
      { message: "hi", session_id: "s1" },
      onChunk,
    );
    const [url, init] = f.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://agent.test/v3/widget/stream/");
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body as string)).toEqual({
      message: "hi",
      session_id: "s1",
    });
    expect(full).toBe("Hello");
    expect(onChunk).toHaveBeenCalledTimes(2);
  });

  it("listUserAssetFilters GETs /v3/user-assets/filters", async () => {
    const f = vi.fn(async () => okJson({ providers: ["openai"] }));
    const client = mk(
      MiscUsageWidgetUserAssetsClient,
      f as unknown as typeof fetch,
      "https://agent.test",
    );
    await client.listUserAssetFilters();
    const [url, init] = f.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://agent.test/v3/user-assets/filters");
    expect(init.method).toBe("GET");
  });

  it("listUserAssets GETs /v3/user-assets/ with query params", async () => {
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
      sort_by: "name",
      order: "asc",
    });
    const [url, init] = f.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(
      "https://agent.test/v3/user-assets/?page=2&limit=20&type=agent&sort_by=name&order=asc",
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
    await expect(client.listUserAssetFilters()).rejects.toThrow(LyzrApiError);
  });
});
