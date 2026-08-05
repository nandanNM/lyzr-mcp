import { describe, it, expect, vi } from "vitest";
import { ReportsClient, LyzrApiError } from "../src/lyzr/reports";

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

describe("ReportsClient", () => {
  it("requestUsageByAgentReport POSTs /v3/reports/usage-by-agent with the body", async () => {
    const f = vi.fn(async () =>
      okJson({ job_id: "j1", status: "queued", message: "queued" }),
    );
    const reports = mk(
      ReportsClient,
      f as unknown as typeof fetch,
      "https://agent.test",
    );
    const result = await reports.requestUsageByAgentReport({
      timeframe: "last_30d",
      agent_type: "chat",
      include_sub_orgs: true,
    });
    const [url, init] = f.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://agent.test/v3/reports/usage-by-agent");
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body as string)).toEqual({
      timeframe: "last_30d",
      agent_type: "chat",
      include_sub_orgs: true,
    });
    expect(result.job_id).toBe("j1");
  });

  it("requestUsageByUserReport POSTs /v3/reports/usage-by-user with the body", async () => {
    const f = vi.fn(async () =>
      okJson({ job_id: "j2", status: "queued", message: "queued" }),
    );
    const reports = mk(
      ReportsClient,
      f as unknown as typeof fetch,
      "https://agent.test",
    );
    await reports.requestUsageByUserReport({
      timeframe: "custom",
      start_date: "2026-01-01",
      end_date: "2026-01-31",
    });
    const [url, init] = f.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://agent.test/v3/reports/usage-by-user");
    expect(JSON.parse(init.body as string)).toEqual({
      timeframe: "custom",
      start_date: "2026-01-01",
      end_date: "2026-01-31",
    });
  });

  it("requestUsageByModelReport POSTs /v3/reports/usage-by-model with the body", async () => {
    const f = vi.fn(async () =>
      okJson({ job_id: "j3", status: "queued", message: "queued" }),
    );
    const reports = mk(
      ReportsClient,
      f as unknown as typeof fetch,
      "https://agent.test",
    );
    await reports.requestUsageByModelReport({
      timeframe: "this_month",
      provider_id: "OpenAI",
      model: "gpt-4o",
    });
    const [url, init] = f.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://agent.test/v3/reports/usage-by-model");
    expect(JSON.parse(init.body as string)).toEqual({
      timeframe: "this_month",
      provider_id: "OpenAI",
      model: "gpt-4o",
    });
  });

  it("requestUsageBySubAccountReport POSTs /v3/reports/usage-by-sub-account with the body", async () => {
    const f = vi.fn(async () =>
      okJson({ job_id: "j4", status: "queued", message: "queued" }),
    );
    const reports = mk(
      ReportsClient,
      f as unknown as typeof fetch,
      "https://agent.test",
    );
    await reports.requestUsageBySubAccountReport({
      timeframe: "last_week",
      sub_org_id: "org_123",
      group_by: "month",
    });
    const [url, init] = f.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://agent.test/v3/reports/usage-by-sub-account");
    expect(JSON.parse(init.body as string)).toEqual({
      timeframe: "last_week",
      sub_org_id: "org_123",
      group_by: "month",
    });
  });

  it("getReportStatus GETs /v3/reports/{job_id}", async () => {
    const f = vi.fn(async () =>
      okJson({
        job_id: "j1",
        report_type: "usage_by_agent",
        status: "ready",
        created_at: "2026-08-01T00:00:00Z",
        download_url: "https://example.com/report.csv",
      }),
    );
    const reports = mk(
      ReportsClient,
      f as unknown as typeof fetch,
      "https://agent.test",
    );
    const result = await reports.getReportStatus("j1");
    const [url, init] = f.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://agent.test/v3/reports/j1");
    expect(init.method).toBe("GET");
    expect(result.status).toBe("ready");
    expect(result.download_url).toBe("https://example.com/report.csv");
  });

  it("listReports GETs /v3/reports with query params", async () => {
    const f = vi.fn(async () =>
      okJson({ jobs: [], total: 0, skip: 0, limit: 20 }),
    );
    const reports = mk(
      ReportsClient,
      f as unknown as typeof fetch,
      "https://agent.test",
    );
    await reports.listReports({
      skip: 10,
      limit: 5,
      report_type: "usage_by_user",
      status: "ready",
    });
    const [url, init] = f.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(
      "https://agent.test/v3/reports?skip=10&limit=5&report_type=usage_by_user&status=ready",
    );
    expect(init.method).toBe("GET");
  });

  it("listReports works with no params", async () => {
    const f = vi.fn(async () =>
      okJson({ jobs: [{ job_id: "j1" }], total: 1, skip: 0, limit: 20 }),
    );
    const reports = mk(
      ReportsClient,
      f as unknown as typeof fetch,
      "https://agent.test",
    );
    const result = await reports.listReports();
    const [url] = f.mock.calls[0] as [string];
    expect(url).toBe("https://agent.test/v3/reports");
    expect(result.total).toBe(1);
  });

  it("throws LyzrApiError on a non-2xx response", async () => {
    const f = vi.fn(async () =>
      new Response("job not found", { status: 404 }),
    );
    const reports = mk(
      ReportsClient,
      f as unknown as typeof fetch,
      "https://agent.test",
    );
    await expect(reports.getReportStatus("missing")).rejects.toBeInstanceOf(
      LyzrApiError,
    );
  });
});
