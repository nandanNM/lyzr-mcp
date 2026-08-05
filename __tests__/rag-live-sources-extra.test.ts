import { describe, it, expect, vi } from "vitest";
import { LiveSourcesExtraClient } from "../src/lyzr/rag-live-sources-extra";
import { LyzrApiError } from "../src/lyzr/http";

const okJson = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });

const mk = (fetchImpl: typeof fetch, baseUrl = "https://rag.test") =>
  new LiveSourcesExtraClient({ apiKey: "test-key-123", baseUrl, fetchImpl });

describe("LiveSourcesExtraClient", () => {
  it("syncPermissions POSTs to sync-permissions/", async () => {
    const f = vi.fn(async () => okJson({ status: "syncing" }));
    const client = mk(f as unknown as typeof fetch);
    await client.syncPermissions("rag1", "ls1");
    const [url, init] = f.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(
      "https://rag.test/v3/rag/rag1/live-sources/ls1/sync-permissions/",
    );
    expect(init.method).toBe("POST");
  });

  it("browseSites GETs with credential_id param", async () => {
    const f = vi.fn(async () => okJson({ sites: [] }));
    const client = mk(f as unknown as typeof fetch);
    await client.browseSites("cred1");
    const [url, init] = f.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(
      "https://rag.test/v3/rag/live-sources/browse/sites?credential_id=cred1",
    );
    expect(init.method).toBe("GET");
  });

  it("browseDrives GETs with credential_id and site_url params", async () => {
    const f = vi.fn(async () => okJson({ drives: [] }));
    const client = mk(f as unknown as typeof fetch);
    await client.browseDrives("cred1", "https://site.example");
    const [url] = f.mock.calls[0] as [string];
    expect(url).toBe(
      "https://rag.test/v3/rag/live-sources/browse/drives?credential_id=cred1&site_url=https%3A%2F%2Fsite.example",
    );
  });

  it("browseChildren GETs with all params including optional folder_path", async () => {
    const f = vi.fn(async () => okJson({ items: [] }));
    const client = mk(f as unknown as typeof fetch);
    await client.browseChildren(
      "cred1",
      "https://site.example",
      "Shared Documents",
      "sub/folder",
    );
    const [url] = f.mock.calls[0] as [string];
    expect(url).toBe(
      "https://rag.test/v3/rag/live-sources/browse/children?credential_id=cred1&site_url=https%3A%2F%2Fsite.example&drive_name=Shared+Documents&folder_path=sub%2Ffolder",
    );
  });

  it("browseChildren omits folder_path when not provided", async () => {
    const f = vi.fn(async () => okJson({ items: [] }));
    const client = mk(f as unknown as typeof fetch);
    await client.browseChildren("cred1", "https://site.example", "docs");
    const [url] = f.mock.calls[0] as [string];
    expect(url).not.toContain("folder_path");
  });

  it("validateAccess POSTs credential_id + site_urls", async () => {
    const f = vi.fn(async () =>
      okJson({ results: [], all_accessible: true }),
    );
    const client = mk(f as unknown as typeof fetch);
    await client.validateAccess({
      credential_id: "cred1",
      site_urls: ["https://a.example", "https://b.example"],
    });
    const [url, init] = f.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(
      "https://rag.test/v3/rag/live-sources/browse/validate-access",
    );
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body as string)).toEqual({
      credential_id: "cred1",
      site_urls: ["https://a.example", "https://b.example"],
    });
  });

  it("getWebhookNotifications GETs the notifications endpoint", async () => {
    const f = vi.fn(async () => okJson({ ok: true }));
    const client = mk(f as unknown as typeof fetch);
    await client.getWebhookNotifications();
    const [url, init] = f.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(
      "https://rag.test/v3/rag/live-sources/webhook/notifications",
    );
    expect(init.method).toBe("GET");
  });

  it("postWebhookNotification POSTs the payload", async () => {
    const f = vi.fn(async () => okJson({ received: true }));
    const client = mk(f as unknown as typeof fetch);
    await client.postWebhookNotification({ event: "file.changed" });
    const [url, init] = f.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(
      "https://rag.test/v3/rag/live-sources/webhook/notifications",
    );
    expect(JSON.parse(init.body as string)).toEqual({
      event: "file.changed",
    });
  });

  it("throws LyzrApiError on non-2xx and never leaks the api key", async () => {
    const f = vi.fn(
      async () =>
        new Response("forbidden", {
          status: 403,
          headers: { "Content-Type": "text/plain" },
        }),
    );
    const client = mk(f as unknown as typeof fetch);
    await expect(client.browseSites("cred1")).rejects.toBeInstanceOf(
      LyzrApiError,
    );
    try {
      await client.browseSites("cred1");
    } catch (e) {
      expect((e as Error).message).not.toContain("test-key-123");
    }
  });
});
