import { describe, it, expect, vi } from "vitest";
import {
  WorldModelEvalClient,
  type CreateEvaluationRunInput,
} from "../src/lyzr/world-model-eval";
import { LyzrApiError } from "../src/lyzr/http";

const okJson = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });

const mk = (fetchImpl: typeof fetch, baseUrl = "https://agent.test") =>
  new WorldModelEvalClient({ apiKey: "test-key-123", baseUrl, fetchImpl });

describe("WorldModelEvalClient", () => {
  const fullEvaluationRunInput = {
    world_model_id: "wm1",
    run_name: "smoke test",
    agent_id: "a1",
    agent_name: "My Agent",
    status: "pending",
    selected_metrics: ["accuracy"],
    overall_progress: 0,
    is_running: false,
    total_test_cases: 0,
    completed_test_cases: 0,
    failed_test_cases: 0,
    running_test_cases: 0,
    pending_test_cases: 0,
    duration_ms: 0,
    test_cases: [] as Record<string, unknown>[],
  };

  it("createEvaluationRun POSTs /v3/world_model/evaluation_runs with the body", async () => {
    const f = vi.fn(async () => okJson({ id: "run1" }));
    const client = mk(f as unknown as typeof fetch);
    await client.createEvaluationRun(fullEvaluationRunInput);
    const [url, init] = f.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://agent.test/v3/world_model/evaluation_runs");
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body as string)).toEqual(fullEvaluationRunInput);
  });

  it("createEvaluationRun's TS input type requires every field EvaluationRun requires (compile-time)", () => {
    // api/factory/v3/evals/models.py's EvaluationRun has no defaults for
    // status/selected_metrics/overall_progress/is_running/the five
    // *_test_cases counters/duration_ms/test_cases — omitting any of them
    // 422s server-side (confirmed live). CreateEvaluationRunInput marks
    // them all required, so a call site missing one is a TS error — the
    // @ts-expect-error below is the trip-wire: if the fields regress back
    // to optional, this stops being an error and `tsc --noEmit` fails
    // because of the now-unused directive.
    const { test_cases, ...missingTestCases } = fullEvaluationRunInput;
    // @ts-expect-error test_cases is required — omitting it must not typecheck
    const input: CreateEvaluationRunInput = missingTestCases;
    expect(input).toBeTruthy();
    expect(test_cases).toEqual([]);
  });

  it("listEvaluationRuns GETs by world_model_id and normalizes a bare array", async () => {
    const f = vi.fn(async () => okJson([{ id: "run1" }, { id: "run2" }]));
    const client = mk(f as unknown as typeof fetch);
    const runs = await client.listEvaluationRuns("wm1");
    const [url, init] = f.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://agent.test/v3/world_model/wm1/evaluation_runs");
    expect(init.method).toBe("GET");
    expect(runs).toEqual([{ id: "run1" }, { id: "run2" }]);
  });

  it("listEvaluationRuns normalizes a { evaluation_runs: [...] } wrapper", async () => {
    const f = vi.fn(async () => okJson({ evaluation_runs: [{ id: "run1" }] }));
    const client = mk(f as unknown as typeof fetch);
    const runs = await client.listEvaluationRuns("wm1");
    expect(runs).toEqual([{ id: "run1" }]);
  });

  it("listEvaluationRuns normalizes a { runs: [...] } wrapper", async () => {
    const f = vi.fn(async () => okJson({ runs: [{ id: "run2" }] }));
    const client = mk(f as unknown as typeof fetch);
    const runs = await client.listEvaluationRuns("wm1");
    expect(runs).toEqual([{ id: "run2" }]);
  });

  it("getEvaluationRun GETs /v3/world_model/evaluation_run/{run_id}", async () => {
    const f = vi.fn(async () => okJson({ id: "run1", status: "completed" }));
    const client = mk(f as unknown as typeof fetch);
    const result = await client.getEvaluationRun("run1");
    const [url, init] = f.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://agent.test/v3/world_model/evaluation_run/run1");
    expect(init.method).toBe("GET");
    expect(result).toEqual({ id: "run1", status: "completed" });
  });

  it("getEvaluationRun encodes the run id", async () => {
    const f = vi.fn(async () => okJson({ id: "run/1" }));
    const client = mk(f as unknown as typeof fetch);
    await client.getEvaluationRun("run/1");
    const [url] = f.mock.calls[0] as [string];
    expect(url).toBe(
      "https://agent.test/v3/world_model/evaluation_run/run%2F1",
    );
  });

  it("getDashboardOverview GETs /v3/world_model/dashboard/overview", async () => {
    const f = vi.fn(async () => okJson({ total_runs: 3 }));
    const client = mk(f as unknown as typeof fetch);
    const result = await client.getDashboardOverview();
    const [url, init] = f.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://agent.test/v3/world_model/dashboard/overview");
    expect(init.method).toBe("GET");
    expect(result).toEqual({ total_runs: 3 });
  });

  it("getWorldModelDashboard GETs /v3/world_model/dashboard/world_model/{id}", async () => {
    const f = vi.fn(async () => okJson({ world_model_id: "wm1" }));
    const client = mk(f as unknown as typeof fetch);
    const result = await client.getWorldModelDashboard("wm1");
    const [url, init] = f.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(
      "https://agent.test/v3/world_model/dashboard/world_model/wm1",
    );
    expect(init.method).toBe("GET");
    expect(result).toEqual({ world_model_id: "wm1" });
  });

  it("throws LyzrApiError on non-2xx without leaking the api key", async () => {
    const f = vi.fn(async () => okJson({ detail: "not found" }, 404));
    const client = mk(f as unknown as typeof fetch);
    await expect(client.getEvaluationRun("missing")).rejects.toBeInstanceOf(
      LyzrApiError,
    );
    try {
      await client.getEvaluationRun("missing");
      throw new Error("expected rejection");
    } catch (e) {
      expect(e).toBeInstanceOf(LyzrApiError);
      expect((e as LyzrApiError).message).not.toContain("test-key-123");
    }
  });
});
