/**
 * Lyzr Sessions v3 client (host: agent-prod).
 * Covers /v3/sessions — session lifecycle, messages, and branching/tree.
 * Distinct from the legacy /v1/sessions endpoints in agent-extras.ts.
 */
import { LyzrHttp, LyzrApiError } from "./http.js";

export { LyzrApiError };

export interface SessionCreateInput {
  session_id: string;
  agent_id?: string | null;
  metadata?: Record<string, unknown>;
  source?: "playground" | null;
}

export interface SessionResponse {
  session_id: string;
  user_id: string;
  org_id: string;
  agent_id?: string | null;
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at?: string | null;
  parent_session_id?: string | null;
  branched_from_message_id?: string | null;
  root_session_id?: string | null;
  source?: "playground" | null;
  [key: string]: unknown;
}

export interface SessionListParams {
  agent_id?: string | null;
  source?: "playground" | null;
  limit?: number;
  offset?: number;
}

export interface SessionListResponse {
  sessions: SessionResponse[];
  total: number;
  limit: number;
  offset: number;
  has_more: boolean;
}

export interface SessionUpdateInput {
  metadata: Record<string, unknown>;
}

export interface MessageListParams {
  limit?: number;
  offset?: number;
  role?: string | null;
  after?: string | null;
}

export interface MessageResponse {
  [key: string]: unknown;
}

export interface MessageListResponse {
  messages: MessageResponse[];
  total: number;
  limit: number;
  offset: number;
  has_more: boolean;
}

export interface BranchCreateInput {
  from_message_id: string;
  new_session_id?: string | null;
  branch_name?: string | null;
  metadata?: Record<string, unknown>;
}

export interface BranchListResponse {
  branches: SessionResponse[];
  total: number;
  has_more: boolean;
}

export interface SessionTreeNode {
  [key: string]: unknown;
}

export interface SessionTreeResponse {
  root_session_id: string;
  nodes: SessionTreeNode[];
  truncated: boolean;
}

export interface SessionAncestryResponse {
  ancestry: SessionResponse[];
}

export class SessionsV3Client extends LyzrHttp {
  /** Create a session. POST /v3/sessions */
  createSession(
    input: SessionCreateInput,
    signal?: AbortSignal,
  ): Promise<SessionResponse> {
    return this.request<SessionResponse>("POST", "/v3/sessions", {
      body: input,
      signal,
    });
  }

  /** List sessions. GET /v3/sessions */
  listSessions(
    params: SessionListParams = {},
    signal?: AbortSignal,
  ): Promise<SessionListResponse> {
    return this.request<SessionListResponse>("GET", "/v3/sessions", {
      params: {
        agent_id: params.agent_id,
        source: params.source,
        limit: params.limit,
        offset: params.offset,
      },
      signal,
    });
  }

  /** Get a session. GET /v3/sessions/{session_id} */
  getSession(
    sessionId: string,
    signal?: AbortSignal,
  ): Promise<SessionResponse> {
    return this.request<SessionResponse>(
      "GET",
      `/v3/sessions/${encodeURIComponent(sessionId)}`,
      { signal },
    );
  }

  /** Update a session's metadata. PATCH /v3/sessions/{session_id} */
  updateSession(
    sessionId: string,
    input: SessionUpdateInput,
    signal?: AbortSignal,
  ): Promise<SessionResponse> {
    return this.request<SessionResponse>(
      "PATCH",
      `/v3/sessions/${encodeURIComponent(sessionId)}`,
      { body: input, signal },
    );
  }

  /** Delete a session. DELETE /v3/sessions/{session_id} */
  deleteSession(sessionId: string, signal?: AbortSignal): Promise<unknown> {
    return this.request<unknown>(
      "DELETE",
      `/v3/sessions/${encodeURIComponent(sessionId)}`,
      { signal },
    );
  }

  /** List a session's messages. GET /v3/sessions/{session_id}/messages */
  listMessages(
    sessionId: string,
    params: MessageListParams = {},
    signal?: AbortSignal,
  ): Promise<MessageListResponse> {
    return this.request<MessageListResponse>(
      "GET",
      `/v3/sessions/${encodeURIComponent(sessionId)}/messages`,
      {
        params: {
          limit: params.limit,
          offset: params.offset,
          role: params.role,
          after: params.after,
        },
        signal,
      },
    );
  }

  /** Branch a session from a message. POST /v3/sessions/{session_id}/branch */
  branchSession(
    sessionId: string,
    input: BranchCreateInput,
    signal?: AbortSignal,
  ): Promise<SessionResponse> {
    return this.request<SessionResponse>(
      "POST",
      `/v3/sessions/${encodeURIComponent(sessionId)}/branch`,
      { body: input, signal },
    );
  }

  /** List branches of a session. GET /v3/sessions/{session_id}/branches */
  listBranches(
    sessionId: string,
    signal?: AbortSignal,
  ): Promise<BranchListResponse> {
    return this.request<BranchListResponse>(
      "GET",
      `/v3/sessions/${encodeURIComponent(sessionId)}/branches`,
      { signal },
    );
  }

  /** Get a session's full branch tree. GET /v3/sessions/{session_id}/tree */
  getSessionTree(
    sessionId: string,
    signal?: AbortSignal,
  ): Promise<SessionTreeResponse> {
    return this.request<SessionTreeResponse>(
      "GET",
      `/v3/sessions/${encodeURIComponent(sessionId)}/tree`,
      { signal },
    );
  }

  /** Get a session's ancestry chain. GET /v3/sessions/{session_id}/ancestry */
  getSessionAncestry(
    sessionId: string,
    signal?: AbortSignal,
  ): Promise<SessionAncestryResponse> {
    return this.request<SessionAncestryResponse>(
      "GET",
      `/v3/sessions/${encodeURIComponent(sessionId)}/ancestry`,
      { signal },
    );
  }
}
