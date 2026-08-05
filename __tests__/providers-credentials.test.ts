import { describe, it, expect, vi } from "vitest";
import {
  ProviderCredentialsClient,
  LyzrApiError,
} from "../src/lyzr/providers-credentials";

const okJson = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });

const mk = (fetchImpl: typeof fetch, baseUrl = "https://api.test") =>
  new ProviderCredentialsClient({ apiKey: "test-key-123", baseUrl, fetchImpl });

describe("ProviderCredentialsClient", () => {
  it("createCredential POSTs /v3/providers/credentials with the full body", async () => {
    const f = vi.fn(async () =>
      okJson({ message: "created", credential_id: "cred1" }),
    );
    const client = mk(f as unknown as typeof fetch);
    const result = await client.createCredential({
      name: "my-cred",
      provider_id: "prov1",
      type: "api_key",
      credentials: { token: "abc" },
      meta_data: { env: "prod" },
    });
    const [url, init] = f.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://api.test/v3/providers/credentials");
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body as string)).toEqual({
      name: "my-cred",
      provider_id: "prov1",
      type: "api_key",
      credentials: { token: "abc" },
      meta_data: { env: "prod" },
    });
    expect(result.credential_id).toBe("cred1");
  });

  it("createBigQueryCredential POSTs multipart form data to the big_query path", async () => {
    const f = vi.fn(async () =>
      okJson({ message: "created", credential_id: "bq1" }),
    );
    const client = mk(f as unknown as typeof fetch);
    await client.createBigQueryCredential({
      credential_data: JSON.stringify({ name: "bq-cred" }),
      service_account_json: {
        content: Buffer.from("{}").toString("base64"),
        filename: "sa.json",
        contentType: "application/json",
      },
    });
    const [url, init] = f.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://api.test/v3/providers/credentials/big_query");
    expect(init.method).toBe("POST");
    expect(init.body).toBeInstanceOf(FormData);
    const form = init.body as FormData;
    expect(form.get("credential_data")).toBe(JSON.stringify({ name: "bq-cred" }));
    const file = form.get("service_account_json") as File;
    expect(file.name).toBe("sa.json");
  });

  it("createFileUploadCredential POSTs multipart form data with multiple files", async () => {
    const f = vi.fn(async () =>
      okJson({ message: "created", credential_id: "fu1" }),
    );
    const client = mk(f as unknown as typeof fetch);
    await client.createFileUploadCredential({
      credential_data: "{}",
      files: [
        { content: Buffer.from("a").toString("base64"), filename: "a.txt" },
        { content: Buffer.from("b").toString("base64"), filename: "b.txt" },
      ],
    });
    const [url, init] = f.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://api.test/v3/providers/credentials/file_upload");
    const form = init.body as FormData;
    const files = form.getAll("files") as File[];
    expect(files).toHaveLength(2);
    expect(files.map((file) => file.name)).toEqual(["a.txt", "b.txt"]);
  });

  it("getCredential GETs /v3/providers/credentials/{id}", async () => {
    const f = vi.fn(async () => okJson({ credential_id: "cred1" }));
    const client = mk(f as unknown as typeof fetch);
    await client.getCredential("cred1");
    const [url, init] = f.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://api.test/v3/providers/credentials/cred1");
    expect(init.method).toBe("GET");
  });

  it("updateCredential PUTs the merged body including credential_id", async () => {
    const f = vi.fn(async () => okJson({ ok: true }));
    const client = mk(f as unknown as typeof fetch);
    await client.updateCredential("cred1", {
      name: "renamed",
      type: "api_key",
      credentials: { token: "xyz" },
      user_id: "u1",
      meta_data: {},
    });
    const [url, init] = f.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://api.test/v3/providers/credentials/cred1");
    expect(init.method).toBe("PUT");
    expect(JSON.parse(init.body as string)).toEqual({
      credential_id: "cred1",
      name: "renamed",
      type: "api_key",
      credentials: { token: "xyz" },
      user_id: "u1",
      meta_data: {},
    });
  });

  it("deleteCredential DELETEs /v3/providers/credentials/{id}", async () => {
    const f = vi.fn(async () => okJson({}));
    const client = mk(f as unknown as typeof fetch);
    await client.deleteCredential("cred1");
    const [url, init] = f.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://api.test/v3/providers/credentials/cred1");
    expect(init.method).toBe("DELETE");
  });

  it("updateFileUploadCredential PUTs multipart form data to the file_upload path", async () => {
    const f = vi.fn(async () => okJson({ ok: true }));
    const client = mk(f as unknown as typeof fetch);
    await client.updateFileUploadCredential("cred1", {
      update_data: "{}",
      files: [{ content: Buffer.from("x").toString("base64"), filename: "x.txt" }],
    });
    const [url, init] = f.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(
      "https://api.test/v3/providers/credentials/file_upload/cred1",
    );
    expect(init.method).toBe("PUT");
    const form = init.body as FormData;
    expect(form.get("update_data")).toBe("{}");
    expect((form.getAll("files") as File[])[0].name).toBe("x.txt");
  });

  it("updateFileUploadCredential works with no files", async () => {
    const f = vi.fn(async () => okJson({ ok: true }));
    const client = mk(f as unknown as typeof fetch);
    await client.updateFileUploadCredential("cred1", { update_data: "{}" });
    const [, init] = f.mock.calls[0] as [string, RequestInit];
    const form = init.body as FormData;
    expect(form.getAll("files")).toHaveLength(0);
  });

  it("listCredentialsByUserAndType GETs the user/type/id path", async () => {
    const f = vi.fn(async () => okJson([{ credential_id: "cred1" }]));
    const client = mk(f as unknown as typeof fetch);
    await client.listCredentialsByUserAndType("openai", "prov1");
    const [url, init] = f.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(
      "https://api.test/v3/providers/credentials/user/openai/prov1",
    );
    expect(init.method).toBe("GET");
  });

  it("listCredentialsByType GETs the type path", async () => {
    const f = vi.fn(async () => okJson([{ credential_id: "cred1" }]));
    const client = mk(f as unknown as typeof fetch);
    await client.listCredentialsByType("openai");
    const [url, init] = f.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://api.test/v3/providers/credentials/type/openai");
    expect(init.method).toBe("GET");
  });

  it("throws LyzrApiError on non-2xx and never leaks the api key", async () => {
    const f = vi.fn(async () =>
      new Response("forbidden", { status: 403 }),
    );
    const client = mk(f as unknown as typeof fetch);
    await expect(client.getCredential("cred1")).rejects.toBeInstanceOf(
      LyzrApiError,
    );
    try {
      await client.getCredential("cred1");
    } catch (e) {
      expect((e as Error).message).not.toContain("test-key-123");
    }
  });

  it("throws LyzrApiError on non-2xx for a multipart request too", async () => {
    const f = vi.fn(async () => new Response("bad request", { status: 400 }));
    const client = mk(f as unknown as typeof fetch);
    await expect(
      client.createFileUploadCredential({
        credential_data: "{}",
        files: [{ content: "AA==", filename: "a.txt" }],
      }),
    ).rejects.toBeInstanceOf(LyzrApiError);
  });
});
