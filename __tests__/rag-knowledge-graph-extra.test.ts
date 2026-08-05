import { describe, it, expect, vi } from "vitest";
import {
  KnowledgeGraphExtraClient,
  LyzrApiError,
} from "../src/lyzr/rag-knowledge-graph-extra";

const okJson = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });

const mk = (fetchImpl: typeof fetch, baseUrl = "https://rag.test") =>
  new KnowledgeGraphExtraClient({
    apiKey: "test-key-123",
    baseUrl,
    fetchImpl,
  });

describe("KnowledgeGraphExtraClient", () => {
  it("trainNeo4jFile POSTs multipart to /v4/knowledge_graph/?rag_id=...", async () => {
    const f = vi.fn(async () => okJson({ ok: true }));
    const client = mk(f as unknown as typeof fetch);
    await client.trainNeo4jFile("rag1", {
      data: Buffer.from("hello"),
      filename: "doc.txt",
      mimeType: "text/plain",
      schema_prompt: "Person, Company",
      extra_info: "{}",
    });
    const [url, init] = f.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://rag.test/v4/knowledge_graph/?rag_id=rag1");
    expect(init.method).toBe("POST");
    const form = init.body as FormData;
    expect(form.get("file")).toBeInstanceOf(Blob);
    expect(form.get("schema_prompt")).toBe("Person, Company");
    expect(form.get("extra_info")).toBe("{}");
  });

  it("trainNeo4jFileNs POSTs multipart to /v4/knowledge_graph/neo4j/", async () => {
    const f = vi.fn(async () => okJson({ ok: true }));
    const client = mk(f as unknown as typeof fetch);
    await client.trainNeo4jFileNs("rag1", {
      data: Buffer.from("hello"),
      filename: "doc.txt",
    });
    const [url] = f.mock.calls[0] as [string];
    expect(url).toBe("https://rag.test/v4/knowledge_graph/neo4j/?rag_id=rag1");
  });

  it("trainNeo4jFileTask POSTs multipart to /v4/knowledge_graph/task/", async () => {
    const f = vi.fn(async () => okJson({ task_id: "t1" }));
    const client = mk(f as unknown as typeof fetch);
    await client.trainNeo4jFileTask("rag1", {
      data: Buffer.from("hello"),
      filename: "doc.txt",
    });
    const [url] = f.mock.calls[0] as [string];
    expect(url).toBe("https://rag.test/v4/knowledge_graph/task/?rag_id=rag1");
  });

  it("trainNeo4jFileTaskNs POSTs multipart to /v4/knowledge_graph/neo4j/task/", async () => {
    const f = vi.fn(async () => okJson({ task_id: "t1" }));
    const client = mk(f as unknown as typeof fetch);
    await client.trainNeo4jFileTaskNs("rag1", {
      data: Buffer.from("hello"),
      filename: "doc.txt",
    });
    const [url] = f.mock.calls[0] as [string];
    expect(url).toBe(
      "https://rag.test/v4/knowledge_graph/neo4j/task/?rag_id=rag1",
    );
  });

  it("trainNeo4jWebsite POSTs JSON body to /v4/knowledge_graph/neo4j/website/", async () => {
    const f = vi.fn(async () => okJson({ ok: true }));
    const client = mk(f as unknown as typeof fetch);
    await client.trainNeo4jWebsite("rag1", {
      urls: ["https://example.com"],
      extra_fields: { foo: "bar" },
    });
    const [url, init] = f.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(
      "https://rag.test/v4/knowledge_graph/neo4j/website/?rag_id=rag1",
    );
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body as string)).toEqual({
      urls: ["https://example.com"],
      foo: "bar",
    });
  });

  it("trainNeo4jText POSTs JSON body to /v4/knowledge_graph/neo4j/text/", async () => {
    const f = vi.fn(async () => okJson({ ok: true }));
    const client = mk(f as unknown as typeof fetch);
    await client.trainNeo4jText({
      text: "hello world",
      source: "doc1",
      rag_id: "rag1",
    });
    const [url, init] = f.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://rag.test/v4/knowledge_graph/neo4j/text/");
    expect(JSON.parse(init.body as string)).toEqual({
      text: "hello world",
      source: "doc1",
      rag_id: "rag1",
    });
  });

  it("trainNeo4jTextTask POSTs JSON body to /v4/knowledge_graph/neo4j/text/task/", async () => {
    const f = vi.fn(async () => okJson({ task_id: "t2" }));
    const client = mk(f as unknown as typeof fetch);
    await client.trainNeo4jTextTask({
      text: "hello",
      source: "doc1",
      rag_id: "rag1",
    });
    const [url] = f.mock.calls[0] as [string];
    expect(url).toBe("https://rag.test/v4/knowledge_graph/neo4j/text/task/");
  });

  it("getNeo4jGraph GETs /v4/knowledge_graph/neo4j/graph/ with params", async () => {
    const f = vi.fn(async () => okJson({ nodes: [] }));
    const client = mk(f as unknown as typeof fetch);
    await client.getNeo4jGraph("rag1", 25);
    const [url, init] = f.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(
      "https://rag.test/v4/knowledge_graph/neo4j/graph/?rag_id=rag1&limit=25",
    );
    expect(init.method).toBe("GET");
  });

  it("deduplicateNeo4j POSTs to /v4/knowledge_graph/neo4j/{rag_id}/deduplicate/", async () => {
    const f = vi.fn(async () => okJson({ ok: true }));
    const client = mk(f as unknown as typeof fetch);
    await client.deduplicateNeo4j("rag 1");
    const [url, init] = f.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(
      "https://rag.test/v4/knowledge_graph/neo4j/rag%201/deduplicate/",
    );
    expect(init.method).toBe("POST");
  });

  it("throws LyzrApiError on non-2xx and never leaks the api key", async () => {
    const f = vi.fn(async () => new Response("forbidden", { status: 403 }));
    const client = mk(f as unknown as typeof fetch);
    await expect(client.getNeo4jGraph("rag1")).rejects.toBeInstanceOf(
      LyzrApiError,
    );
    try {
      await client.getNeo4jGraph("rag1");
    } catch (e) {
      expect((e as Error).message).not.toContain("test-key-123");
    }
  });

  it("throws LyzrApiError on non-2xx multipart response", async () => {
    const f = vi.fn(async () => new Response("bad request", { status: 400 }));
    const client = mk(f as unknown as typeof fetch);
    await expect(
      client.trainNeo4jFile("rag1", {
        data: Buffer.from("x"),
        filename: "f.txt",
      }),
    ).rejects.toBeInstanceOf(LyzrApiError);
  });
});
