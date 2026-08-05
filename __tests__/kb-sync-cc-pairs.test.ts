import { describe, it, expect, vi } from "vitest";
import { KbSyncCcPairsClient } from "../src/lyzr/kb-sync-cc-pairs";
import { LyzrApiError } from "../src/lyzr/http";

const okJson = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });

const mk = (fetchImpl: typeof fetch, baseUrl = "https://rag.test") =>
  new KbSyncCcPairsClient({
    apiKey: "test-key-123",
    baseUrl,
    fetchImpl,
  });

describe("KbSyncCcPairsClient", () => {
  it("listCcPairs GETs /v3/kb-sync/cc-pairs/ and normalizes a bare array", async () => {
    const f = vi.fn(async () => okJson([{ id: 1 }, { id: 2 }]));
    const client = mk(f as unknown as typeof fetch);
    const result = await client.listCcPairs();
    const [url, init] = f.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://rag.test/v3/kb-sync/cc-pairs/");
    expect(init.method).toBe("GET");
    expect(result).toEqual([{ id: 1 }, { id: 2 }]);
  });

  it("listCcPairs normalizes a { cc_pairs: [...] } wrapper", async () => {
    const f = vi.fn(async () => okJson({ cc_pairs: [{ id: 1 }] }));
    const client = mk(f as unknown as typeof fetch);
    const result = await client.listCcPairs();
    expect(result).toEqual([{ id: 1 }]);
  });

  it("listCcPairs normalizes a { data: [...] } wrapper", async () => {
    const f = vi.fn(async () => okJson({ data: [{ id: 3 }] }));
    const client = mk(f as unknown as typeof fetch);
    const result = await client.listCcPairs();
    expect(result).toEqual([{ id: 3 }]);
  });

  it("createCcPair POSTs /v3/kb-sync/cc-pairs/ with the body", async () => {
    const f = vi.fn(async () => okJson({ id: 1 }));
    const client = mk(f as unknown as typeof fetch);
    await client.createCcPair({
      connector_id: 5,
      credential_id: "cred-1",
      name: "my pair",
      rag_id: "kb1",
    });
    const [url, init] = f.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://rag.test/v3/kb-sync/cc-pairs/");
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body as string)).toEqual({
      connector_id: 5,
      credential_id: "cred-1",
      name: "my pair",
      rag_id: "kb1",
    });
  });

  it("getCcPair GETs by id", async () => {
    const f = vi.fn(async () => okJson({ id: 7 }));
    const client = mk(f as unknown as typeof fetch);
    await client.getCcPair(7);
    const [url, init] = f.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://rag.test/v3/kb-sync/cc-pairs/7/");
    expect(init.method).toBe("GET");
  });

  it("pauseCcPair PATCHes the pause endpoint", async () => {
    const f = vi.fn(async () => okJson({}));
    const client = mk(f as unknown as typeof fetch);
    await client.pauseCcPair(7);
    const [url, init] = f.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://rag.test/v3/kb-sync/cc-pairs/7/pause/");
    expect(init.method).toBe("PATCH");
  });

  it("resumeCcPair PATCHes the resume endpoint", async () => {
    const f = vi.fn(async () => okJson({}));
    const client = mk(f as unknown as typeof fetch);
    await client.resumeCcPair(7);
    const [url, init] = f.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://rag.test/v3/kb-sync/cc-pairs/7/resume/");
    expect(init.method).toBe("PATCH");
  });

  it("triggerSync POSTs the sync endpoint", async () => {
    const f = vi.fn(async () => okJson({ attempt_id: 1 }));
    const client = mk(f as unknown as typeof fetch);
    await client.triggerSync(7);
    const [url, init] = f.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://rag.test/v3/kb-sync/cc-pairs/7/sync/");
    expect(init.method).toBe("POST");
  });

  it("getSyncStatus GETs the status endpoint", async () => {
    const f = vi.fn(async () =>
      okJson({ cc_pair_id: 7, cc_pair_status: "ACTIVE" }),
    );
    const client = mk(f as unknown as typeof fetch);
    await client.getSyncStatus(7);
    const [url, init] = f.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://rag.test/v3/kb-sync/cc-pairs/7/status/");
    expect(init.method).toBe("GET");
  });

  it("listAttempts GETs the attempts endpoint with limit/offset params", async () => {
    const f = vi.fn(async () => okJson([{ id: 1 }]));
    const client = mk(f as unknown as typeof fetch);
    await client.listAttempts(7, { limit: 5, offset: 10 });
    const [url, init] = f.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(
      "https://rag.test/v3/kb-sync/cc-pairs/7/attempts/?limit=5&offset=10",
    );
    expect(init.method).toBe("GET");
  });

  it("listAttempts normalizes a { attempts: [...] } wrapper", async () => {
    const f = vi.fn(async () => okJson({ attempts: [{ id: 2 }] }));
    const client = mk(f as unknown as typeof fetch);
    const result = await client.listAttempts(7, {});
    expect(result).toEqual([{ id: 2 }]);
  });

  it("getAttempt GETs by cc_pair_id and attempt_id", async () => {
    const f = vi.fn(async () => okJson({ id: 3 }));
    const client = mk(f as unknown as typeof fetch);
    await client.getAttempt(7, 3);
    const [url, init] = f.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://rag.test/v3/kb-sync/cc-pairs/7/attempts/3/");
    expect(init.method).toBe("GET");
  });

  it("cancelAttempt DELETEs the cancel endpoint", async () => {
    const f = vi.fn(async () => okJson({}));
    const client = mk(f as unknown as typeof fetch);
    await client.cancelAttempt(7, 3);
    const [url, init] = f.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(
      "https://rag.test/v3/kb-sync/cc-pairs/7/attempts/3/cancel/",
    );
    expect(init.method).toBe("DELETE");
  });

  it("surfaces a non-2xx response as LyzrApiError without leaking the api key", async () => {
    const f = vi.fn(async () => okJson({ detail: "not found" }, 404));
    const client = mk(f as unknown as typeof fetch);
    await expect(client.getCcPair(999)).rejects.toBeInstanceOf(LyzrApiError);
    try {
      await client.getCcPair(999);
      throw new Error("expected rejection");
    } catch (e) {
      expect(e).toBeInstanceOf(LyzrApiError);
      expect((e as Error).message).not.toContain("test-key-123");
    }
  });
});
