import { describe, it, expect, vi } from "vitest";
import { AgentEvalClient } from "../src/lyzr/agent-eval";
import { LyzrApiError } from "../src/lyzr/http";

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

describe("AgentEvalClient", () => {
  it("createAgentEval POSTs /v3/agent_eval/ with the config body", async () => {
    const f = vi.fn(async () => okJson({ id: "eval1" }));
    const client = mk(
      AgentEvalClient,
      f as unknown as typeof fetch,
      "https://agent.test",
    );
    const input = {
      eval_name: "my_eval",
      agent_id: "a1",
      session_id: "s1",
      agent_eval_list: [
        {
          id: "e1",
          purpose: "check tone",
          user_input: "hi",
          expected_output: "hello",
          evaluation_notes: "should be friendly",
        },
      ],
    };
    const result = await client.createAgentEval(input);
    const [url, init] = f.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://agent.test/v3/agent_eval/");
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body as string)).toEqual(input);
    expect(result).toEqual({ id: "eval1" });
  });

  it("getAgentEval GETs /v3/agent_eval/ with agent_id query param", async () => {
    const f = vi.fn(async () => okJson([{ id: "e1" }]));
    const client = mk(
      AgentEvalClient,
      f as unknown as typeof fetch,
      "https://agent.test",
    );
    const result = await client.getAgentEval("a1");
    const [url, init] = f.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://agent.test/v3/agent_eval/?agent_id=a1");
    expect(init.method).toBe("GET");
    expect(result).toEqual([{ id: "e1" }]);
  });

  it("createAgentEvalResult POSTs /v3/agent_eval/result with the result config body", async () => {
    const f = vi.fn(async () => okJson({ id: "result1" }));
    const client = mk(
      AgentEvalClient,
      f as unknown as typeof fetch,
      "https://agent.test",
    );
    const input = {
      agent_eval_id: "eval1",
      agent_id: "a1",
      agent_eval_result_list: [
        {
          id: "r1",
          status: "pass",
          details: "matched",
          user_input: "hi",
          expected_output: "hello",
          actual_output: "hello",
        },
      ],
    };
    const result = await client.createAgentEvalResult(input);
    const [url, init] = f.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://agent.test/v3/agent_eval/result");
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body as string)).toEqual(input);
    expect(result).toEqual({ id: "result1" });
  });

  it("getAgentEvalResult GETs /v3/agent_eval/result with agent_eval_id query param", async () => {
    const f = vi.fn(async () => okJson([{ id: "r1" }]));
    const client = mk(
      AgentEvalClient,
      f as unknown as typeof fetch,
      "https://agent.test",
    );
    const result = await client.getAgentEvalResult("eval1");
    const [url, init] = f.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(
      "https://agent.test/v3/agent_eval/result?agent_eval_id=eval1",
    );
    expect(init.method).toBe("GET");
    expect(result).toEqual([{ id: "r1" }]);
  });

  it("getAgentEvalResultByAgent GETs /v3/agent_eval/result/agent with agent_id query param", async () => {
    const f = vi.fn(async () => okJson([{ id: "r1" }]));
    const client = mk(
      AgentEvalClient,
      f as unknown as typeof fetch,
      "https://agent.test",
    );
    const result = await client.getAgentEvalResultByAgent("a1");
    const [url, init] = f.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(
      "https://agent.test/v3/agent_eval/result/agent?agent_id=a1",
    );
    expect(init.method).toBe("GET");
    expect(result).toEqual([{ id: "r1" }]);
  });

  it("throws LyzrApiError on a non-2xx response", async () => {
    const f = vi.fn(
      async () =>
        new Response("bad request", {
          status: 422,
          headers: { "Content-Type": "text/plain" },
        }),
    );
    const client = mk(
      AgentEvalClient,
      f as unknown as typeof fetch,
      "https://agent.test",
    );
    await expect(client.getAgentEval("a1")).rejects.toThrow(LyzrApiError);
  });
});
