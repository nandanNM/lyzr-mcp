import { describe, it, expect, vi } from "vitest";
import { RagMiscExtraClient } from "../src/lyzr/rag-misc-extra";
import { LyzrApiError } from "../src/lyzr/http";

const okJson = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });

const mk = (fetchImpl: typeof fetch, baseUrl = "https://rag.test") =>
  new RagMiscExtraClient({ apiKey: "test-key-123", baseUrl, fetchImpl });

describe("RagMiscExtraClient", () => {
  it("extract POSTs multipart form to /v3/extract/ with a file", async () => {
    const f = vi.fn(async () => okJson({ status: "ok" }));
    const client = mk(f as unknown as typeof fetch);
    await client.extract({
      data: Buffer.from("hello"),
      filename: "doc.txt",
      mimeType: "text/plain",
      extractionSchema: '{"name": "string"}',
      tier: "premium",
    });
    const [url, init] = f.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://rag.test/v3/extract/");
    expect(init.method).toBe("POST");
    expect(init.body).toBeInstanceOf(FormData);
    const form = init.body as FormData;
    expect(form.get("extraction_schema")).toBe('{"name": "string"}');
    expect(form.get("tier")).toBe("premium");
    expect(form.get("file")).toBeInstanceOf(Blob);
  });

  it("extract POSTs full_text instead of a file", async () => {
    const f = vi.fn(async () => okJson({ status: "ok" }));
    const client = mk(f as unknown as typeof fetch);
    await client.extract({
      fullText: "some raw text",
      extractionSchema: "{}",
    });
    const [, init] = f.mock.calls[0] as [string, RequestInit];
    const form = init.body as FormData;
    expect(form.get("full_text")).toBe("some raw text");
    expect(form.get("file")).toBeNull();
  });

  it("extract throws LyzrApiError on non-2xx and never leaks the key", async () => {
    const f = vi.fn(async () => okJson({ error: "bad" }, 422));
    const client = mk(f as unknown as typeof fetch);
    await expect(
      client.extract({ fullText: "x", extractionSchema: "{}" }),
    ).rejects.toBeInstanceOf(LyzrApiError);
    try {
      await client.extract({ fullText: "x", extractionSchema: "{}" });
    } catch (e) {
      expect((e as Error).message).not.toContain("test-key-123");
    }
  });

  it("getDocContent GETs /v3/rag/{rag_id}/docs/content/ with source + limit", async () => {
    const f = vi.fn(async () =>
      okJson({
        rag_id: "rag1",
        source: "src.pdf",
        doc_type: "pdf",
        chunk_count: 2,
        chunks: [],
      }),
    );
    const client = mk(f as unknown as typeof fetch);
    await client.getDocContent("rag1", "src.pdf", 50);
    const [url, init] = f.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(
      "https://rag.test/v3/rag/rag1/docs/content/?source=src.pdf&limit=50",
    );
    expect(init.method).toBe("GET");
  });

  it("getDocContent omits limit when not given", async () => {
    const f = vi.fn(async () =>
      okJson({
        rag_id: "r",
        source: "s",
        doc_type: "t",
        chunk_count: 0,
        chunks: [],
      }),
    );
    const client = mk(f as unknown as typeof fetch);
    await client.getDocContent("r", "s");
    const [url] = f.mock.calls[0] as [string];
    expect(url).toBe("https://rag.test/v3/rag/r/docs/content/?source=s");
  });

  it("getSourceAuthStatus GETs /v3/rag/{rag_id}/source-auth/status", async () => {
    const f = vi.fn(async () => okJson({ sharepoint: "connected" }));
    const client = mk(f as unknown as typeof fetch);
    await client.getSourceAuthStatus("rag1");
    const [url, init] = f.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://rag.test/v3/rag/rag1/source-auth/status");
    expect(init.method).toBe("GET");
  });

  it("sharepointAuthorize GETs the authorize endpoint with redirect_url", async () => {
    const f = vi.fn(async () => okJson({ auth_url: "https://login.example" }));
    const client = mk(f as unknown as typeof fetch);
    await client.sharepointAuthorize("rag1", "https://app.example/callback");
    const [url] = f.mock.calls[0] as [string];
    expect(url).toBe(
      "https://rag.test/v3/rag/rag1/source-auth/sharepoint/authorize?redirect_url=https%3A%2F%2Fapp.example%2Fcallback",
    );
  });

  it("aciHandoff GETs /v3/rag/source-auth/aci-handoff with state", async () => {
    const f = vi.fn(async () => okJson({ ok: true }));
    const client = mk(f as unknown as typeof fetch);
    await client.aciHandoff("state-abc");
    const [url] = f.mock.calls[0] as [string];
    expect(url).toBe(
      "https://rag.test/v3/rag/source-auth/aci-handoff?state=state-abc",
    );
  });
});
