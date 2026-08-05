import { describe, it, expect, vi } from "vitest";
import { ToolsV3CoreClient } from "../src/lyzr/tools-v3-core";
import { LyzrApiError } from "../src/lyzr/http";

const okJson = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });

const mk = (fetchImpl: typeof fetch, baseUrl = "https://tools.test") =>
  new ToolsV3CoreClient({ apiKey: "k", baseUrl, fetchImpl });

describe("ToolsV3CoreClient", () => {
  it("listTools GETs /v3/tools/ and normalizes array response", async () => {
    const f = vi.fn(async () => okJson([{ tool_id: "t1" }]));
    const c = mk(f as unknown as typeof fetch);
    const result = await c.listTools();
    const [url, init] = f.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://tools.test/v3/tools/");
    expect(init.method).toBe("GET");
    expect(result).toEqual([{ tool_id: "t1" }]);
  });

  it("listTools normalizes a wrapped {tools: [...]} response", async () => {
    const f = vi.fn(async () => okJson({ tools: [{ tool_id: "t2" }] }));
    const c = mk(f as unknown as typeof fetch);
    const result = await c.listTools();
    expect(result).toEqual([{ tool_id: "t2" }]);
  });

  it("createTool POSTs /v3/tools/ with the body", async () => {
    const f = vi.fn(async () => okJson({ tool_id: "t1" }));
    const c = mk(f as unknown as typeof fetch);
    await c.createTool({
      tool_set_name: "myset",
      openapi_schema: { openapi: "3.0.0" },
      enhance_descriptions: true,
    });
    const [url, init] = f.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://tools.test/v3/tools/");
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body as string)).toEqual({
      tool_set_name: "myset",
      openapi_schema: { openapi: "3.0.0" },
      enhance_descriptions: true,
    });
  });

  it("getTool GETs /v3/tools/{tool_id}", async () => {
    const f = vi.fn(async () => okJson({ tool_id: "t1" }));
    const c = mk(f as unknown as typeof fetch);
    await c.getTool("t1");
    const [url, init] = f.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://tools.test/v3/tools/t1");
    expect(init.method).toBe("GET");
  });

  it("updateTool PUTs /v3/tools/{tool_id} with the update body", async () => {
    const f = vi.fn(async () => okJson({ tool_id: "t1", tool_set_name: "renamed" }));
    const c = mk(f as unknown as typeof fetch);
    await c.updateTool("t1", { tool_set_name: "renamed" });
    const [url, init] = f.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://tools.test/v3/tools/t1");
    expect(init.method).toBe("PUT");
    expect(JSON.parse(init.body as string)).toEqual({
      tool_set_name: "renamed",
    });
  });

  it("deleteTool DELETEs /v3/tools/{tool_id}", async () => {
    const f = vi.fn(async () => okJson({ ok: true }));
    const c = mk(f as unknown as typeof fetch);
    await c.deleteTool("t1");
    const [url, init] = f.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://tools.test/v3/tools/t1");
    expect(init.method).toBe("DELETE");
  });

  it("listAciConfigurations GETs /v3/tools/aci/configurations", async () => {
    const f = vi.fn(async () => okJson([{ app_id: "a1" }]));
    const c = mk(f as unknown as typeof fetch);
    const result = await c.listAciConfigurations();
    const [url, init] = f.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://tools.test/v3/tools/aci/configurations");
    expect(init.method).toBe("GET");
    expect(result).toEqual([{ app_id: "a1" }]);
  });

  it("createAciConfiguration POSTs /v3/tools/aci/configurations with body", async () => {
    const f = vi.fn(async () => okJson({ app_id: "a1" }));
    const c = mk(f as unknown as typeof fetch);
    await c.createAciConfiguration({
      app_id: "a1",
      security_scheme: "oauth2",
    });
    const [url, init] = f.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://tools.test/v3/tools/aci/configurations");
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body as string)).toEqual({
      app_id: "a1",
      security_scheme: "oauth2",
    });
  });

  it("deleteAciConfiguration DELETEs /v3/tools/aci/configurations/{app_id}", async () => {
    const f = vi.fn(async () => okJson({ ok: true }));
    const c = mk(f as unknown as typeof fetch);
    await c.deleteAciConfiguration("a1");
    const [url, init] = f.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://tools.test/v3/tools/aci/configurations/a1");
    expect(init.method).toBe("DELETE");
  });

  it("bulkDeleteTools POSTs /v3/tools/bulk-delete with tool_ids", async () => {
    const f = vi.fn(async () => okJson({ deleted: 2 }));
    const c = mk(f as unknown as typeof fetch);
    await c.bulkDeleteTools(["t1", "t2"]);
    const [url, init] = f.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://tools.test/v3/tools/bulk-delete");
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body as string)).toEqual({
      tool_ids: ["t1", "t2"],
    });
  });

  it("deleteAciConnection DELETEs /v3/tools/aci/connect/{linked_account_id}", async () => {
    const f = vi.fn(async () => okJson({ ok: true }));
    const c = mk(f as unknown as typeof fetch);
    await c.deleteAciConnection("la1");
    const [url, init] = f.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://tools.test/v3/tools/aci/connect/la1");
    expect(init.method).toBe("DELETE");
  });

  it("listAllUserTools GETs /v3/tools/all/user", async () => {
    const f = vi.fn(async () => okJson({ data: [{ tool_id: "t1" }] }));
    const c = mk(f as unknown as typeof fetch);
    const result = await c.listAllUserTools();
    const [url, init] = f.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://tools.test/v3/tools/all/user");
    expect(init.method).toBe("GET");
    expect(result).toEqual([{ tool_id: "t1" }]);
  });

  it("getAgentStaleConnections GETs /v3/tools/agents/{agent_id}/stale-connections with user_id param", async () => {
    const f = vi.fn(async () => okJson({ stale: [] }));
    const c = mk(f as unknown as typeof fetch);
    await c.getAgentStaleConnections("ag1", "u1");
    const [url, init] = f.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(
      "https://tools.test/v3/tools/agents/ag1/stale-connections?user_id=u1",
    );
    expect(init.method).toBe("GET");
  });

  it("throws LyzrApiError on non-2xx response", async () => {
    const f = vi.fn(async () => okJson({ detail: "not found" }, 404));
    const c = mk(f as unknown as typeof fetch);
    await expect(c.getTool("missing")).rejects.toBeInstanceOf(LyzrApiError);
  });
});
