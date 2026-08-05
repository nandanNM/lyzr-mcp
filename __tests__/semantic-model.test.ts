import { describe, it, expect, vi } from "vitest";
import { SemanticModelClient } from "../src/lyzr/semantic-model";
import { LyzrApiError } from "../src/lyzr/http";

const okJson = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });

const mk = (fetchImpl: typeof fetch, baseUrl: string) =>
  new SemanticModelClient({ apiKey: "k", baseUrl, fetchImpl });

describe("SemanticModelClient", () => {
  it("listDocumentationAgents GETs /v3/semantic_model/documentation_agents", async () => {
    const f = vi.fn(async () =>
      okJson({ documentation_agents: [{ id: "a1" }] }),
    );
    const c = mk(f as unknown as typeof fetch, "https://sm.test");
    const result = await c.listDocumentationAgents();
    const [url, init] = f.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://sm.test/v3/semantic_model/documentation_agents");
    expect(init.method).toBe("GET");
    expect(result).toEqual([{ id: "a1" }]);
  });

  it("createDocumentationAgent POSTs /v3/semantic_model/documentation_agents with body", async () => {
    const f = vi.fn(async () => okJson({ id: "a1" }));
    const c = mk(f as unknown as typeof fetch, "https://sm.test");
    await c.createDocumentationAgent({
      name: "doc-agent",
      llm_credential_id: null,
      provider_id: "OpenAI",
      model_id: "gpt-4o-mini",
      top_p: 0.9,
      temperature: 0.7,
    });
    const [url, init] = f.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://sm.test/v3/semantic_model/documentation_agents");
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body as string)).toEqual({
      name: "doc-agent",
      llm_credential_id: null,
      provider_id: "OpenAI",
      model_id: "gpt-4o-mini",
      top_p: 0.9,
      temperature: 0.7,
    });
  });

  it("connectDatabase POSTs /v3/semantic_model/connect_database/{rag_config_id}/{database_id}", async () => {
    const f = vi.fn(async () => okJson({ ok: true }));
    const c = mk(f as unknown as typeof fetch, "https://sm.test");
    await c.connectDatabase("rc1", "db1");
    const [url, init] = f.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(
      "https://sm.test/v3/semantic_model/connect_database/rc1/db1",
    );
    expect(init.method).toBe("POST");
  });

  it("listTables GETs /v3/semantic_model/list_tables/{rag_config_id}/{database_id}", async () => {
    const f = vi.fn(async () => okJson(["table1", "table2"]));
    const c = mk(f as unknown as typeof fetch, "https://sm.test");
    const result = await c.listTables("rc1", "db1");
    const [url, init] = f.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://sm.test/v3/semantic_model/list_tables/rc1/db1");
    expect(init.method).toBe("GET");
    expect(result).toEqual(["table1", "table2"]);
  });

  it("getTablePreview GETs /v3/semantic_model/table_preview/{rag_config_id}/{database_id}/{table_name}", async () => {
    const f = vi.fn(async () => okJson([{ col1: "v1" }]));
    const c = mk(f as unknown as typeof fetch, "https://sm.test");
    await c.getTablePreview("rc1", "db1", "orders");
    const [url, init] = f.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(
      "https://sm.test/v3/semantic_model/table_preview/rc1/db1/orders",
    );
    expect(init.method).toBe("GET");
  });

  it("getDescriptions GETs /v3/semantic_model/descriptions/{rag_config_id}/{database_id}/{table_name}", async () => {
    const f = vi.fn(async () =>
      okJson({ table_name: "orders", table_description: "d", columns: [] }),
    );
    const c = mk(f as unknown as typeof fetch, "https://sm.test");
    await c.getDescriptions("rc1", "db1", "orders");
    const [url, init] = f.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(
      "https://sm.test/v3/semantic_model/descriptions/rc1/db1/orders",
    );
    expect(init.method).toBe("GET");
  });

  it("saveDocumentation POSTs /v3/semantic_model/save_documentation/{rag_config_id}/{table_name} with body", async () => {
    const f = vi.fn(async () => okJson({ ok: true }));
    const c = mk(f as unknown as typeof fetch, "https://sm.test");
    const descriptions = {
      table_name: "orders",
      table_description: "Orders table",
      columns: [{ name: "id", description: "id column", type: "int" }],
    };
    await c.saveDocumentation("rc1", "orders", {
      descriptions,
      table_preview: [{ id: 1 }],
    });
    const [url, init] = f.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(
      "https://sm.test/v3/semantic_model/save_documentation/rc1/orders",
    );
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body as string)).toEqual({
      descriptions,
      table_preview: [{ id: 1 }],
    });
  });

  it("saveDocumentationTask POSTs /v3/semantic_model/save_documentation_task/{rag_config_id}/{table_name}", async () => {
    const f = vi.fn(async () => okJson({ task_id: "t1" }));
    const c = mk(f as unknown as typeof fetch, "https://sm.test");
    const descriptions = {
      table_name: "orders",
      table_description: "Orders table",
      columns: [],
    };
    const result = await c.saveDocumentationTask("rc1", "orders", {
      descriptions,
      table_preview: [],
    });
    const [url, init] = f.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(
      "https://sm.test/v3/semantic_model/save_documentation_task/rc1/orders",
    );
    expect(init.method).toBe("POST");
    expect(result).toEqual({ task_id: "t1" });
  });

  it("removeDocumentation DELETEs /v3/semantic_model/remove_documentation/{rag_config_id}/{table_name}", async () => {
    const f = vi.fn(async () => okJson({ ok: true }));
    const c = mk(f as unknown as typeof fetch, "https://sm.test");
    await c.removeDocumentation("rc1", "orders");
    const [url, init] = f.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(
      "https://sm.test/v3/semantic_model/remove_documentation/rc1/orders",
    );
    expect(init.method).toBe("DELETE");
  });

  it("removeDocumentationTask DELETEs /v3/semantic_model/remove_documentation_task/{rag_config_id}/{table_name}", async () => {
    const f = vi.fn(async () => okJson({ ok: true }));
    const c = mk(f as unknown as typeof fetch, "https://sm.test");
    await c.removeDocumentationTask("rc1", "orders");
    const [url, init] = f.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(
      "https://sm.test/v3/semantic_model/remove_documentation_task/rc1/orders",
    );
    expect(init.method).toBe("DELETE");
  });

  it("getTaskStatus GETs /v3/semantic_model/task/{task_id}", async () => {
    const f = vi.fn(async () => okJson({ status: "SUCCESS" }));
    const c = mk(f as unknown as typeof fetch, "https://sm.test");
    const result = await c.getTaskStatus("t1");
    const [url, init] = f.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://sm.test/v3/semantic_model/task/t1");
    expect(init.method).toBe("GET");
    expect(result).toEqual({ status: "SUCCESS" });
  });

  it("throws LyzrApiError on non-2xx response", async () => {
    const f = vi.fn(async () => okJson({ detail: "not found" }, 404));
    const c = mk(f as unknown as typeof fetch, "https://sm.test");
    await expect(c.getTaskStatus("bad-id")).rejects.toBeInstanceOf(
      LyzrApiError,
    );
  });
});
