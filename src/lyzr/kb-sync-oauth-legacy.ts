/**
 * KB Sync legacy OAuth/Browse/Webhooks client — host: rag.
 * Endpoints/shapes confirmed against the lyzr-adk SDK.
 */
import { LyzrHttp } from "./http.js";

export interface ValidateSiteAccessInput {
  credential_id: string;
  site_urls: string[];
}

export class KbSyncLegacyClient extends LyzrHttp {
  // --- OAuth (deprecated) ---

  /** Exchange SharePoint OAuth code. [deprecated] POST /v3/kb-sync/oauth/sharepoint/exchange */
  sharepointOauthExchange(signal?: AbortSignal): Promise<unknown> {
    return this.request<unknown>(
      "POST",
      "/v3/kb-sync/oauth/sharepoint/exchange",
      { signal },
    );
  }

  /** SharePoint OAuth callback. [deprecated] GET /v3/kb-sync/oauth/sharepoint/callback */
  sharepointOauthCallback(signal?: AbortSignal): Promise<unknown> {
    return this.request<unknown>(
      "GET",
      "/v3/kb-sync/oauth/sharepoint/callback",
      { signal },
    );
  }

  /** SharePoint OAuth authorize. [deprecated] GET /v3/kb-sync/oauth/sharepoint/authorize */
  sharepointOauthAuthorize(signal?: AbortSignal): Promise<unknown> {
    return this.request<unknown>(
      "GET",
      "/v3/kb-sync/oauth/sharepoint/authorize",
      { signal },
    );
  }

  // --- Browse (deprecated) ---

  /** Browse SharePoint sites. [deprecated] GET /v3/kb-sync/browse/sites */
  browseSites(credentialId: string, signal?: AbortSignal): Promise<unknown> {
    return this.request<unknown>("GET", "/v3/kb-sync/browse/sites", {
      params: { credential_id: credentialId },
      signal,
    });
  }

  /** Browse SharePoint drives for a site. [deprecated] GET /v3/kb-sync/browse/drives */
  browseDrives(
    credentialId: string,
    siteUrl: string,
    signal?: AbortSignal,
  ): Promise<unknown> {
    return this.request<unknown>("GET", "/v3/kb-sync/browse/drives", {
      params: { credential_id: credentialId, site_url: siteUrl },
      signal,
    });
  }

  /** Browse children (files/folders) of a SharePoint drive path. [deprecated] GET /v3/kb-sync/browse/children */
  browseChildren(
    credentialId: string,
    siteUrl: string,
    driveName: string,
    folderPath?: string,
    signal?: AbortSignal,
  ): Promise<unknown> {
    return this.request<unknown>("GET", "/v3/kb-sync/browse/children", {
      params: {
        credential_id: credentialId,
        site_url: siteUrl,
        drive_name: driveName,
        folder_path: folderPath,
      },
      signal,
    });
  }

  /** Validate access to SharePoint sites/drives. [deprecated] POST /v3/kb-sync/browse/validate-access */
  validateSiteAccess(
    input: ValidateSiteAccessInput,
    signal?: AbortSignal,
  ): Promise<unknown> {
    return this.request<unknown>("POST", "/v3/kb-sync/browse/validate-access", {
      body: input,
      signal,
    });
  }

  // --- Webhooks (deprecated) ---

  /** Webhook validation handshake. [deprecated] GET /v3/kb-sync/webhook/notifications */
  webhookValidation(signal?: AbortSignal): Promise<unknown> {
    return this.request<unknown>("GET", "/v3/kb-sync/webhook/notifications", {
      signal,
    });
  }

  /** Webhook notification receiver. [deprecated] POST /v3/kb-sync/webhook/notifications */
  webhookNotification(
    payload: Record<string, unknown> | undefined,
    signal?: AbortSignal,
  ): Promise<unknown> {
    return this.request<unknown>("POST", "/v3/kb-sync/webhook/notifications", {
      body: payload,
      signal,
    });
  }
}
