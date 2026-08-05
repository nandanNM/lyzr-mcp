/**
 * Semantic Model v3 client (host: rag-prod).
 * Endpoints/shapes confirmed against the OpenAPI schema for tag "Semantic Model v3".
 */
import { LyzrHttp, normalizeList } from "./http.js";

export interface DocumentationAgent {
  id?: string;
  name?: string;
  provider_id?: string;
  model_id?: string;
  [key: string]: unknown;
}

export interface CreateDocumentationAgentInput {
  name: string;
  llm_credential_id?: string | null;
  provider_id: string;
  model_id: string;
  top_p: number;
  temperature: number;
}

export interface ColumnDescription {
  name: string;
  description: string;
  type: string;
  [key: string]: unknown;
}

export interface TableColumnDescriptions {
  table_name: string;
  table_description: string;
  columns: ColumnDescription[];
  [key: string]: unknown;
}

export interface SaveDocumentationInput {
  descriptions: TableColumnDescriptions;
  table_preview: Record<string, unknown>[];
}

export interface SemanticModelTaskResult {
  task_id?: string;
  status?: string;
  [key: string]: unknown;
}

/** A single table entry within a schema, as returned by list_tables. */
export interface TableInclusion {
  name: string;
  included: boolean;
  [key: string]: unknown;
}

/**
 * Shape of GET /v3/semantic_model/list_tables/{rag_config_id}/{database_id},
 * unwrapped from the backend's `{"schemas_and_tables": {...}}` envelope
 * (see table_names_endpoint in semantic_model/endpoints.py, which returns
 * `SchemaTablesJSON.model_dump()` — an object with `schemas`/`tables` keys,
 * NOT a bare list of table name strings).
 */
export interface SchemaTablesResult {
  schemas?: Record<string, TableInclusion[]>;
  tables?: TableInclusion[];
  [key: string]: unknown;
}

export class SemanticModelClient extends LyzrHttp {
  /** List documentation agents. GET /v3/semantic_model/documentation_agents */
  async listDocumentationAgents(
    signal?: AbortSignal,
  ): Promise<DocumentationAgent[]> {
    const raw = await this.request<unknown>(
      "GET",
      "/v3/semantic_model/documentation_agents",
      { signal },
    );
    return normalizeList<DocumentationAgent>(raw, "documentation_agents");
  }

  /** Create a documentation agent. POST /v3/semantic_model/documentation_agents */
  createDocumentationAgent(
    input: CreateDocumentationAgentInput,
    signal?: AbortSignal,
  ): Promise<DocumentationAgent> {
    return this.request<DocumentationAgent>(
      "POST",
      "/v3/semantic_model/documentation_agents",
      { body: input, signal },
    );
  }

  /** Connect a database to a RAG config. POST /v3/semantic_model/connect_database/{rag_config_id}/{database_id} */
  connectDatabase(
    ragConfigId: string,
    databaseId: string,
    signal?: AbortSignal,
  ): Promise<unknown> {
    return this.request<unknown>(
      "POST",
      `/v3/semantic_model/connect_database/${encodeURIComponent(ragConfigId)}/${encodeURIComponent(databaseId)}`,
      { signal },
    );
  }

  /**
   * List table names/schemas for a connected database.
   * GET /v3/semantic_model/list_tables/{rag_config_id}/{database_id}
   * The backend wraps the result as `{"schemas_and_tables": {...}}`
   * (table_names_endpoint in semantic_model/endpoints.py) — unwrap it here.
   */
  async listTables(
    ragConfigId: string,
    databaseId: string,
    signal?: AbortSignal,
  ): Promise<SchemaTablesResult> {
    const raw = await this.request<{ schemas_and_tables?: SchemaTablesResult }>(
      "GET",
      `/v3/semantic_model/list_tables/${encodeURIComponent(ragConfigId)}/${encodeURIComponent(databaseId)}`,
      { signal },
    );
    return raw?.schemas_and_tables ?? (raw as unknown as SchemaTablesResult);
  }

  /**
   * Preview a table's rows.
   * GET /v3/semantic_model/table_preview/{rag_config_id}/{database_id}/{table_name}
   * The backend wraps the result as `{"table_preview": [...]}`
   * (table_preview_endpoint) — unwrap it here.
   */
  async getTablePreview(
    ragConfigId: string,
    databaseId: string,
    tableName: string,
    signal?: AbortSignal,
  ): Promise<Record<string, unknown>[]> {
    const raw = await this.request<{
      table_preview?: Record<string, unknown>[];
    }>(
      "GET",
      `/v3/semantic_model/table_preview/${encodeURIComponent(ragConfigId)}/${encodeURIComponent(databaseId)}/${encodeURIComponent(tableName)}`,
      { signal },
    );
    return normalizeList<Record<string, unknown>>(raw, "table_preview");
  }

  /**
   * Get saved table/column descriptions.
   * GET /v3/semantic_model/descriptions/{rag_config_id}/{database_id}/{table_name}
   * The backend wraps the result as `{"descriptions": {...}}`
   * (get_descriptions_endpoint) — unwrap it here.
   */
  async getDescriptions(
    ragConfigId: string,
    databaseId: string,
    tableName: string,
    signal?: AbortSignal,
  ): Promise<TableColumnDescriptions> {
    const raw = await this.request<{
      descriptions?: TableColumnDescriptions;
    }>(
      "GET",
      `/v3/semantic_model/descriptions/${encodeURIComponent(ragConfigId)}/${encodeURIComponent(databaseId)}/${encodeURIComponent(tableName)}`,
      { signal },
    );
    return (raw?.descriptions ?? raw) as TableColumnDescriptions;
  }

  /** Save table documentation synchronously. POST /v3/semantic_model/save_documentation/{rag_config_id}/{table_name} */
  saveDocumentation(
    ragConfigId: string,
    tableName: string,
    input: SaveDocumentationInput,
    signal?: AbortSignal,
  ): Promise<unknown> {
    return this.request<unknown>(
      "POST",
      `/v3/semantic_model/save_documentation/${encodeURIComponent(ragConfigId)}/${encodeURIComponent(tableName)}`,
      { body: input, signal },
    );
  }

  /** Save table documentation as a background task. POST /v3/semantic_model/save_documentation_task/{rag_config_id}/{table_name} */
  saveDocumentationTask(
    ragConfigId: string,
    tableName: string,
    input: SaveDocumentationInput,
    signal?: AbortSignal,
  ): Promise<SemanticModelTaskResult> {
    return this.request<SemanticModelTaskResult>(
      "POST",
      `/v3/semantic_model/save_documentation_task/${encodeURIComponent(ragConfigId)}/${encodeURIComponent(tableName)}`,
      { body: input, signal },
    );
  }

  /** Remove saved table documentation. DELETE /v3/semantic_model/remove_documentation/{rag_config_id}/{table_name} */
  removeDocumentation(
    ragConfigId: string,
    tableName: string,
    signal?: AbortSignal,
  ): Promise<unknown> {
    return this.request<unknown>(
      "DELETE",
      `/v3/semantic_model/remove_documentation/${encodeURIComponent(ragConfigId)}/${encodeURIComponent(tableName)}`,
      { signal },
    );
  }

  /** Remove a background documentation-save task. DELETE /v3/semantic_model/remove_documentation_task/{rag_config_id}/{table_name} */
  removeDocumentationTask(
    ragConfigId: string,
    tableName: string,
    signal?: AbortSignal,
  ): Promise<unknown> {
    return this.request<unknown>(
      "DELETE",
      `/v3/semantic_model/remove_documentation_task/${encodeURIComponent(ragConfigId)}/${encodeURIComponent(tableName)}`,
      { signal },
    );
  }

  /** Get the status of a semantic-model background task. GET /v3/semantic_model/task/{task_id} */
  getTaskStatus(
    taskId: string,
    signal?: AbortSignal,
  ): Promise<SemanticModelTaskResult> {
    return this.request<SemanticModelTaskResult>(
      "GET",
      `/v3/semantic_model/task/${encodeURIComponent(taskId)}`,
      { signal },
    );
  }
}
