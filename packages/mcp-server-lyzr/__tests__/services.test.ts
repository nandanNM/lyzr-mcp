import { describe, it, expect, vi } from "vitest";
import { RagClient } from "../src/lyzr/rag";
import { MemoryClient } from "../src/lyzr/memory";
import { SchedulerClient } from "../src/lyzr/scheduler";
import { RaiClient } from "../src/lyzr/rai";

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

describe("RagClient", () => {
  it("createKb POSTs /v3/rag/ with resolved vector store + credentials", async () => {
    const f = vi.fn(async () => okJson({ id: "kb1" }));
    const rag = mk(RagClient, f as unknown as typeof fetch, "https://rag.test");
    await rag.createKb({ name: "my_kb", vector_store: "qdrant" });
    const [url, init] = f.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://rag.test/v3/rag/");
    const body = JSON.parse(init.body as string);
    expect(body).toMatchObject({
      name: "my_kb",
      vector_db_credential_id: "lyzr_qdrant_2",
      vector_store_provider: "Qdrant [Lyzr 2]",
      embedding_credential_id: "lyzr_openai",
    });
    expect(body.collection_name).toMatch(/^my_kb[a-z0-9]{4}$/);
  });

  it("createKb rejects a bad name and unknown store", () => {
    const rag = mk(
      RagClient,
      (async () => okJson({})) as unknown as typeof fetch,
      "https://rag.test",
    );
    expect(() => rag.createKb({ name: "Bad Name" })).toThrow(/lowercase/);
    expect(() => rag.createKb({ name: "ok", vector_store: "nope" })).toThrow(
      /vector store/,
    );
  });

  it("trainText sends each chunk as {text, source} — backend 422s without source", async () => {
    const f = vi.fn(async () => okJson({ message: "ok" }));
    const rag = mk(RagClient, f as unknown as typeof fetch, "https://rag.test");
    await rag.trainText("kb1", ["hello", "world"]);
    const [url, init] = f.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://rag.test/v3/train/text/?rag_id=kb1");
    expect(JSON.parse(init.body as string)).toEqual({
      data: [
        { text: "hello", source: "manual" },
        { text: "world", source: "manual" },
      ],
    });
  });

  it("query GETs the retrieve endpoint with query params", async () => {
    const f = vi.fn(async () => okJson({ results: [] }));
    const rag = mk(RagClient, f as unknown as typeof fetch, "https://rag.test");
    await rag.query("kb1", "hello", 5);
    const [url] = f.mock.calls[0] as [string];
    expect(url).toBe(
      "https://rag.test/v3/rag/kb1/retrieve/?query=hello&top_k=5",
    );
  });
});

describe("MemoryClient", () => {
  it("add POSTs /v1/memories with ids + messages", async () => {
    const f = vi.fn(async () => okJson({ ok: true }));
    const mem = mk(
      MemoryClient,
      f as unknown as typeof fetch,
      "https://mem.test",
    );
    await mem.add([{ role: "user", content: "hi" }], { owner_id: "u1" });
    const [url, init] = f.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://mem.test/v1/memories");
    expect(JSON.parse(init.body as string)).toEqual({
      owner_id: "u1",
      messages: [{ role: "user", content: "hi" }],
    });
  });

  it("add requires at least one identifier", () => {
    const mem = mk(
      MemoryClient,
      (async () => okJson({})) as unknown as typeof fetch,
      "https://mem.test",
    );
    expect(() => mem.add([{ role: "user", content: "x" }], {})).toThrow(
      /at least one/i,
    );
  });
});

describe("SchedulerClient", () => {
  it("create POSTs /schedules/ with defaults filled in", async () => {
    const f = vi.fn(async () => okJson({ id: "s1" }));
    const s = mk(
      SchedulerClient,
      f as unknown as typeof fetch,
      "https://sch.test",
    );
    await s.create({
      user_id: "u",
      agent_id: "a",
      cron_expression: "0 9 * * 1",
    });
    const [url, init] = f.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://sch.test/schedules/");
    expect(JSON.parse(init.body as string)).toMatchObject({
      user_id: "u",
      agent_id: "a",
      cron_expression: "0 9 * * 1",
      timezone: "UTC",
      max_retries: 3,
      retry_delay: 60,
    });
  });

  it("trigger POSTs the action path", async () => {
    const f = vi.fn(async () => okJson({}));
    const s = mk(
      SchedulerClient,
      f as unknown as typeof fetch,
      "https://sch.test",
    );
    await s.trigger("s1");
    const [url] = f.mock.calls[0] as [string];
    expect(url).toBe("https://sch.test/schedules/s1/trigger");
  });
});

describe("RaiClient", () => {
  it("createPolicy builds the full policy structure", async () => {
    const f = vi.fn(async () => okJson({ id: "p1" }));
    const rai = mk(RaiClient, f as unknown as typeof fetch, "https://rai.test");
    await rai.createPolicy({
      name: "strict",
      toxicity_threshold: 0.5,
      banned_topics: ["x"],
    });
    const [url, init] = f.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://rai.test/v1/rai/policies");
    const body = JSON.parse(init.body as string);
    expect(body.name).toBe("strict");
    expect(body.toxicity_check).toEqual({ enabled: true, threshold: 0.5 });
    expect(body.banned_topics).toEqual({
      enabled: true,
      topics: [{ name: "x" }],
    });
    expect(body.nsfw_check.validation_method).toBe("full");
  });
});
