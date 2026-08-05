import { describe, it, expect, vi } from "vitest";
import { AuditLogsClient } from "../src/lyzr/audit-logs";
import { LyzrApiError } from "../src/lyzr/http";

const okJson = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });

const mk = (fetchImpl: typeof fetch, baseUrl: string) =>
  new AuditLogsClient({ apiKey: "k", baseUrl, fetchImpl });

describe("AuditLogsClient", () => {
  it("listOrgAuditLogs GETs /v3/audit-logs/ with query params", async () => {
    const f = vi.fn(async () =>
      okJson({ logs: [], total: 0, limit: 100, offset: 0, has_more: false }),
    );
    const client = mk(f as unknown as typeof fetch, "https://agent.test");
    await client.listOrgAuditLogs({
      user_id: "u1",
      action: "create",
      resource_type: "agent",
      limit: 10,
      offset: 5,
    });
    const [url, init] = f.mock.calls[0] as [string, RequestInit];
    expect(init.method).toBe("GET");
    expect(url).toBe(
      "https://agent.test/v3/audit-logs/?user_id=u1&action=create&resource_type=agent&limit=10&offset=5",
    );
  });

  it("listMyAuditLogs GETs /v3/audit-logs/me", async () => {
    const f = vi.fn(async () =>
      okJson({ logs: [], total: 0, limit: 100, offset: 0, has_more: false }),
    );
    const client = mk(f as unknown as typeof fetch, "https://agent.test");
    await client.listMyAuditLogs({ result: "success" });
    const [url, init] = f.mock.calls[0] as [string, RequestInit];
    expect(init.method).toBe("GET");
    expect(url).toBe("https://agent.test/v3/audit-logs/me?result=success");
  });

  it("listUserAuditLogs GETs /v3/audit-logs/user/{user_id}", async () => {
    const f = vi.fn(async () =>
      okJson({ logs: [], total: 0, limit: 100, offset: 0, has_more: false }),
    );
    const client = mk(f as unknown as typeof fetch, "https://agent.test");
    await client.listUserAuditLogs("u42", { action: "login" });
    const [url] = f.mock.calls[0] as [string];
    expect(url).toBe("https://agent.test/v3/audit-logs/user/u42?action=login");
  });

  it("listResourceAuditLogs GETs /v3/audit-logs/resource/{type}/{id}", async () => {
    const f = vi.fn(async () =>
      okJson({ logs: [], total: 0, limit: 50, offset: 0, has_more: false }),
    );
    const client = mk(f as unknown as typeof fetch, "https://agent.test");
    await client.listResourceAuditLogs("agent", "a1", { limit: 20 });
    const [url] = f.mock.calls[0] as [string];
    expect(url).toBe(
      "https://agent.test/v3/audit-logs/resource/agent/a1?limit=20",
    );
  });

  it("listSessionAuditLogs GETs /v3/audit-logs/session/{session_id}", async () => {
    const f = vi.fn(async () =>
      okJson({ logs: [], total: 0, limit: 100, offset: 0, has_more: false }),
    );
    const client = mk(f as unknown as typeof fetch, "https://agent.test");
    await client.listSessionAuditLogs("s1", { offset: 10 });
    const [url] = f.mock.calls[0] as [string];
    expect(url).toBe("https://agent.test/v3/audit-logs/session/s1?offset=10");
  });

  it("getStats GETs /v3/audit-logs/stats with time range", async () => {
    const f = vi.fn(async () =>
      okJson({
        total_events: 1,
        events_by_action: {},
        events_by_resource: {},
        events_by_result: {},
        events_by_severity: {},
      }),
    );
    const client = mk(f as unknown as typeof fetch, "https://agent.test");
    await client.getStats({ start_time: "2024-01-01T00:00:00Z" });
    const [url] = f.mock.calls[0] as [string];
    expect(url).toBe(
      "https://agent.test/v3/audit-logs/stats?start_time=2024-01-01T00%3A00%3A00Z",
    );
  });

  it("getActivityMetrics GETs /v3/audit-logs/activity/metrics", async () => {
    const f = vi.fn(async () =>
      okJson({
        org_id: "o1",
        date: "2024-01-01",
        dau: 5,
        mau: 20,
        daily_active_rate: 0.25,
      }),
    );
    const client = mk(f as unknown as typeof fetch, "https://agent.test");
    await client.getActivityMetrics("2024-01-01");
    const [url] = f.mock.calls[0] as [string];
    expect(url).toBe(
      "https://agent.test/v3/audit-logs/activity/metrics?date=2024-01-01",
    );
  });

  it("getDau GETs /v3/audit-logs/activity/dau", async () => {
    const f = vi.fn(async () =>
      okJson({ org_id: "o1", date: "2024-01-01", dau: 5 }),
    );
    const client = mk(f as unknown as typeof fetch, "https://agent.test");
    await client.getDau();
    const [url] = f.mock.calls[0] as [string];
    expect(url).toBe("https://agent.test/v3/audit-logs/activity/dau");
  });

  it("getMau GETs /v3/audit-logs/activity/mau", async () => {
    const f = vi.fn(async () =>
      okJson({ org_id: "o1", month: "2024-01", mau: 20 }),
    );
    const client = mk(f as unknown as typeof fetch, "https://agent.test");
    await client.getMau("2024-01-15");
    const [url] = f.mock.calls[0] as [string];
    expect(url).toBe(
      "https://agent.test/v3/audit-logs/activity/mau?date=2024-01-15",
    );
  });

  it("getDauTrend GETs /v3/audit-logs/activity/dau/trend", async () => {
    const f = vi.fn(async () => okJson({ org_id: "o1", days: 7, trend: [] }));
    const client = mk(f as unknown as typeof fetch, "https://agent.test");
    await client.getDauTrend(14);
    const [url] = f.mock.calls[0] as [string];
    expect(url).toBe(
      "https://agent.test/v3/audit-logs/activity/dau/trend?days=14",
    );
  });

  it("getMauTrend GETs /v3/audit-logs/activity/mau/trend", async () => {
    const f = vi.fn(async () => okJson({ org_id: "o1", months: 6, trend: [] }));
    const client = mk(f as unknown as typeof fetch, "https://agent.test");
    await client.getMauTrend(3);
    const [url] = f.mock.calls[0] as [string];
    expect(url).toBe(
      "https://agent.test/v3/audit-logs/activity/mau/trend?months=3",
    );
  });

  it("logAuthEvent POSTs /v3/audit-logs/event with body", async () => {
    const f = vi.fn(async () => okJson({ status: "ok", message: "logged" }));
    const client = mk(f as unknown as typeof fetch, "https://agent.test");
    await client.logAuthEvent({
      event_type: "login",
      user_email: "u@example.com",
      metadata: { ip: "1.2.3.4" },
    });
    const [url, init] = f.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://agent.test/v3/audit-logs/event");
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body as string)).toEqual({
      event_type: "login",
      user_email: "u@example.com",
      metadata: { ip: "1.2.3.4" },
    });
  });

  it("getAuditLog GETs /v3/audit-logs/{log_id}", async () => {
    const f = vi.fn(async () =>
      okJson({
        _id: "l1",
        timestamp: "2024-01-01T00:00:00Z",
        actor: {},
        action: "create",
        target: {},
        result: "success",
        severity: "low",
      }),
    );
    const client = mk(f as unknown as typeof fetch, "https://agent.test");
    await client.getAuditLog("l1");
    const [url, init] = f.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://agent.test/v3/audit-logs/l1");
    expect(init.method).toBe("GET");
  });

  it("throws LyzrApiError on non-2xx response", async () => {
    const f = vi.fn(async () => okJson({ detail: "not found" }, 404));
    const client = mk(f as unknown as typeof fetch, "https://agent.test");
    await expect(client.getAuditLog("missing")).rejects.toBeInstanceOf(
      LyzrApiError,
    );
  });
});
