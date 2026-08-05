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

  // Backend (table_names_endpoint in semantic_model/endpoints.py) wraps the
  // result as {"schemas_and_tables": {schemas, tables}} — a nested object,
  // never a bare list of table name strings. Confirmed by reading
  // get_table_names in semantic_model/manager.py (returns SchemaTablesJSON).
  it("listTables GETs /v3/semantic_model/list_tables/{rag_config_id}/{database_id} and unwraps schemas_and_tables", async () => {
    const f = vi.fn(async () =>
      okJson({
        schemas_and_tables: {
          schemas: {},
          tables: [{ name: "table1", included: true }],
        },
      }),
    );
    const c = mk(f as unknown as typeof fetch, "https://sm.test");
    const result = await c.listTables("rc1", "db1");
    const [url, init] = f.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://sm.test/v3/semantic_model/list_tables/rc1/db1");
    expect(init.method).toBe("GET");
    expect(result).toEqual({
      schemas: {},
      tables: [{ name: "table1", included: true }],
    });
  });

  // Backend (table_preview_endpoint) wraps the result as {"table_preview": [...]}.
  it("getTablePreview GETs /v3/semantic_model/table_preview/{rag_config_id}/{database_id}/{table_name} and unwraps table_preview", async () => {
    const f = vi.fn(async () => okJson({ table_preview: [{ col1: "v1" }] }));
    const c = mk(f as unknown as typeof fetch, "https://sm.test");
    const result = await c.getTablePreview("rc1", "db1", "orders");
    const [url, init] = f.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(
      "https://sm.test/v3/semantic_model/table_preview/rc1/db1/orders",
    );
    expect(init.method).toBe("GET");
    expect(result).toEqual([{ col1: "v1" }]);
  });

  // Backend (get_descriptions_endpoint) wraps the result as {"descriptions": {...}}.
  it("getDescriptions GETs /v3/semantic_model/descriptions/{rag_config_id}/{database_id}/{table_name} and unwraps descriptions", async () => {
    const f = vi.fn(async () =>
      okJson({
        descriptions: {
          table_name: "orders",
          table_description: "d",
          columns: [],
        },
      }),
    );
    const c = mk(f as unknown as typeof fetch, "https://sm.test");
    const result = await c.getDescriptions("rc1", "db1", "orders");
    const [url, init] = f.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(
      "https://sm.test/v3/semantic_model/descriptions/rc1/db1/orders",
    );
    expect(init.method).toBe("GET");
    expect(result).toEqual({
      table_name: "orders",
      table_description: "d",
      columns: [],
    });
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
