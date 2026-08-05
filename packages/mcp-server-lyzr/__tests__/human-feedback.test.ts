import { describe, it, expect, vi } from "vitest";
import { HumanFeedbackClient, LyzrApiError } from "../src/lyzr/human-feedback";

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

describe("HumanFeedbackClient", () => {
  it("createFeedback POSTs /v3/human_feedback/ with query param + body", async () => {
    const f = vi.fn(async () => okJson({ ok: true }));
    const c = mk(
      HumanFeedbackClient,
      f as unknown as typeof fetch,
      "https://agent.test",
    );
    await c.createFeedback("rc1", {
      feedback: "great",
      user_input: "hi",
      agent_output: "hello",
    });
    const [url, init] = f.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(
      "https://agent.test/v3/human_feedback/?feedback_rag_config_id=rc1",
    );
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body as string)).toEqual({
      feedback: "great",
      user_input: "hi",
      agent_output: "hello",
    });
  });

  it("createToolRequest POSTs /v3/tool-requests with the full body", async () => {
    const f = vi.fn(async () =>
      okJson({
        group_id: "g1",
        is_new_group: true,
        count: 1,
        message: "created",
      }),
    );
    const c = mk(
      HumanFeedbackClient,
      f as unknown as typeof fetch,
      "https://agent.test",
    );
    const result = await c.createToolRequest({
      request_type: "tool",
      name: "My Tool",
      description: "desc",
      use_case: "use case",
      priority: "high",
      reference_urls: ["https://example.com"],
    });
    const [url, init] = f.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://agent.test/v3/tool-requests");
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body as string)).toEqual({
      request_type: "tool",
      name: "My Tool",
      description: "desc",
      use_case: "use case",
      priority: "high",
      reference_urls: ["https://example.com"],
    });
    expect(result.group_id).toBe("g1");
  });

  it("listSharedSkills GETs /v3/skills/shared and normalizes a bare array", async () => {
    const f = vi.fn(async () => okJson([{ id: "s1" }, { id: "s2" }]));
    const c = mk(
      HumanFeedbackClient,
      f as unknown as typeof fetch,
      "https://agent.test",
    );
    const result = await c.listSharedSkills();
    const [url, init] = f.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://agent.test/v3/skills/shared");
    expect(init.method).toBe("GET");
    expect(result).toEqual([{ id: "s1" }, { id: "s2" }]);
  });

  it("listSharedSkills normalizes a wrapped response", async () => {
    const f = vi.fn(async () => okJson({ skills: [{ id: "s1" }] }));
    const c = mk(
      HumanFeedbackClient,
      f as unknown as typeof fetch,
      "https://agent.test",
    );
    const result = await c.listSharedSkills();
    expect(result).toEqual([{ id: "s1" }]);
  });

  it("getSkillUsage GETs /v3/skills/{skill_id}/usage", async () => {
    const f = vi.fn(async () => okJson({ calls: 42 }));
    const c = mk(
      HumanFeedbackClient,
      f as unknown as typeof fetch,
      "https://agent.test",
    );
    const result = await c.getSkillUsage("skill 1");
    const [url, init] = f.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://agent.test/v3/skills/skill%201/usage");
    expect(init.method).toBe("GET");
    expect(result).toEqual({ calls: 42 });
  });

  it("throws LyzrApiError on non-2xx response", async () => {
    const f = vi.fn(async () => okJson({ detail: "bad" }, 422));
    const c = mk(
      HumanFeedbackClient,
      f as unknown as typeof fetch,
      "https://agent.test",
    );
    await expect(
      c.createToolRequest({
        request_type: "skill",
        name: "n",
        description: "d",
        use_case: "u",
        priority: "low",
      }),
    ).rejects.toBeInstanceOf(LyzrApiError);
  });
});
