import { describe, it, expect, vi } from "vitest";
import { ContextsClient, LyzrApiError } from "../src/lyzr/contexts";

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

describe("ContextsClient", () => {
  it("createContext POSTs /v3/contexts/ with name + value", async () => {
    const f = vi.fn(async () => okJson({ _id: "c1", name: "n", value: "v" }));
    const c = mk(
      ContextsClient,
      f as unknown as typeof fetch,
      "https://ctx.test",
    );
    await c.createContext({ name: "n", value: "v" });
    const [url, init] = f.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://ctx.test/v3/contexts/");
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body as string)).toEqual({ name: "n", value: "v" });
  });

  it("listContexts GETs /v3/contexts/ with skip + limit query params", async () => {
    const f = vi.fn(async () => okJson([{ _id: "c1" }]));
    const c = mk(
      ContextsClient,
      f as unknown as typeof fetch,
      "https://ctx.test",
    );
    const result = await c.listContexts({ skip: 5, limit: 10 });
    const [url, init] = f.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://ctx.test/v3/contexts/?skip=5&limit=10");
    expect(init.method).toBe("GET");
    expect(result).toEqual([{ _id: "c1" }]);
  });

  it("listContexts normalizes a wrapped 'contexts' key", async () => {
    const f = vi.fn(async () => okJson({ contexts: [{ _id: "c2" }] }));
    const c = mk(
      ContextsClient,
      f as unknown as typeof fetch,
      "https://ctx.test",
    );
    const result = await c.listContexts();
    expect(result).toEqual([{ _id: "c2" }]);
  });

  it("getContextsCount GETs /v3/contexts/count", async () => {
    const f = vi.fn(async () => okJson({ count: 3 }));
    const c = mk(
      ContextsClient,
      f as unknown as typeof fetch,
      "https://ctx.test",
    );
    await c.getContextsCount();
    const [url, init] = f.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://ctx.test/v3/contexts/count");
    expect(init.method).toBe("GET");
  });

  it("getContext GETs /v3/contexts/{id}", async () => {
    const f = vi.fn(async () => okJson({ _id: "c1", name: "n", value: "v" }));
    const c = mk(
      ContextsClient,
      f as unknown as typeof fetch,
      "https://ctx.test",
    );
    await c.getContext("c1");
    const [url, init] = f.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://ctx.test/v3/contexts/c1");
    expect(init.method).toBe("GET");
  });

  it("updateContext PUTs /v3/contexts/{id} with the partial body", async () => {
    const f = vi.fn(async () => okJson({ ok: true }));
    const c = mk(
      ContextsClient,
      f as unknown as typeof fetch,
      "https://ctx.test",
    );
    await c.updateContext("c1", { value: "new" });
    const [url, init] = f.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://ctx.test/v3/contexts/c1");
    expect(init.method).toBe("PUT");
    expect(JSON.parse(init.body as string)).toEqual({ value: "new" });
  });

  it("deleteContext DELETEs /v3/contexts/{id}", async () => {
    const f = vi.fn(async () => okJson({ ok: true }));
    const c = mk(
      ContextsClient,
      f as unknown as typeof fetch,
      "https://ctx.test",
    );
    await c.deleteContext("c1");
    const [url, init] = f.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://ctx.test/v3/contexts/c1");
    expect(init.method).toBe("DELETE");
  });

  it("getContextByNameInternal GETs internal/name/{name} with api_key param", async () => {
    const f = vi.fn(async () => okJson({ name: "n" }));
    const c = mk(
      ContextsClient,
      f as unknown as typeof fetch,
      "https://ctx.test",
    );
    await c.getContextByNameInternal("n", "secret");
    const [url, init] = f.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(
      "https://ctx.test/v3/contexts/internal/name/n?api_key=secret",
    );
    expect(init.method).toBe("GET");
  });

  it("getContextValueInternal GETs internal/value/{name} with api_key param", async () => {
    const f = vi.fn(async () => okJson("value"));
    const c = mk(
      ContextsClient,
      f as unknown as typeof fetch,
      "https://ctx.test",
    );
    await c.getContextValueInternal("n", "secret");
    const [url, init] = f.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(
      "https://ctx.test/v3/contexts/internal/value/n?api_key=secret",
    );
    expect(init.method).toBe("GET");
  });

  it("getMultipleContextValuesInternal POSTs internal/batch-values with names + api_key param", async () => {
    const f = vi.fn(async () => okJson({ a: "1" }));
    const c = mk(
      ContextsClient,
      f as unknown as typeof fetch,
      "https://ctx.test",
    );
    await c.getMultipleContextValuesInternal(["a", "b"], "secret");
    const [url, init] = f.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(
      "https://ctx.test/v3/contexts/internal/batch-values?api_key=secret",
    );
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body as string)).toEqual(["a", "b"]);
  });

  it("throws LyzrApiError on non-2xx", async () => {
    const f = vi.fn(async () => okJson({ detail: "nope" }, 404));
    const c = mk(
      ContextsClient,
      f as unknown as typeof fetch,
      "https://ctx.test",
    );
    await expect(c.getContext("missing")).rejects.toBeInstanceOf(LyzrApiError);
  });
});
