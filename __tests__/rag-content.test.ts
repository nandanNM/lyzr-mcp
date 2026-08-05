import { describe, it, expect, vi } from "vitest";
import { RagContentClient } from "../src/lyzr/rag-content";

const okJson = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });

const mk = (fetchImpl: typeof fetch, baseUrl: string) =>
  new RagContentClient({ apiKey: "k", baseUrl, fetchImpl } as any);

describe("RagContentClient", () => {
  it("parseText sends body.data as a list of {text, source} — backend 422s on a bare {text}", async () => {
    const f = vi.fn(async () => okJson({ documents: [] }));
    const client = mk(f as unknown as typeof fetch, "https://rag.test");
    await client.parseText({ text: "hello world" });
    const [url, init] = f.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://rag.test/v3/parse/text/");
    expect(JSON.parse(init.body as string)).toEqual({
      data: [{ text: "hello world", source: "manual" }],
    });
  });

  it("parseText forwards an explicit source", async () => {
    const f = vi.fn(async () => okJson({ documents: [] }));
    const client = mk(f as unknown as typeof fetch, "https://rag.test");
    await client.parseText({ text: "hi", source: "upload" });
    const [, init] = f.mock.calls[0] as [string, RequestInit];
    expect(JSON.parse(init.body as string)).toEqual({
      data: [{ text: "hi", source: "upload" }],
    });
  });

  it("parseWebsite sends body.urls as a list — backend 422s on a bare {url}", async () => {
    const f = vi.fn(async () => okJson({ documents: [] }));
    const client = mk(f as unknown as typeof fetch, "https://rag.test");
    await client.parseWebsite({ url: "https://example.com" });
    const [url, init] = f.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://rag.test/v3/parse/website/");
    expect(JSON.parse(init.body as string)).toEqual({
      urls: ["https://example.com"],
    });
  });

  it("parseWebsiteApify sends body.urls as a list", async () => {
    const f = vi.fn(async () => okJson({ documents: [] }));
    const client = mk(f as unknown as typeof fetch, "https://rag.test");
    await client.parseWebsiteApify({ url: "https://example.com" });
    const [url, init] = f.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://rag.test/v3/parse/website_apify/");
    expect(JSON.parse(init.body as string)).toEqual({
      urls: ["https://example.com"],
    });
  });
});
