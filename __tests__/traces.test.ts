import { describe, it, expect, vi } from "vitest";
import { TracesClient, LyzrApiError } from "../src/lyzr/traces";

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

describe("TracesClient", () => {
  it("listTraces GETs /v3/traces with query params", async () => {
    const f = vi.fn(async () =>
      okJson([
        {
          trace_id: "t1",
          name: "n",
          trace_start_time: "a",
          trace_end_time: "b",
          trace_duration: 1,
          total_spans: 2,
        },
      ]),
    );
    const traces = mk(
      TracesClient,
      f as unknown as typeof fetch,
      "https://traces.test",
    );
    const result = await traces.listTraces({
      agent_id: "a1",
      limit: 50,
      offset: 10,
    });
    const [url, init] = f.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(
      "https://traces.test/v3/traces?agent_id=a1&limit=50&offset=10",
    );
    expect(init.method).toBe("GET");
    expect(result).toEqual([
      {
        trace_id: "t1",
        name: "n",
        trace_start_time: "a",
        trace_end_time: "b",
        trace_duration: 1,
        total_spans: 2,
      },
    ]);
  });

  it("listTraces normalizes a wrapped response", async () => {
    const f = vi.fn(async () => okJson({ traces: [{ trace_id: "t2" }] }));
    const traces = mk(
      TracesClient,
      f as unknown as typeof fetch,
      "https://traces.test",
    );
    const result = await traces.listTraces();
    expect(result).toEqual([{ trace_id: "t2" }]);
  });

  it("getTraceGantt GETs /v3/traces/{trace_id}/gantt", async () => {
    const f = vi.fn(async () =>
      okJson({
        trace_id: "t1",
        total_duration_ms: 100,
        start_time: "a",
        end_time: "b",
        span_tree: {},
      }),
    );
    const traces = mk(
      TracesClient,
      f as unknown as typeof fetch,
      "https://traces.test",
    );
    const result = await traces.getTraceGantt("t1");
    const [url, init] = f.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://traces.test/v3/traces/t1/gantt");
    expect(init.method).toBe("GET");
    expect(result.trace_id).toBe("t1");
  });

  it("getTraceSummary GETs /v3/traces/{trace_id}/summary", async () => {
    const f = vi.fn(async () => okJson({ trace_id: "t1" }));
    const traces = mk(
      TracesClient,
      f as unknown as typeof fetch,
      "https://traces.test",
    );
    await traces.getTraceSummary("t1");
    const [url, init] = f.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://traces.test/v3/traces/t1/summary");
    expect(init.method).toBe("GET");
  });

  it("killSwitchTrace POSTs /v3/traces/{trace_id}/kill-switch", async () => {
    const f = vi.fn(async () => okJson({ ok: true }));
    const traces = mk(
      TracesClient,
      f as unknown as typeof fetch,
      "https://traces.test",
    );
    const result = await traces.killSwitchTrace("t1");
    const [url, init] = f.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://traces.test/v3/traces/t1/kill-switch");
    expect(init.method).toBe("POST");
    expect(init.body).toBeUndefined();
    expect(result).toEqual({ ok: true });
  });

  it("getDashboardMetrics GETs /v3/traces/dashboard with query params", async () => {
    const f = vi.fn(async () =>
      okJson({
        daily_metrics: [],
        total_credits_consumed: 1,
        total_traces: 2,
        total_spans: 3,
        total_input_tokens: 4,
        total_output_tokens: 5,
        avg_latency_ms: 6,
        avg_error_rate: 0.1,
      }),
    );
    const traces = mk(
      TracesClient,
      f as unknown as typeof fetch,
      "https://traces.test",
    );
    await traces.getDashboardMetrics({ agent_id: "a1", customer_id: "c1" });
    const [url, init] = f.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(
      "https://traces.test/v3/traces/dashboard?agent_id=a1&customer_id=c1",
    );
    expect(init.method).toBe("GET");
  });

  it("getTraceDetails GETs /v3/traces/{trace_id}", async () => {
    const f = vi.fn(async () => okJson({ trace_id: "t1", foo: "bar" }));
    const traces = mk(
      TracesClient,
      f as unknown as typeof fetch,
      "https://traces.test",
    );
    const result = await traces.getTraceDetails("t1");
    const [url, init] = f.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://traces.test/v3/traces/t1");
    expect(init.method).toBe("GET");
    expect(result).toEqual({ trace_id: "t1", foo: "bar" });
  });

  it("throws LyzrApiError on non-2xx response", async () => {
    const f = vi.fn(async () => okJson({ detail: "not found" }, 404));
    const traces = mk(
      TracesClient,
      f as unknown as typeof fetch,
      "https://traces.test",
    );
    await expect(traces.getTraceDetails("nope")).rejects.toThrow(LyzrApiError);
  });
});
