/**
 * KB Sync Connectors client — host: rag.
 * Endpoints/shapes confirmed against the Lyzr RAG OpenAPI schema.
 */
import { LyzrHttp, normalizeList } from "./http.js";

export interface KbSyncConnectorCreateInput {
  name: string;
  source: string;
  connector_specific_config: Record<string, unknown>;
}

export interface KbSyncConnectorUpdateInput {
  name?: string;
  connector_specific_config?: Record<string, unknown>;
  disabled?: boolean;
}

export interface KbSyncCredentialCreateInput {
  credential_json: Record<string, unknown>;
  scope?: string;
}

export class KbSyncConnectorsClient extends LyzrHttp {
  /** List connectors. GET /v3/kb-sync/connectors/ */
  async listConnectors(signal?: AbortSignal): Promise<unknown[]> {
    const raw = await this.request<unknown>("GET", "/v3/kb-sync/connectors/", {
      signal,
    });
    return normalizeList(raw, "connectors");
  }

  /** Create a connector. POST /v3/kb-sync/connectors/ */
  createConnector(
    input: KbSyncConnectorCreateInput,
    signal?: AbortSignal,
  ): Promise<unknown> {
    return this.request<unknown>("POST", "/v3/kb-sync/connectors/", {
      body: input,
      signal,
    });
  }

  /** Get a connector. GET /v3/kb-sync/connectors/{connector_id}/ */
  getConnector(connectorId: number, signal?: AbortSignal): Promise<unknown> {
    return this.request<unknown>(
      "GET",
      `/v3/kb-sync/connectors/${encodeURIComponent(connectorId)}/`,
      { signal },
    );
  }

  /** Update a connector. PATCH /v3/kb-sync/connectors/{connector_id}/ */
  updateConnector(
    connectorId: number,
    fields: KbSyncConnectorUpdateInput,
    signal?: AbortSignal,
  ): Promise<unknown> {
    return this.request<unknown>(
      "PATCH",
      `/v3/kb-sync/connectors/${encodeURIComponent(connectorId)}/`,
      { body: fields, signal },
    );
  }

  /** Delete a connector. DELETE /v3/kb-sync/connectors/{connector_id}/ */
  deleteConnector(connectorId: number, signal?: AbortSignal): Promise<unknown> {
    return this.request<unknown>(
      "DELETE",
      `/v3/kb-sync/connectors/${encodeURIComponent(connectorId)}/`,
      { signal },
    );
  }

  /** List KB Sync credentials. GET /v3/kb-sync/credentials/ */
  async listKbSyncCredentials(signal?: AbortSignal): Promise<unknown[]> {
    const raw = await this.request<unknown>("GET", "/v3/kb-sync/credentials/", {
      signal,
    });
    return normalizeList(raw, "credentials");
  }

  /** Create a KB Sync credential. POST /v3/kb-sync/credentials/ */
  createKbSyncCredential(
    input: KbSyncCredentialCreateInput,
    signal?: AbortSignal,
  ): Promise<unknown> {
    return this.request<unknown>("POST", "/v3/kb-sync/credentials/", {
      body: input,
      signal,
    });
  }
}
