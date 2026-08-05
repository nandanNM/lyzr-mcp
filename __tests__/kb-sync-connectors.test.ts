import { describe, it, expect, vi } from "vitest";
import { KbSyncConnectorsClient } from "../src/lyzr/kb-sync-connectors";
import { LyzrApiError } from "../src/lyzr/http";

const okJson = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });

const mk = (fetchImpl: typeof fetch, baseUrl = "https://rag.test") =>
  new KbSyncConnectorsClient({ apiKey: "test-key-123", baseUrl, fetchImpl });

describe("KbSyncConnectorsClient", () => {
  it("listConnectors GETs and normalizes a bare array", async () => {
    const f = vi.fn(async () => okJson([{ id: 1 }, { id: 2 }]));
    const client = mk(f as unknown as typeof fetch);
    const result = await client.listConnectors();
    const [url, init] = f.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://rag.test/v3/kb-sync/connectors/");
    expect(init.method).toBe("GET");
    expect(result).toEqual([{ id: 1 }, { id: 2 }]);
  });

  it("listConnectors normalizes a wrapped { connectors: [...] } shape", async () => {
    const f = vi.fn(async () => okJson({ connectors: [{ id: 3 }] }));
    const client = mk(f as unknown as typeof fetch);
    const result = await client.listConnectors();
    expect(result).toEqual([{ id: 3 }]);
  });

  it("createConnector POSTs the connector payload", async () => {
    const f = vi.fn(async () => okJson({ id: 5 }));
    const client = mk(f as unknown as typeof fetch);
    await client.createConnector({
      name: "my-connector",
      source: "google_drive",
      connector_specific_config: { folder_id: "abc" },
    });
    const [url, init] = f.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://rag.test/v3/kb-sync/connectors/");
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body as string)).toEqual({
      name: "my-connector",
      source: "google_drive",
      connector_specific_config: { folder_id: "abc" },
    });
  });

  it("getConnector GETs by id", async () => {
    const f = vi.fn(async () => okJson({ id: 7 }));
    const client = mk(f as unknown as typeof fetch);
    await client.getConnector(7);
    const [url, init] = f.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://rag.test/v3/kb-sync/connectors/7/");
    expect(init.method).toBe("GET");
  });

  it("updateConnector PATCHes the connector fields", async () => {
    const f = vi.fn(async () => okJson({ id: 7, disabled: true }));
    const client = mk(f as unknown as typeof fetch);
    await client.updateConnector(7, { disabled: true });
    const [url, init] = f.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://rag.test/v3/kb-sync/connectors/7/");
    expect(init.method).toBe("PATCH");
    expect(JSON.parse(init.body as string)).toEqual({ disabled: true });
  });

  it("deleteConnector DELETEs by id", async () => {
    const f = vi.fn(async () => okJson({}, 200));
    const client = mk(f as unknown as typeof fetch);
    await client.deleteConnector(9);
    const [url, init] = f.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://rag.test/v3/kb-sync/connectors/9/");
    expect(init.method).toBe("DELETE");
  });

  it("listKbSyncCredentials GETs and normalizes a bare array", async () => {
    const f = vi.fn(async () => okJson([{ id: 1 }]));
    const client = mk(f as unknown as typeof fetch);
    const result = await client.listKbSyncCredentials();
    const [url, init] = f.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://rag.test/v3/kb-sync/credentials/");
    expect(init.method).toBe("GET");
    expect(result).toEqual([{ id: 1 }]);
  });

  it("createKbSyncCredential POSTs the credential payload", async () => {
    const f = vi.fn(async () => okJson({ id: 2 }));
    const client = mk(f as unknown as typeof fetch);
    await client.createKbSyncCredential({
      credential_json: { token: "abc" },
      scope: "org",
    });
    const [url, init] = f.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://rag.test/v3/kb-sync/credentials/");
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body as string)).toEqual({
      credential_json: { token: "abc" },
      scope: "org",
    });
  });

  it("throws LyzrApiError on a non-2xx response without leaking the api key", async () => {
    const f = vi.fn(async () => okJson({ detail: "not found" }, 404));
    const client = mk(f as unknown as typeof fetch);
    await expect(client.getConnector(999)).rejects.toBeInstanceOf(LyzrApiError);
    try {
      await client.getConnector(999);
    } catch (e) {
      expect((e as Error).message).not.toContain("test-key-123");
    }
  });
});
