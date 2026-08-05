import { describe, it, expect, vi } from "vitest";
import { RagTrainFilesClient } from "../src/lyzr/rag-train-files";
import { LyzrApiError } from "../src/lyzr/http";

const okJson = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });

const mk = (fetchImpl: typeof fetch, baseUrl = "https://rag.test") =>
  new RagTrainFilesClient({ apiKey: "test-key-123", baseUrl, fetchImpl });

describe("RagTrainFilesClient", () => {
  it("trainPdf POSTs multipart form to /v3/train/pdf/ with rag_id query param", async () => {
    const f = vi.fn(async () => okJson({ status: "ok" }));
    const client = mk(f as unknown as typeof fetch);
    await client.trainPdf("rag1", {
      data: Buffer.from("hello"),
      filename: "doc.pdf",
      mimeType: "application/pdf",
      data_parser: "advanced",
      chunk_size: 500,
      chunk_overlap: 50,
      parser_config: '{"a":1}',
      extra_info: '{"b":2}',
    });
    const [url, init] = f.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://rag.test/v3/train/pdf/?rag_id=rag1");
    expect(init.method).toBe("POST");
    const form = init.body as FormData;
    expect(form.get("data_parser")).toBe("advanced");
    expect(form.get("chunk_size")).toBe("500");
    expect(form.get("chunk_overlap")).toBe("50");
    expect(form.get("parser_config")).toBe('{"a":1}');
    expect(form.get("extra_info")).toBe('{"b":2}');
    const file = form.get("file") as File;
    expect(file.name).toBe("doc.pdf");
  });

  it("trainDocx POSTs multipart form to /v3/train/docx/", async () => {
    const f = vi.fn(async () => okJson({ status: "ok" }));
    const client = mk(f as unknown as typeof fetch);
    await client.trainDocx("rag2", {
      data: Buffer.from("hello"),
      filename: "doc.docx",
    });
    const [url] = f.mock.calls[0] as [string];
    expect(url).toBe("https://rag.test/v3/train/docx/?rag_id=rag2");
  });

  it("trainTxtFile POSTs multipart form to /v3/train/txt/", async () => {
    const f = vi.fn(async () => okJson({ status: "ok" }));
    const client = mk(f as unknown as typeof fetch);
    await client.trainTxtFile("rag3", {
      data: Buffer.from("hello"),
      filename: "doc.txt",
      data_parser: "simple",
    });
    const [url, init] = f.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://rag.test/v3/train/txt/?rag_id=rag3");
    const form = init.body as FormData;
    expect(form.get("data_parser")).toBe("simple");
  });

  it("trainXlsx POSTs multipart form to /v3/train/xlsx/", async () => {
    const f = vi.fn(async () => okJson({ status: "ok" }));
    const client = mk(f as unknown as typeof fetch);
    await client.trainXlsx("rag4", {
      data: Buffer.from("hello"),
      filename: "sheet.xlsx",
    });
    const [url] = f.mock.calls[0] as [string];
    expect(url).toBe("https://rag.test/v3/train/xlsx/?rag_id=rag4");
  });

  it("trainPptx POSTs multipart form to /v3/train/pptx/", async () => {
    const f = vi.fn(async () => okJson({ status: "ok" }));
    const client = mk(f as unknown as typeof fetch);
    await client.trainPptx("rag5", {
      data: Buffer.from("hello"),
      filename: "deck.pptx",
    });
    const [url] = f.mock.calls[0] as [string];
    expect(url).toBe("https://rag.test/v3/train/pptx/?rag_id=rag5");
  });

  it("trainImage POSTs multipart form to /v3/train/image/", async () => {
    const f = vi.fn(async () => okJson({ status: "ok" }));
    const client = mk(f as unknown as typeof fetch);
    await client.trainImage("rag6", {
      data: Buffer.from("hello"),
      filename: "pic.png",
      mimeType: "image/png",
    });
    const [url] = f.mock.calls[0] as [string];
    expect(url).toBe("https://rag.test/v3/train/image/?rag_id=rag6");
  });

  it("throws LyzrApiError on non-2xx and never leaks the api key", async () => {
    const f = vi.fn(
      async () =>
        new Response("bad request", {
          status: 400,
          headers: { "Content-Type": "text/plain" },
        }),
    );
    const client = mk(f as unknown as typeof fetch);
    await expect(
      client.trainPdf("rag1", {
        data: Buffer.from("hello"),
        filename: "doc.pdf",
      }),
    ).rejects.toBeInstanceOf(LyzrApiError);
    try {
      await client.trainPdf("rag1", {
        data: Buffer.from("hello"),
        filename: "doc.pdf",
      });
    } catch (e) {
      expect((e as Error).message).not.toContain("test-key-123");
    }
  });
});
