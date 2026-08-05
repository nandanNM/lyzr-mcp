import { describe, it, expect, vi } from "vitest";
import { AssetsClient, LyzrApiError } from "../src/lyzr/assets";

const okJson = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });

const mk = (fetchImpl: typeof fetch, baseUrl = "https://assets.test") =>
  new AssetsClient({ apiKey: "k", baseUrl, fetchImpl });

describe("AssetsClient", () => {
  it("uploadAssets POSTs multipart form to /v3/assets/upload with query params", async () => {
    const f = vi.fn(async () =>
      okJson({
        results: [{ asset_id: "a1" }],
        total_files: 1,
        successful_uploads: 1,
        failed_uploads: 0,
      }),
    );
    const client = mk(f as unknown as typeof fetch);
    const result = await client.uploadAssets(
      [{ data: Buffer.from("hello"), filename: "hello.txt", mimeType: "text/plain" }],
      { parser_provider: "advanced", enable_vlm: true },
    );
    const [url, init] = f.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(
      "https://assets.test/v3/assets/upload?parser_provider=advanced&enable_vlm=true",
    );
    expect(init.method).toBe("POST");
    expect(init.body).toBeInstanceOf(FormData);
    const form = init.body as FormData;
    const file = form.get("files") as File;
    expect(file.name).toBe("hello.txt");
    expect(result.successful_uploads).toBe(1);
  });

  it("uploadAssets requires at least one file", async () => {
    const client = mk((async () => okJson({})) as unknown as typeof fetch);
    await expect(client.uploadAssets([])).rejects.toThrow(/at least one file/);
  });

  it("resolveAssetBySource GETs with rag_id + source query params", async () => {
    const f = vi.fn(async () => okJson({ asset_id: "a1", file_name: "x.pdf" }));
    const client = mk(f as unknown as typeof fetch);
    await client.resolveAssetBySource("kb1", "storage/report.pdf");
    const [url] = f.mock.calls[0] as [string];
    expect(url).toBe(
      "https://assets.test/v3/assets/resolve-by-source?rag_id=kb1&source=storage%2Freport.pdf",
    );
  });

  it("getAssetRaw GETs /v3/assets/{asset_id}/raw", async () => {
    const f = vi.fn(async () => okJson({ raw: "content" }));
    const client = mk(f as unknown as typeof fetch);
    await client.getAssetRaw("a1");
    const [url, init] = f.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://assets.test/v3/assets/a1/raw");
    expect(init.method).toBe("GET");
  });

  it("getAsset GETs /v3/assets/{asset_id}", async () => {
    const f = vi.fn(async () => okJson({ asset_id: "a1", file_name: "x.pdf" }));
    const client = mk(f as unknown as typeof fetch);
    const res = await client.getAsset("a1");
    const [url] = f.mock.calls[0] as [string];
    expect(url).toBe("https://assets.test/v3/assets/a1");
    expect(res.asset_id).toBe("a1");
  });

  it("deleteAsset DELETEs /v3/assets/{asset_id}", async () => {
    const f = vi.fn(async () => okJson({ message: "deleted", asset_id: "a1" }));
    const client = mk(f as unknown as typeof fetch);
    const res = await client.deleteAsset("a1");
    const [url, init] = f.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://assets.test/v3/assets/a1");
    expect(init.method).toBe("DELETE");
    expect(res.message).toBe("deleted");
  });

  it("listAssets GETs /v3/assets/ with page + limit query params", async () => {
    const f = vi.fn(async () => okJson({ assets: [], total: 0, page: 2, limit: 5 }));
    const client = mk(f as unknown as typeof fetch);
    await client.listAssets({ page: 2, limit: 5 });
    const [url] = f.mock.calls[0] as [string];
    expect(url).toBe("https://assets.test/v3/assets/?page=2&limit=5");
  });

  it("getAssetParseStatus GETs /v3/assets/{asset_id}/parse-status", async () => {
    const f = vi.fn(async () => okJson({ status: "done" }));
    const client = mk(f as unknown as typeof fetch);
    await client.getAssetParseStatus("a1");
    const [url] = f.mock.calls[0] as [string];
    expect(url).toBe("https://assets.test/v3/assets/a1/parse-status");
  });

  it("updateParsingStatus PATCHes /v3/assets/{asset_id}/parsing-status with body", async () => {
    const f = vi.fn(async () => okJson({ ok: true }));
    const client = mk(f as unknown as typeof fetch);
    await client.updateParsingStatus("a1", { status: "completed" });
    const [url, init] = f.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://assets.test/v3/assets/a1/parsing-status");
    expect(init.method).toBe("PATCH");
    expect(JSON.parse(init.body as string)).toEqual({ status: "completed" });
  });

  it("throws LyzrApiError on non-2xx response", async () => {
    const f = vi.fn(async () => okJson({ detail: "not found" }, 404));
    const client = mk(f as unknown as typeof fetch);
    await expect(client.getAsset("missing")).rejects.toBeInstanceOf(LyzrApiError);
  });
});
