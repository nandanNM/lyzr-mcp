import { describe, it, expect, vi } from "vitest";
import { ToolIntegrationsClient } from "../src/lyzr/tools-v3-integrations";
import { LyzrApiError } from "../src/lyzr/http";

const okJson = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });

const mk = (fetchImpl: typeof fetch, baseUrl = "https://agent.test") =>
  new ToolIntegrationsClient({ apiKey: "k", baseUrl, fetchImpl });

describe("ToolIntegrationsClient", () => {
  it("getComposioAuthConfig GETs the provider path", async () => {
    const f = vi.fn(async () => okJson({ provider_id: "gmail" }));
    const c = mk(f as unknown as typeof fetch);
    await c.getComposioAuthConfig("gmail");
    const [url, init] = f.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://agent.test/v3/tools/composio/auth-configs/gmail");
    expect(init.method).toBe("GET");
  });

  it("createComposioAuthConfig POSTs the auth config body", async () => {
    const f = vi.fn(async () => okJson({ id: "ac1" }));
    const c = mk(f as unknown as typeof fetch);
    await c.createComposioAuthConfig({
      provider_id: "gmail",
      client_id: "cid",
      client_secret: "secret",
      scopes: "read write",
    });
    const [url, init] = f.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://agent.test/v3/tools/composio/auth-configs");
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body as string)).toEqual({
      provider_id: "gmail",
      client_id: "cid",
      client_secret: "secret",
      scopes: "read write",
    });
  });

  it("deleteComposioAuthConfig DELETEs the provider path", async () => {
    const f = vi.fn(async () => okJson({}));
    const c = mk(f as unknown as typeof fetch);
    await c.deleteComposioAuthConfig("gmail");
    const [url, init] = f.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://agent.test/v3/tools/composio/auth-configs/gmail");
    expect(init.method).toBe("DELETE");
  });

  it("deleteComposioConnection DELETEs the connection path", async () => {
    const f = vi.fn(async () => okJson({}));
    const c = mk(f as unknown as typeof fetch);
    await c.deleteComposioConnection("conn1");
    const [url, init] = f.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://agent.test/v3/tools/composio/connections/conn1");
    expect(init.method).toBe("DELETE");
  });

  it("listMcpServers GETs and normalizes the servers array", async () => {
    const f = vi.fn(async () =>
      okJson({ servers: [{ id: "s1" }, { id: "s2" }], total: 2 }),
    );
    const c = mk(f as unknown as typeof fetch);
    const result = await c.listMcpServers();
    const [url, init] = f.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://agent.test/v3/tools/mcp/servers");
    expect(init.method).toBe("GET");
    expect(result).toEqual([{ id: "s1" }, { id: "s2" }]);
  });

  it("createMcpServer POSTs name + config", async () => {
    const f = vi.fn(async () => okJson({ id: "srv1" }));
    const c = mk(f as unknown as typeof fetch);
    await c.createMcpServer({
      name: "My Server",
      config: { auth_type: "no_auth", server_url: "http://localhost:3000" },
    });
    const [url, init] = f.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://agent.test/v3/tools/mcp/servers");
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body as string)).toEqual({
      name: "My Server",
      config: { auth_type: "no_auth", server_url: "http://localhost:3000" },
    });
  });

  it("initiateMcpOauth POSTs the oauth initiate path", async () => {
    const f = vi.fn(async () =>
      okJson({ auth_url: "https://x", state: "st1", expires_at: "later" }),
    );
    const c = mk(f as unknown as typeof fetch);
    await c.initiateMcpOauth("srv1");
    const [url, init] = f.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(
      "https://agent.test/v3/tools/mcp/servers/srv1/oauth/initiate",
    );
    expect(init.method).toBe("POST");
  });

  it("getMcpOauthStatus GETs with the state query param", async () => {
    const f = vi.fn(async () => okJson({ status: "pending" }));
    const c = mk(f as unknown as typeof fetch);
    await c.getMcpOauthStatus("srv1", "st1");
    const [url] = f.mock.calls[0] as [string];
    expect(url).toBe(
      "https://agent.test/v3/tools/mcp/servers/srv1/oauth/status?state=st1",
    );
  });

  it("listMcpServerTools GETs the tools path", async () => {
    const f = vi.fn(async () => okJson({ tools: [] }));
    const c = mk(f as unknown as typeof fetch);
    await c.listMcpServerTools("srv1");
    const [url] = f.mock.calls[0] as [string];
    expect(url).toBe("https://agent.test/v3/tools/mcp/servers/srv1/tools");
  });

  it("listMcpServerResources GETs the resources path", async () => {
    const f = vi.fn(async () => okJson({}));
    const c = mk(f as unknown as typeof fetch);
    await c.listMcpServerResources("srv1");
    const [url] = f.mock.calls[0] as [string];
    expect(url).toBe("https://agent.test/v3/tools/mcp/servers/srv1/resources");
  });

  it("listMcpServerPrompts GETs the prompts path", async () => {
    const f = vi.fn(async () => okJson({}));
    const c = mk(f as unknown as typeof fetch);
    await c.listMcpServerPrompts("srv1");
    const [url] = f.mock.calls[0] as [string];
    expect(url).toBe("https://agent.test/v3/tools/mcp/servers/srv1/prompts");
  });

  it("executeMcpTool POSTs server_id/tool_name/arguments", async () => {
    const f = vi.fn(async () =>
      okJson({ server_id: "srv1", tool_name: "t1", result: [], success: true }),
    );
    const c = mk(f as unknown as typeof fetch);
    await c.executeMcpTool({
      server_id: "srv1",
      tool_name: "t1",
      arguments: { foo: "bar" },
    });
    const [url, init] = f.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://agent.test/v3/tools/mcp/tools/execute");
    expect(JSON.parse(init.body as string)).toEqual({
      server_id: "srv1",
      tool_name: "t1",
      arguments: { foo: "bar" },
    });
  });

  it("getMcpServerAgents GETs the agents path", async () => {
    const f = vi.fn(async () => okJson([]));
    const c = mk(f as unknown as typeof fetch);
    await c.getMcpServerAgents("srv1");
    const [url] = f.mock.calls[0] as [string];
    expect(url).toBe("https://agent.test/v3/tools/mcp/servers/srv1/agents");
  });

  it("deleteMcpServer DELETEs the server path", async () => {
    const f = vi.fn(async () => okJson({}));
    const c = mk(f as unknown as typeof fetch);
    await c.deleteMcpServer("srv1");
    const [url, init] = f.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://agent.test/v3/tools/mcp/servers/srv1");
    expect(init.method).toBe("DELETE");
  });

  it("createStaticToolCredential POSTs the credential body", async () => {
    const f = vi.fn(async () => okJson({ id: "cred1" }));
    const c = mk(f as unknown as typeof fetch);
    await c.createStaticToolCredential({
      credential_name: "my cred",
      user_id: "u1",
      provider_uuid: "p1",
      credentials: { api_key: "secret" },
    });
    const [url, init] = f.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://agent.test/v3/tools/credentials/static");
    expect(JSON.parse(init.body as string)).toEqual({
      credential_name: "my cred",
      user_id: "u1",
      provider_uuid: "p1",
      credentials: { api_key: "secret" },
    });
  });

  it("createOauthToolCredential POSTs the oauth credential body", async () => {
    const f = vi.fn(async () => okJson({ id: "cred2" }));
    const c = mk(f as unknown as typeof fetch);
    await c.createOauthToolCredential({
      credential_name: "my oauth cred",
      user_id: "u1",
      provider_uuid: "p1",
      grant_type: "client_credentials",
    });
    const [url, init] = f.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://agent.test/v3/tools/credentials/oauth");
    expect(JSON.parse(init.body as string)).toMatchObject({
      credential_name: "my oauth cred",
      user_id: "u1",
      provider_uuid: "p1",
      grant_type: "client_credentials",
    });
  });

  it("refreshToolCredentialStatus PATCHes the status path", async () => {
    const f = vi.fn(async () => okJson({}));
    const c = mk(f as unknown as typeof fetch);
    await c.refreshToolCredentialStatus("cred1");
    const [url, init] = f.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://agent.test/v3/tools/credentials/cred1/status");
    expect(init.method).toBe("PATCH");
  });

  it("isToolCredentialTestSupported GETs the test/supported path", async () => {
    const f = vi.fn(async () => okJson({ supported: true }));
    const c = mk(f as unknown as typeof fetch);
    await c.isToolCredentialTestSupported("cred1");
    const [url] = f.mock.calls[0] as [string];
    expect(url).toBe(
      "https://agent.test/v3/tools/credentials/cred1/test/supported",
    );
  });

  it("testToolCredential POSTs the test path", async () => {
    const f = vi.fn(async () => okJson({ ok: true }));
    const c = mk(f as unknown as typeof fetch);
    await c.testToolCredential("cred1");
    const [url, init] = f.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://agent.test/v3/tools/credentials/cred1/test");
    expect(init.method).toBe("POST");
  });

  it("getCredentialAgents GETs with optional provider_uuid query param", async () => {
    const f = vi.fn(async () => okJson([]));
    const c = mk(f as unknown as typeof fetch);
    await c.getCredentialAgents("cred1", "prov1");
    const [url] = f.mock.calls[0] as [string];
    expect(url).toBe(
      "https://agent.test/v3/tools/credentials/cred1/agents?provider_uuid=prov1",
    );
  });

  it("getCredentialAgents omits provider_uuid when not given", async () => {
    const f = vi.fn(async () => okJson([]));
    const c = mk(f as unknown as typeof fetch);
    await c.getCredentialAgents("cred1");
    const [url] = f.mock.calls[0] as [string];
    expect(url).toBe("https://agent.test/v3/tools/credentials/cred1/agents");
  });

  it("deleteToolCredential DELETEs the credential path", async () => {
    const f = vi.fn(async () => okJson({}));
    const c = mk(f as unknown as typeof fetch);
    await c.deleteToolCredential("cred1");
    const [url, init] = f.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://agent.test/v3/tools/credentials/cred1");
    expect(init.method).toBe("DELETE");
  });

  it("getConnectedAccounts GETs with the user_id query param", async () => {
    const f = vi.fn(async () => okJson([]));
    const c = mk(f as unknown as typeof fetch);
    await c.getConnectedAccounts("u1");
    const [url] = f.mock.calls[0] as [string];
    expect(url).toBe(
      "https://agent.test/v3/tools/credentials/connected_accounts?user_id=u1",
    );
  });

  it("bulkDeleteToolCredentials POSTs the credential_ids body", async () => {
    const f = vi.fn(async () => okJson({ deleted: 2 }));
    const c = mk(f as unknown as typeof fetch);
    await c.bulkDeleteToolCredentials(["c1", "c2"]);
    const [url, init] = f.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://agent.test/v3/tools/credentials/bulk-delete");
    expect(JSON.parse(init.body as string)).toEqual({
      credential_ids: ["c1", "c2"],
    });
  });

  it("handleComposioWebhook POSTs with header params passed through", async () => {
    const f = vi.fn(async () => okJson({ ok: true }));
    const c = mk(f as unknown as typeof fetch);
    await c.handleComposioWebhook({ "webhook-id": "wh1" });
    const [url, init] = f.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(
      "https://agent.test/v3/tools/webhooks/composio?webhook-id=wh1",
    );
    expect(init.method).toBe("POST");
  });

  it("throws LyzrApiError on a non-2xx response", async () => {
    const f = vi.fn(async () => okJson({ detail: "not found" }, 404));
    const c = mk(f as unknown as typeof fetch);
    await expect(c.deleteMcpServer("missing")).rejects.toBeInstanceOf(
      LyzrApiError,
    );
  });
});
