import { describe, it, expect, vi } from "vitest";
import { SharingClient } from "../src/lyzr/sharing";
import { LyzrApiError } from "../src/lyzr/http";

const okJson = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });

const mk = (fetchImpl: typeof fetch, baseUrl = "https://sharing.test") =>
  new SharingClient({ apiKey: "k", baseUrl, fetchImpl });

describe("SharingClient", () => {
  it("createGroup POSTs /v3/sharing/groups with body", async () => {
    const f = vi.fn(async () => okJson({ group_id: "g1" }));
    const client = mk(f as unknown as typeof fetch);
    await client.createGroup({
      root_resource_id: "r1",
      root_resource_type: "agent",
      access_level: "private",
      shared_with: [{ user_id: "u1", access_level: "read" }],
    });
    const [url, init] = f.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://sharing.test/v3/sharing/groups");
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body as string)).toEqual({
      root_resource_id: "r1",
      root_resource_type: "agent",
      access_level: "private",
      shared_with: [{ user_id: "u1", access_level: "read" }],
    });
  });

  it("listGroups GETs /v3/sharing/groups with page + limit params", async () => {
    const f = vi.fn(async () => okJson({ data: [] }));
    const client = mk(f as unknown as typeof fetch);
    await client.listGroups({ page: 2, limit: 20 });
    const [url, init] = f.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://sharing.test/v3/sharing/groups?page=2&limit=20");
    expect(init.method).toBe("GET");
  });

  it("getGroup GETs /v3/sharing/groups/{group_id}", async () => {
    const f = vi.fn(async () => okJson({ group_id: "g1" }));
    const client = mk(f as unknown as typeof fetch);
    await client.getGroup("g1");
    const [url, init] = f.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://sharing.test/v3/sharing/groups/g1");
    expect(init.method).toBe("GET");
  });

  it("updateGroup PUTs /v3/sharing/groups/{group_id} with body", async () => {
    const f = vi.fn(async () => okJson({ group_id: "g1" }));
    const client = mk(f as unknown as typeof fetch);
    await client.updateGroup("g1", { access_level: "write" });
    const [url, init] = f.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://sharing.test/v3/sharing/groups/g1");
    expect(init.method).toBe("PUT");
    expect(JSON.parse(init.body as string)).toEqual({
      access_level: "write",
    });
  });

  it("deleteGroup DELETEs /v3/sharing/groups/{group_id}", async () => {
    const f = vi.fn(async () => okJson({}));
    const client = mk(f as unknown as typeof fetch);
    await client.deleteGroup("g1");
    const [url, init] = f.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://sharing.test/v3/sharing/groups/g1");
    expect(init.method).toBe("DELETE");
  });

  it("shareGroup POSTs /v3/sharing/groups/{group_id}/share with shared_with", async () => {
    const f = vi.fn(async () => okJson({}));
    const client = mk(f as unknown as typeof fetch);
    await client.shareGroup("g1", {
      shared_with: [{ user_id: "u2" }],
    });
    const [url, init] = f.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://sharing.test/v3/sharing/groups/g1/share");
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body as string)).toEqual({
      shared_with: [{ user_id: "u2" }],
    });
  });

  it("refreshGroup POSTs /v3/sharing/groups/{group_id}/refresh", async () => {
    const f = vi.fn(async () => okJson({}));
    const client = mk(f as unknown as typeof fetch);
    await client.refreshGroup("g1");
    const [url, init] = f.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://sharing.test/v3/sharing/groups/g1/refresh");
    expect(init.method).toBe("POST");
  });

  it("getResourceGroups GETs the nested resource path with root_tree param", async () => {
    const f = vi.fn(async () => okJson([]));
    const client = mk(f as unknown as typeof fetch);
    await client.getResourceGroups("agent", "a1", true);
    const [url, init] = f.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(
      "https://sharing.test/v3/sharing/resources/agent/a1/groups?root_tree=true",
    );
    expect(init.method).toBe("GET");
  });

  it("reconcileIndexes POSTs /v3/sharing/indexes/reconcile", async () => {
    const f = vi.fn(async () => okJson({}));
    const client = mk(f as unknown as typeof fetch);
    await client.reconcileIndexes();
    const [url, init] = f.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://sharing.test/v3/sharing/indexes/reconcile");
    expect(init.method).toBe("POST");
  });

  it("checkAccess GETs /v3/sharing/check with all query params", async () => {
    const f = vi.fn(async () => okJson({ allowed: true }));
    const client = mk(f as unknown as typeof fetch);
    await client.checkAccess({
      resource_type: "agent",
      resource_id: "a1",
      user_id: "u1",
      org_id: "o1",
      required_access: "write",
    });
    const [url, init] = f.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(
      "https://sharing.test/v3/sharing/check?resource_type=agent&resource_id=a1&user_id=u1&org_id=o1&required_access=write",
    );
    expect(init.method).toBe("GET");
  });

  it("listAccessible GETs /v3/sharing/accessible with query params", async () => {
    const f = vi.fn(async () => okJson([]));
    const client = mk(f as unknown as typeof fetch);
    await client.listAccessible({
      resource_type: "agent",
      user_id: "u1",
      org_id: "o1",
    });
    const [url, init] = f.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(
      "https://sharing.test/v3/sharing/accessible?resource_type=agent&user_id=u1&org_id=o1",
    );
    expect(init.method).toBe("GET");
  });

  it("throws LyzrApiError on non-2xx response", async () => {
    const f = vi.fn(async () => okJson({ detail: "nope" }, 404));
    const client = mk(f as unknown as typeof fetch);
    await expect(client.getGroup("missing")).rejects.toBeInstanceOf(
      LyzrApiError,
    );
  });
});
