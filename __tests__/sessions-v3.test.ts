import { describe, it, expect, vi } from "vitest";
import { SessionsV3Client } from "../src/lyzr/sessions-v3";
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

describe("SessionsV3Client", () => {
  it("createSession POSTs /v3/sessions with the body", async () => {
    const f = vi.fn(async () => okJson({ session_id: "s1" }));
    const c = mk(
      SessionsV3Client,
      f as unknown as typeof fetch,
      "https://agent.test",
    );
    await c.createSession({ session_id: "s1", agent_id: "a1" });
    const [url, init] = f.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://agent.test/v3/sessions");
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body as string)).toEqual({
      session_id: "s1",
      agent_id: "a1",
    });
  });

  it("listSessions GETs /v3/sessions with query params", async () => {
    const f = vi.fn(async () => okJson({ sessions: [], total: 0 }));
    const c = mk(
      SessionsV3Client,
      f as unknown as typeof fetch,
      "https://agent.test",
    );
    await c.listSessions({ agent_id: "a1", source: "playground", limit: 10, offset: 5 });
    const [url, init] = f.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(
      "https://agent.test/v3/sessions?agent_id=a1&source=playground&limit=10&offset=5",
    );
    expect(init.method).toBe("GET");
  });

  it("listSessions omits undefined params", async () => {
    const f = vi.fn(async () => okJson({}));
    const c = mk(
      SessionsV3Client,
      f as unknown as typeof fetch,
      "https://agent.test",
    );
    await c.listSessions();
    const [url] = f.mock.calls[0] as [string];
    expect(url).toBe("https://agent.test/v3/sessions");
  });

  it("getSession GETs /v3/sessions/{id}", async () => {
    const f = vi.fn(async () => okJson({ session_id: "s1" }));
    const c = mk(
      SessionsV3Client,
      f as unknown as typeof fetch,
      "https://agent.test",
    );
    await c.getSession("s1");
    const [url, init] = f.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://agent.test/v3/sessions/s1");
    expect(init.method).toBe("GET");
  });

  it("updateSession PATCHes /v3/sessions/{id} with metadata", async () => {
    const f = vi.fn(async () => okJson({ session_id: "s1" }));
    const c = mk(
      SessionsV3Client,
      f as unknown as typeof fetch,
      "https://agent.test",
    );
    await c.updateSession("s1", { metadata: { foo: "bar" } });
    const [url, init] = f.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://agent.test/v3/sessions/s1");
    expect(init.method).toBe("PATCH");
    expect(JSON.parse(init.body as string)).toEqual({
      metadata: { foo: "bar" },
    });
  });

  it("deleteSession DELETEs /v3/sessions/{id}", async () => {
    const f = vi.fn(async () => okJson({}));
    const c = mk(
      SessionsV3Client,
      f as unknown as typeof fetch,
      "https://agent.test",
    );
    await c.deleteSession("s1");
    const [url, init] = f.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://agent.test/v3/sessions/s1");
    expect(init.method).toBe("DELETE");
  });

  it("listMessages GETs /v3/sessions/{id}/messages with query params", async () => {
    const f = vi.fn(async () => okJson({ messages: [] }));
    const c = mk(
      SessionsV3Client,
      f as unknown as typeof fetch,
      "https://agent.test",
    );
    await c.listMessages("s1", { limit: 5, offset: 0, role: "user", after: "2024-01-01T00:00:00Z" });
    const [url, init] = f.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(
      "https://agent.test/v3/sessions/s1/messages?limit=5&offset=0&role=user&after=2024-01-01T00%3A00%3A00Z",
    );
    expect(init.method).toBe("GET");
  });

  it("branchSession POSTs /v3/sessions/{id}/branch with the body", async () => {
    const f = vi.fn(async () => okJson({ session_id: "s2" }));
    const c = mk(
      SessionsV3Client,
      f as unknown as typeof fetch,
      "https://agent.test",
    );
    await c.branchSession("s1", {
      from_message_id: "m1",
      new_session_id: "s2",
      branch_name: "alt",
    });
    const [url, init] = f.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://agent.test/v3/sessions/s1/branch");
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body as string)).toEqual({
      from_message_id: "m1",
      new_session_id: "s2",
      branch_name: "alt",
    });
  });

  it("listBranches GETs /v3/sessions/{id}/branches", async () => {
    const f = vi.fn(async () => okJson({ branches: [], total: 0 }));
    const c = mk(
      SessionsV3Client,
      f as unknown as typeof fetch,
      "https://agent.test",
    );
    await c.listBranches("s1");
    const [url, init] = f.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://agent.test/v3/sessions/s1/branches");
    expect(init.method).toBe("GET");
  });

  it("getSessionTree GETs /v3/sessions/{id}/tree", async () => {
    const f = vi.fn(async () => okJson({ root_session_id: "s1", nodes: [] }));
    const c = mk(
      SessionsV3Client,
      f as unknown as typeof fetch,
      "https://agent.test",
    );
    await c.getSessionTree("s1");
    const [url, init] = f.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://agent.test/v3/sessions/s1/tree");
    expect(init.method).toBe("GET");
  });

  it("getSessionAncestry GETs /v3/sessions/{id}/ancestry", async () => {
    const f = vi.fn(async () => okJson({ ancestry: [] }));
    const c = mk(
      SessionsV3Client,
      f as unknown as typeof fetch,
      "https://agent.test",
    );
    await c.getSessionAncestry("s1");
    const [url, init] = f.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://agent.test/v3/sessions/s1/ancestry");
    expect(init.method).toBe("GET");
  });

  it("throws LyzrApiError on non-2xx", async () => {
    const f = vi.fn(async () => okJson({ detail: "not found" }, 404));
    const c = mk(
      SessionsV3Client,
      f as unknown as typeof fetch,
      "https://agent.test",
    );
    await expect(c.getSession("missing")).rejects.toBeInstanceOf(LyzrApiError);
  });
});
