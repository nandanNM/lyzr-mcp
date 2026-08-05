import { describe, it, expect, vi } from "vitest";
import { InferenceExtraClient, LyzrApiError } from "../src/lyzr/inference-extra";

const okJson = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });

const mk = (fetchImpl: typeof fetch, baseUrl: string) =>
  new InferenceExtraClient({ apiKey: "k", baseUrl, fetchImpl });

describe("InferenceExtraClient", () => {
  it("executeTool POSTs /v3/inference/tools/execute with defaults filled in", async () => {
    const f = vi.fn(async () => okJson({ tool_name: "t", trace_id: "tr1", result: {} }));
    const c = mk(f as unknown as typeof fetch, "https://inf.test");
    await c.executeTool({ tool_name: "t", arguments: { a: 1 } });
    const [url, init] = f.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://inf.test/v3/inference/tools/execute");
    expect(JSON.parse(init.body as string)).toEqual({
      tool_name: "t",
      agent_id: null,
      tool_configs: [],
      arguments: { a: 1 },
      trace_id: null,
    });
  });

  it("submitChatTask POSTs /v3/inference/chat/task", async () => {
    const f = vi.fn(async () => okJson({ task_id: "task1" }));
    const c = mk(f as unknown as typeof fetch, "https://inf.test");
    const result = await c.submitChatTask({
      agent_id: "a1",
      session_id: "s1",
      message: "hi",
    });
    const [url, init] = f.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://inf.test/v3/inference/chat/task");
    expect(JSON.parse(init.body as string)).toMatchObject({
      agent_id: "a1",
      session_id: "s1",
      message: "hi",
      user_id: "default_user",
      messages: null,
    });
    expect(result.task_id).toBe("task1");
  });

  it("getChatTaskStatus GETs /v3/inference/chat/task/{task_id}", async () => {
    const f = vi.fn(async () => okJson({ task_id: "task1", status: "done" }));
    const c = mk(f as unknown as typeof fetch, "https://inf.test");
    await c.getChatTaskStatus("task1");
    const [url, init] = f.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://inf.test/v3/inference/chat/task/task1");
    expect(init.method).toBe("GET");
  });

  it("createWebrtcSession POSTs /v3/inference/webrtc-session/{agent_id}/{voice_id}", async () => {
    const f = vi.fn(async () => okJson({ ok: true }));
    const c = mk(f as unknown as typeof fetch, "https://inf.test");
    await c.createWebrtcSession("a1", "v1");
    const [url, init] = f.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://inf.test/v3/inference/webrtc-session/a1/v1");
    expect(init.method).toBe("POST");
  });

  it("chatWithFile POSTs multipart form data to /v3/inference/chat/file", async () => {
    const f = vi.fn(async () => okJson({ ok: true }));
    const c = mk(f as unknown as typeof fetch, "https://inf.test");
    await c.chatWithFile({
      agent_id: "a1",
      session_id: "s1",
      message: "hi",
      file: Buffer.from("hello").toString("base64"),
      file_name: "hello.txt",
    });
    const [url, init] = f.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://inf.test/v3/inference/chat/file");
    expect(init.method).toBe("POST");
    expect(init.body).toBeInstanceOf(FormData);
    const form = init.body as FormData;
    expect(form.get("agent_id")).toBe("a1");
    expect(form.get("session_id")).toBe("s1");
    expect(form.get("message")).toBe("hi");
    expect(form.get("user_id")).toBe("default_user");
  });

  it("stopSession POSTs /v3/inference/session/{session_id}/stop", async () => {
    const f = vi.fn(async () => okJson({ ok: true }));
    const c = mk(f as unknown as typeof fetch, "https://inf.test");
    await c.stopSession("s1");
    const [url] = f.mock.calls[0] as [string];
    expect(url).toBe("https://inf.test/v3/inference/session/s1/stop");
  });

  it("startSession POSTs /v3/inference/session/{session_id}/start", async () => {
    const f = vi.fn(async () => okJson({ ok: true }));
    const c = mk(f as unknown as typeof fetch, "https://inf.test");
    await c.startSession("s1");
    const [url] = f.mock.calls[0] as [string];
    expect(url).toBe("https://inf.test/v3/inference/session/s1/start");
  });

  it("listVoices GETs /v3/inference/voices/ and normalizes the list", async () => {
    const f = vi.fn(async () => okJson({ voices: [{ id: "v1" }] }));
    const c = mk(f as unknown as typeof fetch, "https://inf.test");
    const result = await c.listVoices();
    const [url] = f.mock.calls[0] as [string];
    expect(url).toBe("https://inf.test/v3/inference/voices/");
    expect(result).toEqual([{ id: "v1" }]);
  });

  it("agentChatCompletions POSTs /v3/inference/{agent_id}/chat/completions", async () => {
    const f = vi.fn(async () => okJson({ id: "chatcmpl-1" }));
    const c = mk(f as unknown as typeof fetch, "https://inf.test");
    await c.agentChatCompletions("a1", {
      messages: [{ role: "user", content: "hi" }],
    });
    const [url, init] = f.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://inf.test/v3/inference/a1/chat/completions");
    expect(JSON.parse(init.body as string)).toEqual({
      messages: [{ role: "user", content: "hi" }],
    });
  });

  it("simpleChatCompletions POSTs /v3/inference/chat/completions with query params", async () => {
    const f = vi.fn(async () => okJson({ id: "chatcmpl-1" }));
    const c = mk(f as unknown as typeof fetch, "https://inf.test");
    await c.simpleChatCompletions({
      model: "gpt-4o",
      messages: [{ role: "user", content: "hi" }],
      temperature: 0.5,
      session_id: "s1",
    });
    const [url, init] = f.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(
      "https://inf.test/v3/inference/chat/completions?model=gpt-4o&temperature=0.5&session_id=s1",
    );
    expect(JSON.parse(init.body as string)).toEqual([
      { role: "user", content: "hi" },
    ]);
  });

  it("createInference POSTs /v4/inference", async () => {
    const f = vi.fn(async () => okJson({ id: "resp1" }));
    const c = mk(f as unknown as typeof fetch, "https://inf.test");
    await c.createInference({ model: "gpt-4o", input: "hello" });
    const [url, init] = f.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://inf.test/v4/inference");
    expect(JSON.parse(init.body as string)).toEqual({
      model: "gpt-4o",
      input: "hello",
    });
  });

  it("chatCompletionsV4 POSTs /v4/chat/completions", async () => {
    const f = vi.fn(async () => okJson({ id: "chatcmpl-1" }));
    const c = mk(f as unknown as typeof fetch, "https://inf.test");
    await c.chatCompletionsV4({
      model: "gpt-4o",
      messages: [{ role: "user", content: "hi" }],
    });
    const [url, init] = f.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://inf.test/v4/chat/completions");
    expect(JSON.parse(init.body as string)).toEqual({
      model: "gpt-4o",
      messages: [{ role: "user", content: "hi" }],
    });
  });

  it("createResponseV4 POSTs /v4/responses", async () => {
    const f = vi.fn(async () => okJson({ id: "resp1" }));
    const c = mk(f as unknown as typeof fetch, "https://inf.test");
    await c.createResponseV4({ model: "gpt-4o", input: "hello" });
    const [url, init] = f.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://inf.test/v4/responses");
    expect(JSON.parse(init.body as string)).toEqual({
      model: "gpt-4o",
      input: "hello",
    });
  });

  it("throws LyzrApiError on non-2xx", async () => {
    const f = vi.fn(
      async () =>
        new Response("bad request", {
          status: 400,
          headers: { "Content-Type": "text/plain" },
        }),
    );
    const c = mk(f as unknown as typeof fetch, "https://inf.test");
    await expect(c.getChatTaskStatus("task1")).rejects.toBeInstanceOf(
      LyzrApiError,
    );
  });
});
