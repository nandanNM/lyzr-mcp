import { describe, it, expect, vi } from "vitest";
import { ArtifactsClient, LyzrApiError } from "../src/lyzr/artifacts";

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

describe("ArtifactsClient", () => {
  it("createArtifact POSTs /v3/artifacts/ with the body", async () => {
    const f = vi.fn(async () => okJson({ artifact_id: "a1" }));
    const client = mk(
      ArtifactsClient,
      f as unknown as typeof fetch,
      "https://art.test",
    );
    await client.createArtifact({
      user_id: "u1",
      session_id: "s1",
      data: { foo: "bar" },
      format_type: "json",
      name: "n",
    });
    const [url, init] = f.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://art.test/v3/artifacts/");
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body as string)).toEqual({
      user_id: "u1",
      session_id: "s1",
      data: { foo: "bar" },
      format_type: "json",
      name: "n",
    });
  });

  it("listArtifacts GETs /v3/artifacts/ with query params", async () => {
    const f = vi.fn(async () =>
      okJson({ artifacts: [{ id: "a1" }], total: 1, page: 1, limit: 10 }),
    );
    const client = mk(
      ArtifactsClient,
      f as unknown as typeof fetch,
      "https://art.test",
    );
    const result = await client.listArtifacts({
      page: 1,
      limit: 10,
      user_id: "u1",
      session_id: "s1",
      format_type: "json",
    });
    const [url, init] = f.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(
      "https://art.test/v3/artifacts/?page=1&limit=10&user_id=u1&session_id=s1&format_type=json",
    );
    expect(init.method).toBe("GET");
    expect(result).toEqual({
      artifacts: [{ id: "a1" }],
      total: 1,
      page: 1,
      limit: 10,
    });
  });

  it("listArtifacts handles a bare-array response", async () => {
    const f = vi.fn(async () => okJson([{ id: "a1" }]));
    const client = mk(
      ArtifactsClient,
      f as unknown as typeof fetch,
      "https://art.test",
    );
    const result = await client.listArtifacts();
    expect(result.artifacts).toEqual([{ id: "a1" }]);
    expect(result.total).toBe(0);
  });

  it("getArtifact GETs /v3/artifacts/{id} with user_id and session_id params", async () => {
    const f = vi.fn(async () => okJson({ artifact: { id: "a1" } }));
    const client = mk(
      ArtifactsClient,
      f as unknown as typeof fetch,
      "https://art.test",
    );
    await client.getArtifact("a1", "u1", "s1");
    const [url, init] = f.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(
      "https://art.test/v3/artifacts/a1?user_id=u1&session_id=s1",
    );
    expect(init.method).toBe("GET");
  });

  it("updateArtifact PUTs /v3/artifacts/{id} with body and params", async () => {
    const f = vi.fn(async () => okJson({ artifact: { id: "a1", name: "new" } }));
    const client = mk(
      ArtifactsClient,
      f as unknown as typeof fetch,
      "https://art.test",
    );
    await client.updateArtifact("a1", "u1", "s1", { name: "new" });
    const [url, init] = f.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(
      "https://art.test/v3/artifacts/a1?user_id=u1&session_id=s1",
    );
    expect(init.method).toBe("PUT");
    expect(JSON.parse(init.body as string)).toEqual({ name: "new" });
  });

  it("deleteArtifact DELETEs /v3/artifacts/{id} with params", async () => {
    const f = vi.fn(async () => okJson({ ok: true }));
    const client = mk(
      ArtifactsClient,
      f as unknown as typeof fetch,
      "https://art.test",
    );
    await client.deleteArtifact("a1", "u1", "s1");
    const [url, init] = f.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(
      "https://art.test/v3/artifacts/a1?user_id=u1&session_id=s1",
    );
    expect(init.method).toBe("DELETE");
  });

  it("listArtifactsByUserSession GETs the nested path with pagination", async () => {
    const f = vi.fn(async () =>
      okJson({ artifacts: [], total: 0, page: 2, limit: 5 }),
    );
    const client = mk(
      ArtifactsClient,
      f as unknown as typeof fetch,
      "https://art.test",
    );
    await client.listArtifactsByUserSession("u1", "s1", 2, 5);
    const [url, init] = f.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(
      "https://art.test/v3/artifacts/user/u1/session/s1?page=2&limit=5",
    );
    expect(init.method).toBe("GET");
  });

  it("throws LyzrApiError on a non-2xx response", async () => {
    const f = vi.fn(
      async () => new Response("not found", { status: 404 }),
    );
    const client = mk(
      ArtifactsClient,
      f as unknown as typeof fetch,
      "https://art.test",
    );
    await expect(client.getArtifact("bad", "u1", "s1")).rejects.toBeInstanceOf(
      LyzrApiError,
    );
  });
});
