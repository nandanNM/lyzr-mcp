import { describe, it, expect, vi } from "vitest";
import { WorldModelCoreClient } from "../src/lyzr/world-model-core";
import { LyzrApiError } from "../src/lyzr/http";

const okJson = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });

const mk = (fetchImpl: typeof fetch, baseUrl: string) =>
  new WorldModelCoreClient({ apiKey: "test-key-123", baseUrl, fetchImpl });

describe("WorldModelCoreClient", () => {
  it("listByAgent GETs by_agent path and normalizes bare array", async () => {
    const f = vi.fn(async () => okJson([{ world_model_id: "wm1" }]));
    const client = mk(f as unknown as typeof fetch, "https://api.test");
    const result = await client.listByAgent("agent-1");
    const [url, init] = f.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://api.test/v3/world_model/by_agent/agent-1");
    expect(init.method).toBe("GET");
    expect(result).toEqual([{ world_model_id: "wm1" }]);
  });

  it("listByAgent normalizes wrapped {world_models: [...]}", async () => {
    const f = vi.fn(async () =>
      okJson({ world_models: [{ world_model_id: "wm2" }] }),
    );
    const client = mk(f as unknown as typeof fetch, "https://api.test");
    const result = await client.listByAgent("agent-1");
    expect(result).toEqual([{ world_model_id: "wm2" }]);
  });

  it("createWorldModel POSTs /v3/world_model/create with body", async () => {
    const f = vi.fn(async () =>
      okJson({
        world_model_id: "wm1",
        source_agent_id: "a1",
        cloned_agent_id: "c1",
        name: "n",
        created_at: "2026-01-01T00:00:00Z",
      }),
    );
    const client = mk(f as unknown as typeof fetch, "https://api.test");
    await client.createWorldModel({ source_agent_id: "a1", name: "n" });
    const [url, init] = f.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://api.test/v3/world_model/create");
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body as string)).toEqual({
      source_agent_id: "a1",
      name: "n",
    });
  });

  it("getWorldModel GETs /v3/world_model/{id}", async () => {
    const f = vi.fn(async () => okJson({ world_model_id: "wm1" }));
    const client = mk(f as unknown as typeof fetch, "https://api.test");
    await client.getWorldModel("wm1");
    const [url, init] = f.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://api.test/v3/world_model/wm1");
    expect(init.method).toBe("GET");
  });

  it("deleteWorldModel DELETEs /v3/world_model/{id}", async () => {
    const f = vi.fn(async () => okJson({}));
    const client = mk(f as unknown as typeof fetch, "https://api.test");
    await client.deleteWorldModel("wm1");
    const [url, init] = f.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://api.test/v3/world_model/wm1");
    expect(init.method).toBe("DELETE");
  });

  it("addPersonas POSTs personas array", async () => {
    const f = vi.fn(async () => okJson({}));
    const client = mk(f as unknown as typeof fetch, "https://api.test");
    await client.addPersonas("wm1", [{ name: "p1", description: "d1" }]);
    const [url, init] = f.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://api.test/v3/world_model/wm1/personas");
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body as string)).toEqual({
      personas: [{ name: "p1", description: "d1" }],
    });
  });

  it("listPersonas GETs and normalizes personas key", async () => {
    const f = vi.fn(async () => okJson({ personas: [{ id: "p1" }] }));
    const client = mk(f as unknown as typeof fetch, "https://api.test");
    const result = await client.listPersonas("wm1");
    const [url] = f.mock.calls[0] as [string];
    expect(url).toBe("https://api.test/v3/world_model/wm1/personas");
    expect(result).toEqual([{ id: "p1" }]);
  });

  it("updatePersona PUTs persona by id", async () => {
    const f = vi.fn(async () => okJson({}));
    const client = mk(f as unknown as typeof fetch, "https://api.test");
    await client.updatePersona("wm1", "p1", { name: "n", description: "d" });
    const [url, init] = f.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://api.test/v3/world_model/wm1/personas/p1");
    expect(init.method).toBe("PUT");
    expect(JSON.parse(init.body as string)).toEqual({
      name: "n",
      description: "d",
    });
  });

  it("deletePersona DELETEs persona by id", async () => {
    const f = vi.fn(async () => okJson({}));
    const client = mk(f as unknown as typeof fetch, "https://api.test");
    await client.deletePersona("wm1", "p1");
    const [url, init] = f.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://api.test/v3/world_model/wm1/personas/p1");
    expect(init.method).toBe("DELETE");
  });

  it("addTestCases POSTs test_cases array", async () => {
    const f = vi.fn(async () => okJson({}));
    const client = mk(f as unknown as typeof fetch, "https://api.test");
    await client.addTestCases("wm1", [
      { name: "t1", user_input: "hi", expected_output: "hello" },
    ]);
    const [url, init] = f.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://api.test/v3/world_model/wm1/test_cases");
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body as string)).toEqual({
      test_cases: [{ name: "t1", user_input: "hi", expected_output: "hello" }],
    });
  });

  it("listTestCases GETs and normalizes test_cases key", async () => {
    const f = vi.fn(async () => okJson({ test_cases: [{ id: "t1" }] }));
    const client = mk(f as unknown as typeof fetch, "https://api.test");
    const result = await client.listTestCases("wm1");
    const [url] = f.mock.calls[0] as [string];
    expect(url).toBe("https://api.test/v3/world_model/wm1/test_cases");
    expect(result).toEqual([{ id: "t1" }]);
  });

  it("updateTestCase PUTs test case by id", async () => {
    const f = vi.fn(async () => okJson({}));
    const client = mk(f as unknown as typeof fetch, "https://api.test");
    await client.updateTestCase("wm1", "t1", {
      name: "t1",
      user_input: "hi",
      expected_output: "hello",
      persona_id: "p1",
      scenario_id: null,
    });
    const [url, init] = f.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://api.test/v3/world_model/wm1/test_cases/t1");
    expect(init.method).toBe("PUT");
    expect(JSON.parse(init.body as string)).toEqual({
      name: "t1",
      user_input: "hi",
      expected_output: "hello",
      persona_id: "p1",
      scenario_id: null,
    });
  });

  it("deleteTestCase DELETEs test case by id", async () => {
    const f = vi.fn(async () => okJson({}));
    const client = mk(f as unknown as typeof fetch, "https://api.test");
    await client.deleteTestCase("wm1", "t1");
    const [url, init] = f.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://api.test/v3/world_model/wm1/test_cases/t1");
    expect(init.method).toBe("DELETE");
  });

  it("addScenarios POSTs scenarios array", async () => {
    const f = vi.fn(async () => okJson({}));
    const client = mk(f as unknown as typeof fetch, "https://api.test");
    await client.addScenarios("wm1", [{ name: "s1", description: "d1" }]);
    const [url, init] = f.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://api.test/v3/world_model/wm1/scenarios");
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body as string)).toEqual({
      scenarios: [{ name: "s1", description: "d1" }],
    });
  });

  it("listScenarios GETs and normalizes scenarios key", async () => {
    const f = vi.fn(async () => okJson({ scenarios: [{ id: "s1" }] }));
    const client = mk(f as unknown as typeof fetch, "https://api.test");
    const result = await client.listScenarios("wm1");
    const [url] = f.mock.calls[0] as [string];
    expect(url).toBe("https://api.test/v3/world_model/wm1/scenarios");
    expect(result).toEqual([{ id: "s1" }]);
  });

  it("updateScenario PUTs scenario by id", async () => {
    const f = vi.fn(async () => okJson({}));
    const client = mk(f as unknown as typeof fetch, "https://api.test");
    await client.updateScenario("wm1", "s1", { name: "s1", description: "d1" });
    const [url, init] = f.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://api.test/v3/world_model/wm1/scenarios/s1");
    expect(init.method).toBe("PUT");
    expect(JSON.parse(init.body as string)).toEqual({
      name: "s1",
      description: "d1",
    });
  });

  it("deleteScenario DELETEs scenario by id", async () => {
    const f = vi.fn(async () => okJson({}));
    const client = mk(f as unknown as typeof fetch, "https://api.test");
    await client.deleteScenario("wm1", "s1");
    const [url, init] = f.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://api.test/v3/world_model/wm1/scenarios/s1");
    expect(init.method).toBe("DELETE");
  });

  it("throws LyzrApiError on non-2xx without leaking the api key", async () => {
    const f = vi.fn(async () => okJson({ detail: "nope" }, 404));
    const client = mk(f as unknown as typeof fetch, "https://api.test");
    await expect(client.getWorldModel("missing")).rejects.toBeInstanceOf(
      LyzrApiError,
    );
    try {
      await client.getWorldModel("missing");
    } catch (e) {
      expect((e as Error).message).not.toContain("test-key-123");
    }
  });
});
