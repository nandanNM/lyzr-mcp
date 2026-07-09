/**
 * Cognis memory client (the "knowledge graph") — host: memory.studio.
 * Endpoints/shapes confirmed against the lyzr-adk SDK.
 */
import { LyzrHttp } from "./http.js";

export interface MemoryMessage {
  role: string;
  content: string;
}

/** At least one of owner_id / agent_id / session_id is required by the API. */
export interface MemoryIds {
  owner_id?: string;
  agent_id?: string;
  session_id?: string;
}

const idBody = (ids: MemoryIds): Record<string, unknown> => {
  const body: Record<string, unknown> = {};
  if (ids.owner_id !== undefined) body.owner_id = ids.owner_id;
  if (ids.agent_id !== undefined) body.agent_id = ids.agent_id;
  if (ids.session_id !== undefined) body.session_id = ids.session_id;
  return body;
};

const requireId = (ids: MemoryIds): void => {
  if (!ids.owner_id && !ids.agent_id && !ids.session_id) {
    throw new Error(
      "At least one of owner_id, agent_id, or session_id must be provided.",
    );
  }
};

export class MemoryClient extends LyzrHttp {
  /** Add messages to memory. POST /v1/memories */
  add(
    messages: MemoryMessage[],
    ids: MemoryIds,
    signal?: AbortSignal,
  ): Promise<unknown> {
    requireId(ids);
    return this.request<unknown>("POST", "/v1/memories", {
      body: { ...idBody(ids), messages },
      signal,
    });
  }

  /** Semantic search. POST /v1/memories/search */
  search(
    query: string,
    ids: MemoryIds,
    opts: { limit?: number; cross_session?: boolean } = {},
    signal?: AbortSignal,
  ): Promise<unknown> {
    requireId(ids);
    const body: Record<string, unknown> = { ...idBody(ids), query };
    if (opts.limit !== undefined) body.limit = opts.limit;
    if (opts.cross_session !== undefined)
      body.cross_session = opts.cross_session;
    return this.request<unknown>("POST", "/v1/memories/search", {
      body,
      signal,
    });
  }

  /** List memories. GET /v1/memories */
  list(
    ids: MemoryIds,
    opts: {
      limit?: number;
      offset?: number;
      cross_session?: boolean;
      include_historical?: boolean;
    } = {},
    signal?: AbortSignal,
  ): Promise<unknown> {
    requireId(ids);
    return this.request<unknown>("GET", "/v1/memories", {
      params: { ...idBody(ids), ...opts },
      signal,
    });
  }

  /** Get one memory. GET /v1/memories/{memory_id} */
  getMemory(
    memoryId: string,
    ownerId?: string,
    signal?: AbortSignal,
  ): Promise<unknown> {
    return this.request<unknown>(
      "GET",
      `/v1/memories/${encodeURIComponent(memoryId)}`,
      { params: { owner_id: ownerId }, signal },
    );
  }

  /** Update a memory. PATCH /v1/memories/{memory_id} */
  update(
    memoryId: string,
    fields: {
      content?: string;
      metadata?: Record<string, unknown>;
      owner_id?: string;
    },
    signal?: AbortSignal,
  ): Promise<unknown> {
    const body: Record<string, unknown> = {};
    if (fields.content !== undefined) body.content = fields.content;
    if (fields.metadata !== undefined) body.metadata = fields.metadata;
    if (fields.owner_id !== undefined) body.owner_id = fields.owner_id;
    return this.request<unknown>(
      "PATCH",
      `/v1/memories/${encodeURIComponent(memoryId)}`,
      { body, signal },
    );
  }

  /** Delete a memory. DELETE /v1/memories/{memory_id} */
  delete(
    memoryId: string,
    ownerId?: string,
    signal?: AbortSignal,
  ): Promise<unknown> {
    return this.request<unknown>(
      "DELETE",
      `/v1/memories/${encodeURIComponent(memoryId)}`,
      { params: { owner_id: ownerId }, signal },
    );
  }
}
