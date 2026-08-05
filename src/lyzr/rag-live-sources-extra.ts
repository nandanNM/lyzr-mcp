/**
 * Live Sources Extra client — host: rag.
 * Covers Live Sources browse/validate-access, webhooks, and sync-permissions —
 * the non-CRUD half of Live Sources (CRUD lives in rag.ts).
 * Endpoints/shapes confirmed against the OpenAPI schema for the RAG service.
 */
import { LyzrHttp } from "./http.js";

export interface ValidateSiteAccessInput {
  credential_id: string;
  site_urls: string[];
}

export class LiveSourcesExtraClient extends LyzrHttp {
  /** Sync live source permissions. POST /v3/rag/{rag_id}/live-sources/{live_source_id}/sync-permissions/ */
  syncPermissions(
    ragId: string,
    liveSourceId: string,
    signal?: AbortSignal,
  ): Promise<unknown> {
    return this.request<unknown>(
      "POST",
      `/v3/rag/${encodeURIComponent(ragId)}/live-sources/${encodeURIComponent(liveSourceId)}/sync-permissions/`,
      { signal },
    );
  }

  /** Browse SharePoint sites accessible via a credential. GET /v3/rag/live-sources/browse/sites */
  browseSites(credentialId: string, signal?: AbortSignal): Promise<unknown> {
    return this.request<unknown>(
      "GET",
      "/v3/rag/live-sources/browse/sites",
      { params: { credential_id: credentialId }, signal },
    );
  }

  /** Browse drives within a SharePoint site. GET /v3/rag/live-sources/browse/drives */
  browseDrives(
    credentialId: string,
    siteUrl: string,
    signal?: AbortSignal,
  ): Promise<unknown> {
    return this.request<unknown>(
      "GET",
      "/v3/rag/live-sources/browse/drives",
      { params: { credential_id: credentialId, site_url: siteUrl }, signal },
    );
  }

  /** Browse children (files/folders) within a drive. GET /v3/rag/live-sources/browse/children */
  browseChildren(
    credentialId: string,
    siteUrl: string,
    driveName: string,
    folderPath?: string,
    signal?: AbortSignal,
  ): Promise<unknown> {
    return this.request<unknown>(
      "GET",
      "/v3/rag/live-sources/browse/children",
      {
        params: {
          credential_id: credentialId,
          site_url: siteUrl,
          drive_name: driveName,
          folder_path: folderPath,
        },
        signal,
      },
    );
  }

  /** Validate SharePoint site/drive access for a credential. POST /v3/rag/live-sources/browse/validate-access */
  validateAccess(
    input: ValidateSiteAccessInput,
    signal?: AbortSignal,
  ): Promise<unknown> {
    return this.request<unknown>(
      "POST",
      "/v3/rag/live-sources/browse/validate-access",
      { body: input, signal },
    );
  }

  /** Webhook subscription validation handshake. GET /v3/rag/live-sources/webhook/notifications */
  getWebhookNotifications(signal?: AbortSignal): Promise<unknown> {
    return this.request<unknown>(
      "GET",
      "/v3/rag/live-sources/webhook/notifications",
      { signal },
    );
  }

  /** Receive a live source webhook notification. POST /v3/rag/live-sources/webhook/notifications */
  postWebhookNotification(
    payload: unknown,
    signal?: AbortSignal,
  ): Promise<unknown> {
    return this.request<unknown>(
      "POST",
      "/v3/rag/live-sources/webhook/notifications",
      { body: payload, signal },
    );
  }
}
