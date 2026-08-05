import { describe, it, expect, vi } from "vitest";
import { RagParseFilesClient, LyzrApiError } from "../src/lyzr/rag-parse-files";

const okJson = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });

const mk = (fetchImpl: typeof fetch, baseUrl = "https://rag.test") =>
  new RagParseFilesClient({ apiKey: "test-key-123", baseUrl, fetchImpl });

describe("RagParseFilesClient", () => {
  it("parsePdf POSTs multipart form to /v3/parse/pdf/", async () => {
    const f = vi.fn(async () => okJson({ text: "parsed pdf" }));
    const client = mk(f as unknown as typeof fetch);
    const result = await client.parsePdf(
      { data: Buffer.from("pdfbytes"), filename: "a.pdf", mimeType: "application/pdf" },
      { chunk_size: 500, chunk_overlap: 50 },
    );
    const [url, init] = f.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://rag.test/v3/parse/pdf/");
    expect(init.method).toBe("POST");
    expect(init.body).toBeInstanceOf(FormData);
    const form = init.body as FormData;
    const file = form.get("file") as File;
    expect(file.name).toBe("a.pdf");
    expect(form.get("chunk_size")).toBe("500");
    expect(form.get("chunk_overlap")).toBe("50");
    expect(result).toEqual({ text: "parsed pdf" });
  });

  it("parseDocx POSTs multipart form to /v3/parse/docx/", async () => {
    const f = vi.fn(async () => okJson({ text: "parsed docx" }));
    const client = mk(f as unknown as typeof fetch);
    await client.parseDocx(
      { data: Buffer.from("docxbytes"), filename: "a.docx" },
      { data_parser: "simple" },
    );
    const [url, init] = f.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://rag.test/v3/parse/docx/");
    const form = init.body as FormData;
    expect(form.get("data_parser")).toBe("simple");
  });

  it("parseTxt POSTs multipart form to /v3/parse/txt/", async () => {
    const f = vi.fn(async () => okJson({ text: "parsed txt" }));
    const client = mk(f as unknown as typeof fetch);
    await client.parseTxt({ data: Buffer.from("hello"), filename: "a.txt" });
    const [url, init] = f.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://rag.test/v3/parse/txt/");
    const form = init.body as FormData;
    const file = form.get("file") as File;
    expect(file.name).toBe("a.txt");
  });

  it("parseCsv POSTs multipart form with source_column to /v3/parse/csv/", async () => {
    const f = vi.fn(async () => okJson({ text: "parsed csv" }));
    const client = mk(f as unknown as typeof fetch);
    await client.parseCsv(
      { data: Buffer.from("a,b\n1,2"), filename: "a.csv" },
      { source_column: "b" },
    );
    const [url, init] = f.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://rag.test/v3/parse/csv/");
    const form = init.body as FormData;
    expect(form.get("source_column")).toBe("b");
  });

  it("parseXlsx POSTs multipart form to /v3/parse/xlsx/", async () => {
    const f = vi.fn(async () => okJson({ text: "parsed xlsx" }));
    const client = mk(f as unknown as typeof fetch);
    await client.parseXlsx({ data: Buffer.from("xlsxbytes"), filename: "a.xlsx" });
    const [url] = f.mock.calls[0] as [string];
    expect(url).toBe("https://rag.test/v3/parse/xlsx/");
  });

  it("parsePptx POSTs multipart form to /v3/parse/pptx/", async () => {
    const f = vi.fn(async () => okJson({ text: "parsed pptx" }));
    const client = mk(f as unknown as typeof fetch);
    await client.parsePptx({ data: Buffer.from("pptxbytes"), filename: "a.pptx" });
    const [url] = f.mock.calls[0] as [string];
    expect(url).toBe("https://rag.test/v3/parse/pptx/");
  });

  it("parseImage POSTs multipart form to /v3/parse/image/", async () => {
    const f = vi.fn(async () => okJson({ text: "parsed image" }));
    const client = mk(f as unknown as typeof fetch);
    await client.parseImage({ data: Buffer.from("imgbytes"), filename: "a.png" });
    const [url] = f.mock.calls[0] as [string];
    expect(url).toBe("https://rag.test/v3/parse/image/");
  });

  it("throws LyzrApiError on non-2xx and never leaks the api key", async () => {
    const f = vi.fn(
      async () =>
        new Response("bad request", {
          status: 422,
          headers: { "Content-Type": "text/plain" },
        }),
    );
    const client = mk(f as unknown as typeof fetch);
    let error: unknown;
    try {
      await client.parsePdf({ data: Buffer.from("x"), filename: "a.pdf" });
    } catch (e) {
      error = e;
    }
    expect(error).toBeInstanceOf(LyzrApiError);
    expect((error as Error).message).not.toContain("test-key-123");
  });
});
