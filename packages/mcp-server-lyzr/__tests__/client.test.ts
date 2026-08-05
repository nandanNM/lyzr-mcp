import { describe, it, expect, vi } from "vitest";
import { LyzrClient, LyzrApiError } from "../src/lyzr/client";

const okJson = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });

const makeClient = (fetchImpl: typeof fetch) =>
  new LyzrClient({
    apiKey: "test-key-123",
    baseUrl: "https://api.example.test",
    fetchImpl,
  });

describe("LyzrClient", () => {
  it("createAgent POSTs to /v3/agents/ with transformed payload + provider resolution", async () => {
    const fetchMock = vi.fn(async () => okJson({ agent_id: "agent-1" }));
    const client = makeClient(fetchMock as unknown as typeof fetch);

    const result = await client.createAgent({
      name: "Bot",
      provider: "openai",
      model: "gpt-4o",
      role: "support",
      goal: "help",
      instructions: "be nice",
    });

    expect(result.agent_id).toBe("agent-1");
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://api.example.test/v3/agents/");
    expect(init.method).toBe("POST");
    expect((init.headers as Record<string, string>)["x-api-key"]).toBe(
      "test-key-123",
    );
    const body = JSON.parse(init.body as string);
    expect(body).toMatchObject({
      name: "Bot",
      agent_role: "support",
      agent_goal: "help",
      agent_instructions: "be nice",
      provider_id: "OpenAI",
      model: "gpt-4o",
      llm_credential_id: "lyzr_openai",
      response_format: { type: "text" },
    });
  });

  it("createAgent rejects an unknown provider", () => {
    const client = makeClient((async () =>
      okJson({})) as unknown as typeof fetch);
    expect(() =>
      client.createAgent({
        name: "x",
        provider: "not-a-provider",
        model: "m",
        role: "r",
        goal: "g",
        instructions: "i",
      }),
    ).toThrow(/Unknown provider/);
  });

  it("chat POSTs to /v3/inference/chat/ with agent_id in the body + default user_id", async () => {
    const fetchMock = vi.fn(async () => okJson({ response: "hello there" }));
    const client = makeClient(fetchMock as unknown as typeof fetch);

    const result = await client.chat({
      agent_id: "agent-1",
      message: "hi",
      session_id: "s-1",
    });

    expect(result.response).toBe("hello there");
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://api.example.test/v3/inference/chat/");
    expect(JSON.parse(init.body as string)).toEqual({
      agent_id: "agent-1",
      session_id: "s-1",
      message: "hi",
      user_id: "default_user",
    });
  });

  it("listAgents normalizes array, {agents}, and {data} shapes", async () => {
    const shapes = [
      [{ agent_id: "a" }],
      { agents: [{ agent_id: "b" }] },
      { data: [{ agent_id: "c" }] },
    ];
    for (const shape of shapes) {
      const client = makeClient((async () =>
        okJson(shape)) as unknown as typeof fetch);
      const agents = await client.listAgents();
      expect(agents).toHaveLength(1);
    }
  });

  it("throws LyzrApiError on non-2xx and never includes the api key", async () => {
    const fetchMock = vi.fn(async () => okJson({ detail: "bad" }, 500));
    const client = makeClient(fetchMock as unknown as typeof fetch);

    await expect(client.listAgents()).rejects.toBeInstanceOf(LyzrApiError);
    try {
      await client.getAgent("x");
      expect.unreachable("should have thrown");
    } catch (e) {
      expect((e as LyzrApiError).status).toBe(500);
      expect((e as Error).message).not.toContain("test-key-123");
    }
  });

  it("maps 401 to an auth hint", async () => {
    const fetchMock = vi.fn(async () => okJson({}, 401));
    const client = makeClient(fetchMock as unknown as typeof fetch);
    await expect(
      client.chat({ agent_id: "a", message: "m", session_id: "s" }),
    ).rejects.toThrow(/API key/i);
  });

  it("forwards the AbortSignal to fetch", async () => {
    const fetchMock = vi.fn(async () => okJson({ response: "ok" }));
    const client = makeClient(fetchMock as unknown as typeof fetch);
    const ctrl = new AbortController();
    await client.chat(
      { agent_id: "a", message: "m", session_id: "s" },
      ctrl.signal,
    );
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(init.signal).toBe(ctrl.signal);
  });

  it("streamChat parses SSE chunks, accumulates text, and calls onChunk", async () => {
    const sse =
      'data: {"delta":"He"}\n\n' +
      'data: {"delta":"llo"}\n\n' +
      "data: [DONE]\n\n";
    const fetchMock = vi.fn(
      async () =>
        new Response(sse, {
          status: 200,
          headers: { "Content-Type": "text/event-stream" },
        }),
    );
    const client = makeClient(fetchMock as unknown as typeof fetch);

    const chunks: string[] = [];
    const full = await client.streamChat(
      { agent_id: "a", message: "hi", session_id: "s" },
      (d) => chunks.push(d),
    );

    expect(full).toBe("Hello");
    expect(chunks).toEqual(["He", "llo"]);
    const [url] = fetchMock.mock.calls[0] as [string];
    expect(url).toBe("https://api.example.test/v3/inference/stream/");
  });

  it("startTask POSTs to /v3/inference/task/ and getTaskStatus GETs by id", async () => {
    const start = vi.fn(async () =>
      okJson({ task_id: "t-1", status: "pending" }),
    );
    let client = makeClient(start as unknown as typeof fetch);
    const submitted = await client.startTask({
      agent_id: "a",
      message: "do it",
      session_id: "s",
    });
    expect(submitted.task_id).toBe("t-1");
    expect((start.mock.calls[0] as [string])[0]).toBe(
      "https://api.example.test/v3/inference/task/",
    );

    const poll = vi.fn(async () => okJson({ status: "completed", result: {} }));
    client = makeClient(poll as unknown as typeof fetch);
    const status = await client.getTaskStatus("t-1");
    expect(status.status).toBe("completed");
    expect((poll.mock.calls[0] as [string])[0]).toBe(
      "https://api.example.test/v3/inference/task/t-1",
    );
  });

  it("updateAgent GETs the current agent, merges, and PUTs the full object", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        okJson({
          name: "Old",
          provider_id: "OpenAI",
          model: "gpt-4o",
          agent_role: "old role",
          agent_goal: "old goal",
          agent_instructions: "old instr",
          temperature: 0.7,
          top_p: 0.9,
          llm_credential_id: "lyzr_openai",
        }),
      )
      .mockResolvedValueOnce(okJson({ message: "updated" }));
    const client = makeClient(fetchMock as unknown as typeof fetch);

    await client.updateAgent("agent-1", { name: "New", role: "new role" });

    const [getUrl, getInit] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(getUrl).toBe("https://api.example.test/v3/agents/agent-1");
    expect(getInit.method).toBe("GET");

    const [putUrl, putInit] = fetchMock.mock.calls[1] as [string, RequestInit];
    expect(putUrl).toBe("https://api.example.test/v3/agents/agent-1");
    expect(putInit.method).toBe("PUT");
    const body = JSON.parse(putInit.body as string);
    expect(body).toMatchObject({
      name: "New", // overridden
      agent_role: "new role", // overridden
      agent_goal: "old goal", // preserved
      agent_instructions: "old instr", // preserved
      provider_id: "OpenAI", // preserved
      model: "gpt-4o", // preserved
    });
  });

  it("updateAgent auto-resolves tool_configs (identity + tool_source + action_names) when tools is set without explicit tool_configs", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        okJson({
          name: "Agent",
          provider_id: "OpenAI",
          model: "gpt-4o",
          agent_role: "role",
          agent_goal: "goal",
          agent_instructions: "instr",
          temperature: 0.7,
          top_p: 0.9,
          llm_credential_id: "lyzr_openai",
          tools: [],
          tool_configs: [],
        }),
      )
      .mockResolvedValueOnce(
        okJson({
          tools: [
            {
              _id: "catalog-id-1",
              provider_id: "openapi-agify_age_predictor-predictAge",
              provider_source: "openapi",
            },
            {
              _id: "catalog-id-2",
              provider_id: "HACKERNEWS",
              provider_source: "aci",
              meta_data: { app_id: "app-hn" },
            },
          ],
        }),
      )
      .mockResolvedValueOnce(
        okJson([{ name: "HACKERNEWS__TOP_STORIES_GET" }]),
      )
      .mockResolvedValueOnce(okJson({ message: "updated" }));
    const client = makeClient(fetchMock as unknown as typeof fetch);

    // Pass the catalog _id for one and the provider_id for the other — both
    // must resolve correctly, since chat-time validation only recognizes
    // provider_id, not the catalog _id.
    const returned = await client.updateAgent("agent-1", {
      tools: ["catalog-id-1", "HACKERNEWS"],
    });

    // The caller gets full context of what's actually attached back in the
    // response — not just a bare "updated" message — without a second
    // lyzr_get_agent round-trip.
    expect(returned).toMatchObject({
      message: "updated",
      tools: ["openapi-agify_age_predictor-predictAge", "HACKERNEWS"],
    });

    const [toolsUrl, toolsInit] = fetchMock.mock.calls[1] as [
      string,
      RequestInit,
    ];
    expect(toolsUrl).toBe("https://api.example.test/v3/providers/tools/all");
    expect(toolsInit.method).toBe("GET");

    const [actionsUrl] = fetchMock.mock.calls[2] as [string, RequestInit];
    expect(actionsUrl).toBe(
      "https://api.example.test/v3/providers/tools/actions/HACKERNEWS?tool_source=aci&app_id=app-hn",
    );

    const [, putInit] = fetchMock.mock.calls[3] as [string, RequestInit];
    const body = JSON.parse(putInit.body as string);
    // tools is normalized to provider_id, never the catalog _id.
    expect(body.tools).toEqual([
      "openapi-agify_age_predictor-predictAge",
      "HACKERNEWS",
    ]);
    // Correct tool_source per tool, and action_names is populated — not
    // null (crashes the backend) and not empty (tool becomes invisible to
    // the LLM). openapi derives from the provider_id's operationId suffix;
    // aci fetches real action names from /v3/providers/tools/actions.
    expect(body.tool_configs).toEqual([
      {
        tool_name: "openapi-agify_age_predictor-predictAge",
        tool_source: "openapi",
        action_names: ["predictAge"],
        persist_auth: false,
      },
      {
        tool_name: "HACKERNEWS",
        tool_source: "aci",
        action_names: ["HACKERNEWS__TOP_STORIES_GET"],
        persist_auth: false,
      },
    ]);
  });

  it("updateAgent skips tool_configs auto-resolution when the caller passes tool_configs explicitly", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        okJson({
          name: "Agent",
          provider_id: "OpenAI",
          model: "gpt-4o",
          agent_role: "role",
          agent_goal: "goal",
          agent_instructions: "instr",
          temperature: 0.7,
          top_p: 0.9,
          llm_credential_id: "lyzr_openai",
        }),
      )
      .mockResolvedValueOnce(okJson({ message: "updated" }));
    const client = makeClient(fetchMock as unknown as typeof fetch);

    await client.updateAgent("agent-1", {
      tools: ["tool-1"],
      tool_configs: [{ tool_name: "tool-1", tool_source: "custom" }],
    });

    // Only 2 calls (GET agent, PUT agent) — no /v3/providers/tools/all lookup.
    expect(fetchMock).toHaveBeenCalledTimes(2);
    const [putUrl] = fetchMock.mock.calls[1] as [string, RequestInit];
    expect(putUrl).toBe("https://api.example.test/v3/agents/agent-1");
  });

  it("updateAgent actually changes provider_id/model when updates.provider/model are given (regression for the freeze bug)", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        okJson({
          name: "Agent",
          provider_id: "OpenAI",
          model: "gpt-4o",
          agent_role: "role",
          agent_goal: "goal",
          agent_instructions: "instr",
          temperature: 0.7,
          top_p: 0.9,
          llm_credential_id: "lyzr_openai",
        }),
      )
      .mockResolvedValueOnce(okJson({ message: "updated" }));
    const client = makeClient(fetchMock as unknown as typeof fetch);

    await client.updateAgent("agent-1", {
      provider: "anthropic",
      model: "claude-sonnet-4-5",
    });

    const [, putInit] = fetchMock.mock.calls[1] as [string, RequestInit];
    const body = JSON.parse(putInit.body as string);
    // Must be the NEW values, not the GET-mocked "OpenAI"/"gpt-4o".
    expect(body.provider_id).toBe("Anthropic");
    expect(body.model).toBe("claude-sonnet-4-5");
    expect(body.llm_credential_id).toBe("lyzr_anthropic");
  });

  it("updateAgent rejects an unknown provider", async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(
      okJson({
        name: "Agent",
        provider_id: "OpenAI",
        model: "gpt-4o",
      }),
    );
    const client = makeClient(fetchMock as unknown as typeof fetch);
    await expect(
      client.updateAgent("agent-1", { provider: "not-a-provider" }),
    ).rejects.toThrow(/Unknown provider/);
  });

  it("updateAgent round-trips new pass-through fields (agent_context, max_iterations, response_format) into the PUT payload", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        okJson({
          name: "Agent",
          provider_id: "OpenAI",
          model: "gpt-4o",
          agent_role: "role",
          agent_goal: "goal",
          agent_instructions: "instr",
          temperature: 0.7,
          top_p: 0.9,
          llm_credential_id: "lyzr_openai",
        }),
      )
      .mockResolvedValueOnce(okJson({ message: "updated" }));
    const client = makeClient(fetchMock as unknown as typeof fetch);

    await client.updateAgent("agent-1", {
      agent_context: "some context",
      max_iterations: 40,
      response_format: { type: "json_schema", json_schema: { foo: "bar" } },
    });

    const [, putInit] = fetchMock.mock.calls[1] as [string, RequestInit];
    const body = JSON.parse(putInit.body as string);
    expect(body.agent_context).toBe("some context");
    expect(body.max_iterations).toBe(40);
    expect(body.response_format).toEqual({
      type: "json_schema",
      json_schema: { foo: "bar" },
    });
  });

  it("updateAgent throws before any HTTP call when store_messages:false is combined with a memory feature", async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(
      okJson({
        name: "Agent",
        provider_id: "OpenAI",
        model: "gpt-4o",
        features: [],
      }),
    );
    const client = makeClient(fetchMock as unknown as typeof fetch);

    await expect(
      client.updateAgent("agent-1", {
        store_messages: false,
        features: [{ type: "long_term_memory", priority: 1 }],
      }),
    ).rejects.toThrow(/store_messages/);

    // Only the GET happened — no PUT was attempted.
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("deleteAgent DELETEs by id", async () => {
    const fetchMock = vi.fn(async () => okJson({}, 200));
    const client = makeClient(fetchMock as unknown as typeof fetch);
    await client.deleteAgent("agent-1");
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://api.example.test/v3/agents/agent-1");
    expect(init.method).toBe("DELETE");
  });
});
