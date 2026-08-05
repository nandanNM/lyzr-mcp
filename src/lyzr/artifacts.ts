/**
 * Lyzr Artifacts client (host: agent-prod).
 * Endpoints/shapes confirmed against the Artifacts v3 OpenAPI tag.
 */
import { LyzrHttp, LyzrApiError, normalizeList } from "./http.js";

export { LyzrApiError };

export interface ArtifactCreateInput {
  user_id: string;
  session_id: string;
  data: unknown;
  format_type?: string;
  name?: string;
  description?: string;
  metadata?: Record<string, unknown> | null;
}

export interface ArtifactUpdateInput {
  data?: unknown;
  format_type?: string;
  name?: string;
  description?: string;
  metadata?: Record<string, unknown> | null;
}

export interface Artifact {
  artifact_id?: string;
  id?: string;
  user_id?: string;
  session_id?: string;
  data?: unknown;
  format_type?: string;
  name?: string;
  description?: string;
  metadata?: Record<string, unknown> | null;
  [key: string]: unknown;
}

export interface ArtifactListParams {
  page?: number;
  limit?: number;
  user_id?: string;
  session_id?: string;
  format_type?: string;
}

export interface ArtifactListResult {
  artifacts: Artifact[];
  total: number;
  page: number;
  limit: number;
}

export class ArtifactsClient extends LyzrHttp {
  /** Create an artifact. POST /v3/artifacts/ */
  createArtifact(
    input: ArtifactCreateInput,
    signal?: AbortSignal,
  ): Promise<Artifact> {
    return this.request<Artifact>("POST", "/v3/artifacts/", {
      body: input,
      signal,
    });
  }

  /** List artifacts (paginated, optionally filtered). GET /v3/artifacts/ */
  async listArtifacts(
    params: ArtifactListParams = {},
    signal?: AbortSignal,
  ): Promise<ArtifactListResult> {
    const raw = await this.request<unknown>("GET", "/v3/artifacts/", {
      params: {
        page: params.page,
        limit: params.limit,
        user_id: params.user_id,
        session_id: params.session_id,
        format_type: params.format_type,
      },
      signal,
    });
    const obj = (raw as Record<string, unknown>) ?? {};
    return {
      artifacts: normalizeList<Artifact>(raw, "artifacts"),
      total: typeof obj.total === "number" ? obj.total : 0,
      page: typeof obj.page === "number" ? obj.page : (params.page ?? 1),
      limit: typeof obj.limit === "number" ? obj.limit : (params.limit ?? 10),
    };
  }

  /** Get one artifact. GET /v3/artifacts/{artifact_id} */
  getArtifact(
    artifactId: string,
    userId: string,
    sessionId: string,
    signal?: AbortSignal,
  ): Promise<{ artifact: Artifact }> {
    return this.request<{ artifact: Artifact }>(
      "GET",
      `/v3/artifacts/${encodeURIComponent(artifactId)}`,
      { params: { user_id: userId, session_id: sessionId }, signal },
    );
  }

  /** Update an artifact. PUT /v3/artifacts/{artifact_id} */
  updateArtifact(
    artifactId: string,
    userId: string,
    sessionId: string,
    updates: ArtifactUpdateInput,
    signal?: AbortSignal,
  ): Promise<{ artifact: Artifact }> {
    return this.request<{ artifact: Artifact }>(
      "PUT",
      `/v3/artifacts/${encodeURIComponent(artifactId)}`,
      {
        params: { user_id: userId, session_id: sessionId },
        body: updates,
        signal,
      },
    );
  }

  /** Delete an artifact. DELETE /v3/artifacts/{artifact_id} */
  deleteArtifact(
    artifactId: string,
    userId: string,
    sessionId: string,
    signal?: AbortSignal,
  ): Promise<unknown> {
    return this.request<unknown>(
      "DELETE",
      `/v3/artifacts/${encodeURIComponent(artifactId)}`,
      { params: { user_id: userId, session_id: sessionId }, signal },
    );
  }

  /** List artifacts for a user's session (paginated). GET /v3/artifacts/user/{user_id}/session/{session_id} */
  async listArtifactsByUserSession(
    userId: string,
    sessionId: string,
    page?: number,
    limit?: number,
    signal?: AbortSignal,
  ): Promise<ArtifactListResult> {
    const raw = await this.request<unknown>(
      "GET",
      `/v3/artifacts/user/${encodeURIComponent(userId)}/session/${encodeURIComponent(sessionId)}`,
      { params: { page, limit }, signal },
    );
    const obj = (raw as Record<string, unknown>) ?? {};
    return {
      artifacts: normalizeList<Artifact>(raw, "artifacts"),
      total: typeof obj.total === "number" ? obj.total : 0,
      page: typeof obj.page === "number" ? obj.page : (page ?? 1),
      limit: typeof obj.limit === "number" ? obj.limit : (limit ?? 10),
    };
  }
}
