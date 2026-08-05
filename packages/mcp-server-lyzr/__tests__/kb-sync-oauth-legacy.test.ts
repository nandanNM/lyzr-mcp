import { describe, it, expect, vi } from "vitest";
import { KbSyncLegacyClient } from "../src/lyzr/kb-sync-oauth-legacy";
import { LyzrApiError } from "../src/lyzr/http";

const okJson = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });

const mk = (fetchImpl: typeof fetch, baseUrl = "https://rag.test") =>
  new KbSyncLegacyClient({ apiKey: "test-key-123", baseUrl, fetchImpl });

describe("KbSyncLegacyClient — OAuth", () => {
  it("sharepointOauthExchange POSTs the exchange endpoint", async () => {
    const f = vi.fn(async () => okJson({}));
    const client = mk(f as unknown as typeof fetch);
    await client.sharepointOauthExchange();
    const [url, init] = f.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://rag.test/v3/kb-sync/oauth/sharepoint/exchange");
    expect(init.method).toBe("POST");
  });

  it("sharepointOauthCallback GETs the callback endpoint", async () => {
    const f = vi.fn(async () => okJson({}));
    const client = mk(f as unknown as typeof fetch);
    await client.sharepointOauthCallback();
    const [url, init] = f.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://rag.test/v3/kb-sync/oauth/sharepoint/callback");
    expect(init.method).toBe("GET");
  });

  it("sharepointOauthAuthorize GETs the authorize endpoint", async () => {
    const f = vi.fn(async () => okJson({}));
    const client = mk(f as unknown as typeof fetch);
    await client.sharepointOauthAuthorize();
    const [url, init] = f.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://rag.test/v3/kb-sync/oauth/sharepoint/authorize");
    expect(init.method).toBe("GET");
  });
});

describe("KbSyncLegacyClient — Browse", () => {
  it("browseSites GETs with credential_id param", async () => {
    const f = vi.fn(async () => okJson({ sites: [] }));
    const client = mk(f as unknown as typeof fetch);
    await client.browseSites("cred-1");
    const [url] = f.mock.calls[0] as [string];
    expect(url).toBe(
      "https://rag.test/v3/kb-sync/browse/sites?credential_id=cred-1",
    );
  });

  it("browseDrives GETs with credential_id + site_url params", async () => {
    const f = vi.fn(async () => okJson({ drives: [] }));
    const client = mk(f as unknown as typeof fetch);
    await client.browseDrives("cred-1", "https://site.example");
    const [url] = f.mock.calls[0] as [string];
    expect(url).toBe(
      "https://rag.test/v3/kb-sync/browse/drives?credential_id=cred-1&site_url=https%3A%2F%2Fsite.example",
    );
  });

  it("browseChildren GETs with all params including optional folder_path", async () => {
    const f = vi.fn(async () => okJson({ items: [] }));
    const client = mk(f as unknown as typeof fetch);
    await client.browseChildren(
      "cred-1",
      "https://site.example",
      "Shared Documents",
      "sub/folder",
    );
    const [url] = f.mock.calls[0] as [string];
    expect(url).toBe(
      "https://rag.test/v3/kb-sync/browse/children?credential_id=cred-1&site_url=https%3A%2F%2Fsite.example&drive_name=Shared+Documents&folder_path=sub%2Ffolder",
    );
  });

  it("browseChildren omits folder_path when not provided", async () => {
    const f = vi.fn(async () => okJson({ items: [] }));
    const client = mk(f as unknown as typeof fetch);
    await client.browseChildren(
      "cred-1",
      "https://site.example",
      "Shared Documents",
    );
    const [url] = f.mock.calls[0] as [string];
    expect(url).toBe(
      "https://rag.test/v3/kb-sync/browse/children?credential_id=cred-1&site_url=https%3A%2F%2Fsite.example&drive_name=Shared+Documents",
    );
  });

  it("validateSiteAccess POSTs credential_id + site_urls body", async () => {
    const f = vi.fn(async () => okJson({ results: [], all_accessible: true }));
    const client = mk(f as unknown as typeof fetch);
    await client.validateSiteAccess({
      credential_id: "cred-1",
      site_urls: ["https://site.example/a", "https://site.example/b"],
    });
    const [url, init] = f.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://rag.test/v3/kb-sync/browse/validate-access");
    expect(init.method).toBe("POST");
    const body = JSON.parse(init.body as string);
    expect(body).toEqual({
      credential_id: "cred-1",
      site_urls: ["https://site.example/a", "https://site.example/b"],
    });
  });
});

describe("KbSyncLegacyClient — Webhooks", () => {
  it("webhookValidation GETs the notifications endpoint", async () => {
    const f = vi.fn(async () => okJson({}));
    const client = mk(f as unknown as typeof fetch);
    await client.webhookValidation();
    const [url, init] = f.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://rag.test/v3/kb-sync/webhook/notifications");
    expect(init.method).toBe("GET");
  });

  it("webhookNotification POSTs the payload to the notifications endpoint", async () => {
    const f = vi.fn(async () => okJson({}));
    const client = mk(f as unknown as typeof fetch);
    await client.webhookNotification({ event: "file.updated" });
    const [url, init] = f.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://rag.test/v3/kb-sync/webhook/notifications");
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body as string)).toEqual({
      event: "file.updated",
    });
  });
});

describe("KbSyncLegacyClient — error path", () => {
  it("surfaces a non-2xx response as LyzrApiError without leaking the api key", async () => {
    const f = vi.fn(
      async () =>
        new Response("unauthorized", {
          status: 401,
          headers: { "Content-Type": "text/plain" },
        }),
    );
    const client = mk(f as unknown as typeof fetch);
    await expect(client.browseSites("cred-1")).rejects.toBeInstanceOf(
      LyzrApiError,
    );
    try {
      await client.browseSites("cred-1");
    } catch (e) {
      expect((e as Error).message).not.toContain("test-key-123");
    }
  });
});
