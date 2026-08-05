/**
 * Lyzr Provider Credentials client (host: agent-prod).
 * Covers the /v3/providers/credentials* endpoints (create/get/update/delete
 * credentials, BigQuery + file-upload credential variants, and credential
 * lookups by user/type).
 */
import { LyzrHttp, LyzrApiError } from "./http.js";

export { LyzrApiError };

export interface CreateProviderCredentialInput {
  name: string;
  provider_id: string;
  type: string;
  credentials: Record<string, unknown>;
  meta_data: Record<string, unknown>;
  scope?: string | null;
}

export interface UpdateProviderCredentialInput {
  name: string;
  type: string;
  credentials: Record<string, unknown>;
  user_id: string;
  meta_data: Record<string, unknown>;
  scope?: string | null;
}

export interface ProviderCredentialResult {
  message: string;
  credential_id: string;
  [key: string]: unknown;
}

/** A file to attach to a multipart credential request. */
export interface CredentialFileInput {
  /** Base64-encoded file content. */
  content: string;
  filename: string;
  contentType?: string;
}

export interface CreateBigQueryCredentialInput {
  /** JSON-encoded string with credential metadata (name, provider_id, etc.), per the API's multipart form field. */
  credential_data: string;
  service_account_json: CredentialFileInput;
}

export interface CreateFileUploadCredentialInput {
  credential_data: string;
  files: CredentialFileInput[];
}

export interface UpdateFileUploadCredentialInput {
  update_data: string;
  files?: CredentialFileInput[];
}

const fileToBlob = (file: CredentialFileInput): Blob => {
  const bytes = Buffer.from(file.content, "base64");
  return new Blob([bytes], { type: file.contentType ?? "application/octet-stream" });
};

export class ProviderCredentialsClient extends LyzrHttp {
  /** Create a provider credential. POST /v3/providers/credentials */
  createCredential(
    input: CreateProviderCredentialInput,
    signal?: AbortSignal,
  ): Promise<ProviderCredentialResult> {
    return this.request<ProviderCredentialResult>(
      "POST",
      "/v3/providers/credentials",
      { body: input, signal },
    );
  }

  /** Create a BigQuery provider credential. POST /v3/providers/credentials/big_query */
  async createBigQueryCredential(
    input: CreateBigQueryCredentialInput,
    signal?: AbortSignal,
  ): Promise<ProviderCredentialResult> {
    const form = new FormData();
    form.append("credential_data", input.credential_data);
    form.append(
      "service_account_json",
      fileToBlob(input.service_account_json),
      input.service_account_json.filename,
    );
    return this.multipartRequest<ProviderCredentialResult>(
      "POST",
      "/v3/providers/credentials/big_query",
      form,
      signal,
    );
  }

  /** Create a file-upload provider credential. POST /v3/providers/credentials/file_upload */
  async createFileUploadCredential(
    input: CreateFileUploadCredentialInput,
    signal?: AbortSignal,
  ): Promise<ProviderCredentialResult> {
    const form = new FormData();
    form.append("credential_data", input.credential_data);
    for (const file of input.files) {
      form.append("files", fileToBlob(file), file.filename);
    }
    return this.multipartRequest<ProviderCredentialResult>(
      "POST",
      "/v3/providers/credentials/file_upload",
      form,
      signal,
    );
  }

  /** Get a provider credential. GET /v3/providers/credentials/{credential_id} */
  getCredential(
    credentialId: string,
    signal?: AbortSignal,
  ): Promise<unknown> {
    return this.request<unknown>(
      "GET",
      `/v3/providers/credentials/${encodeURIComponent(credentialId)}`,
      { signal },
    );
  }

  /** Update a provider credential. PUT /v3/providers/credentials/{credential_id} */
  updateCredential(
    credentialId: string,
    input: UpdateProviderCredentialInput,
    signal?: AbortSignal,
  ): Promise<unknown> {
    return this.request<unknown>(
      "PUT",
      `/v3/providers/credentials/${encodeURIComponent(credentialId)}`,
      { body: { credential_id: credentialId, ...input }, signal },
    );
  }

  /** Delete a provider credential. DELETE /v3/providers/credentials/{credential_id} */
  deleteCredential(
    credentialId: string,
    signal?: AbortSignal,
  ): Promise<unknown> {
    return this.request<unknown>(
      "DELETE",
      `/v3/providers/credentials/${encodeURIComponent(credentialId)}`,
      { signal },
    );
  }

  /** Update a file-upload provider credential. PUT /v3/providers/credentials/file_upload/{credential_id} */
  async updateFileUploadCredential(
    credentialId: string,
    input: UpdateFileUploadCredentialInput,
    signal?: AbortSignal,
  ): Promise<unknown> {
    const form = new FormData();
    form.append("update_data", input.update_data);
    for (const file of input.files ?? []) {
      form.append("files", fileToBlob(file), file.filename);
    }
    return this.multipartRequest<unknown>(
      "PUT",
      `/v3/providers/credentials/file_upload/${encodeURIComponent(credentialId)}`,
      form,
      signal,
    );
  }

  /**
   * List a user's credentials for a provider type + provider id.
   * GET /v3/providers/credentials/user/{provider_type}/{provider_id}
   */
  listCredentialsByUserAndType(
    providerType: string,
    providerId: string,
    signal?: AbortSignal,
  ): Promise<unknown> {
    return this.request<unknown>(
      "GET",
      `/v3/providers/credentials/user/${encodeURIComponent(providerType)}/${encodeURIComponent(providerId)}`,
      { signal },
    );
  }

  /** List all credentials for a provider type. GET /v3/providers/credentials/type/{provider_type} */
  listCredentialsByType(
    providerType: string,
    signal?: AbortSignal,
  ): Promise<unknown> {
    return this.request<unknown>(
      "GET",
      `/v3/providers/credentials/type/${encodeURIComponent(providerType)}`,
      { signal },
    );
  }

  /** Shared multipart/form-data request helper (request() only JSON-encodes). */
  private async multipartRequest<T>(
    method: string,
    path: string,
    form: FormData,
    signal?: AbortSignal,
  ): Promise<T> {
    const res = await this.fetchImpl(this.buildUrl(path), {
      method,
      headers: { "x-api-key": this.apiKey, Accept: "application/json" },
      body: form,
      signal,
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new LyzrApiError(res.status, text);
    }
    const text = await res.text();
    return (text ? JSON.parse(text) : {}) as T;
  }
}
