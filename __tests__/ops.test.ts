import { describe, it, expect, vi } from "vitest";
import { OpsClient } from "../src/lyzr/ops";
import { LyzrApiError } from "../src/lyzr/http";

const okJson = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });

const mk = (fetchImpl: typeof fetch, baseUrl = "https://ops.test") =>
  new OpsClient({ apiKey: "test-key-123", baseUrl, fetchImpl });

describe("OpsClient", () => {
  it("generateReport POSTs /v3/ops/report with the date range", async () => {
    const f = vi.fn(async () => okJson({ report: [] }));
    const ops = mk(f as unknown as typeof fetch);
    await ops.generateReport({
      start_date: "2024-01-01",
      end_date: "2024-01-31",
    });
    const [url, init] = f.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://ops.test/v3/ops/report");
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body as string)).toEqual({
      start_date: "2024-01-01",
      end_date: "2024-01-31",
    });
  });

  it("exportReportCsv POSTs /v3/ops/report_csv with the date range", async () => {
    const f = vi.fn(async () => okJson({}));
    const ops = mk(f as unknown as typeof fetch);
    await ops.exportReportCsv({
      start_date: "2024-01-01",
      end_date: "2024-01-31",
    });
    const [url, init] = f.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://ops.test/v3/ops/report_csv");
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body as string)).toEqual({
      start_date: "2024-01-01",
      end_date: "2024-01-31",
    });
  });

  it("getDashboard GETs /v3/ops/dashboard with required + optional query params", async () => {
    const f = vi.fn(async () => okJson({}));
    const ops = mk(f as unknown as typeof fetch);
    await ops.getDashboard({
      start_date: "2024-01-01T00:00:00Z",
      end_date: "2024-01-31T00:00:00Z",
      agent_id: "agent-1",
    });
    const [url, init] = f.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(
      "https://ops.test/v3/ops/dashboard?start_date=2024-01-01T00%3A00%3A00Z&end_date=2024-01-31T00%3A00%3A00Z&agent_id=agent-1",
    );
    expect(init.method).toBe("GET");
  });

  it("getDashboard omits agent_id when not provided", async () => {
    const f = vi.fn(async () => okJson({}));
    const ops = mk(f as unknown as typeof fetch);
    await ops.getDashboard({ start_date: "a", end_date: "b" });
    const [url] = f.mock.calls[0] as [string];
    expect(url).toBe(
      "https://ops.test/v3/ops/dashboard?start_date=a&end_date=b",
    );
  });

  it("getTraces GETs /v3/ops/traces with all filters + pagination", async () => {
    const f = vi.fn(async () => okJson({}));
    const ops = mk(f as unknown as typeof fetch);
    await ops.getTraces({
      agent_id: "agent-1",
      start_date: "2024-01-01",
      end_date: "2024-01-31",
      page: 2,
      limit: 25,
      count: true,
    });
    const [url] = f.mock.calls[0] as [string];
    expect(url).toBe(
      "https://ops.test/v3/ops/traces?agent_id=agent-1&start_date=2024-01-01&end_date=2024-01-31&page=2&limit=25&count=true",
    );
  });

  it("getTraces works with no params", async () => {
    const f = vi.fn(async () => okJson({}));
    const ops = mk(f as unknown as typeof fetch);
    await ops.getTraces();
    const [url] = f.mock.calls[0] as [string];
    expect(url).toBe("https://ops.test/v3/ops/traces");
  });

  it("getTrace GETs /v3/ops/trace/{trace_id}", async () => {
    const f = vi.fn(async () => okJson({}));
    const ops = mk(f as unknown as typeof fetch);
    await ops.getTrace("trace-1");
    const [url, init] = f.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://ops.test/v3/ops/trace/trace-1");
    expect(init.method).toBe("GET");
  });

  it("getTraceRun GETs /v3/ops/trace/{trace_id}/run/{run_id}", async () => {
    const f = vi.fn(async () => okJson({}));
    const ops = mk(f as unknown as typeof fetch);
    await ops.getTraceRun("trace-1", "run-1");
    const [url] = f.mock.calls[0] as [string];
    expect(url).toBe("https://ops.test/v3/ops/trace/trace-1/run/run-1");
  });

  it("getGroupedLogs GETs /v3/ops/grouped-logs with required + pagination params", async () => {
    const f = vi.fn(async () => okJson({}));
    const ops = mk(f as unknown as typeof fetch);
    await ops.getGroupedLogs({
      trace_id: "trace-1",
      run_id: "run-1",
      log_id: "log-1",
      page: 3,
      limit: 50,
    });
    const [url] = f.mock.calls[0] as [string];
    expect(url).toBe(
      "https://ops.test/v3/ops/grouped-logs?trace_id=trace-1&run_id=run-1&log_id=log-1&page=3&limit=50",
    );
  });

  it("getAgentToolLogs GETs /v3/ops/logs with all required params", async () => {
    const f = vi.fn(async () => okJson({}));
    const ops = mk(f as unknown as typeof fetch);
    await ops.getAgentToolLogs({
      trace_id: "trace-1",
      run_id: "run-1",
      log_id: "log-1",
      feature: "tool_call",
    });
    const [url] = f.mock.calls[0] as [string];
    expect(url).toBe(
      "https://ops.test/v3/ops/logs?trace_id=trace-1&run_id=run-1&log_id=log-1&feature=tool_call",
    );
  });

  it("throws LyzrApiError on non-2xx and never leaks the api key", async () => {
    const f = vi.fn(async () => okJson({ detail: "not found" }, 404));
    const ops = mk(f as unknown as typeof fetch);
    await expect(ops.getTrace("missing")).rejects.toBeInstanceOf(LyzrApiError);
    try {
      await ops.getTrace("missing");
    } catch (e) {
      expect((e as Error).message).not.toContain("test-key-123");
    }
  });
});
