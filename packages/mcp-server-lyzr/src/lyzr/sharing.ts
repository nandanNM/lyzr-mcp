/**
 * Sharing client — access-control groups and shared-resource lookups.
 * Host: agent (paths under /v3/sharing/).
 */
import { LyzrHttp } from "./http.js";

/** Access levels accepted throughout the sharing API. */
export const ACCESS_LEVELS = [
  "public",
  "private",
  "read",
  "write",
  "execute",
  "organisation",
] as const;
export type AccessLevel = (typeof ACCESS_LEVELS)[number];

export interface SharedUser {
  user_id: string;
  email?: string | null;
  access_level?: AccessLevel;
}

export interface GroupCreateInput {
  root_resource_id: string;
  root_resource_type: string;
  /** Default per-user access level (default "private" server-side). To grant org-wide access, set this to "organisation" — there is no separate org-level field. */
  access_level?: AccessLevel;
  shared_with?: SharedUser[];
  agent_ids?: string[] | null;
  superflow_ids?: string[] | null;
}

export interface GroupUpdateInput {
  /** See the note on GroupCreateInput.access_level — use "organisation" here for org-wide access. */
  access_level?: AccessLevel | null;
  shared_with?: SharedUser[] | null;
}

export interface GroupShareInput {
  shared_with: SharedUser[];
}

export interface Group {
  group_id?: string;
  id?: string;
  [key: string]: unknown;
}

export class SharingClient extends LyzrHttp {
  /** Create a sharing group. POST /v3/sharing/groups */
  createGroup(input: GroupCreateInput, signal?: AbortSignal): Promise<Group> {
    return this.request<Group>("POST", "/v3/sharing/groups", {
      body: input,
      signal,
    });
  }

  /** List sharing groups. GET /v3/sharing/groups */
  listGroups(
    params: { page?: number; limit?: number } = {},
    signal?: AbortSignal,
  ): Promise<unknown> {
    return this.request<unknown>("GET", "/v3/sharing/groups", {
      params: { page: params.page, limit: params.limit },
      signal,
    });
  }

  /** Get a sharing group by id. GET /v3/sharing/groups/{group_id} */
  getGroup(groupId: string, signal?: AbortSignal): Promise<Group> {
    return this.request<Group>(
      "GET",
      `/v3/sharing/groups/${encodeURIComponent(groupId)}`,
      { signal },
    );
  }

  /** Update a sharing group. PUT /v3/sharing/groups/{group_id} */
  updateGroup(
    groupId: string,
    input: GroupUpdateInput,
    signal?: AbortSignal,
  ): Promise<Group> {
    return this.request<Group>(
      "PUT",
      `/v3/sharing/groups/${encodeURIComponent(groupId)}`,
      { body: input, signal },
    );
  }

  /** Delete a sharing group. DELETE /v3/sharing/groups/{group_id} */
  deleteGroup(groupId: string, signal?: AbortSignal): Promise<unknown> {
    return this.request<unknown>(
      "DELETE",
      `/v3/sharing/groups/${encodeURIComponent(groupId)}`,
      { signal },
    );
  }

  /** Share a group with users. POST /v3/sharing/groups/{group_id}/share */
  shareGroup(
    groupId: string,
    input: GroupShareInput,
    signal?: AbortSignal,
  ): Promise<unknown> {
    return this.request<unknown>(
      "POST",
      `/v3/sharing/groups/${encodeURIComponent(groupId)}/share`,
      { body: input, signal },
    );
  }

  /** Refresh a group's shared index. POST /v3/sharing/groups/{group_id}/refresh */
  refreshGroup(groupId: string, signal?: AbortSignal): Promise<unknown> {
    return this.request<unknown>(
      "POST",
      `/v3/sharing/groups/${encodeURIComponent(groupId)}/refresh`,
      { signal },
    );
  }

  /**
   * Get the sharing groups a resource belongs to.
   * GET /v3/sharing/resources/{resource_type}/{resource_id}/groups
   */
  getResourceGroups(
    resourceType: string,
    resourceId: string,
    rootTree?: boolean,
    signal?: AbortSignal,
  ): Promise<unknown> {
    return this.request<unknown>(
      "GET",
      `/v3/sharing/resources/${encodeURIComponent(resourceType)}/${encodeURIComponent(resourceId)}/groups`,
      { params: { root_tree: rootTree }, signal },
    );
  }

  /** Reconcile sharing indexes. POST /v3/sharing/indexes/reconcile */
  reconcileIndexes(signal?: AbortSignal): Promise<unknown> {
    return this.request<unknown>("POST", "/v3/sharing/indexes/reconcile", {
      signal,
    });
  }

  /** Check whether a user/org has shared access to a resource. GET /v3/sharing/check */
  checkAccess(
    params: {
      resource_type: string;
      resource_id: string;
      user_id: string;
      org_id: string;
      required_access?: AccessLevel;
    },
    signal?: AbortSignal,
  ): Promise<unknown> {
    return this.request<unknown>("GET", "/v3/sharing/check", {
      params: {
        resource_type: params.resource_type,
        resource_id: params.resource_id,
        user_id: params.user_id,
        org_id: params.org_id,
        required_access: params.required_access,
      },
      signal,
    });
  }

  /** List resources of a type accessible to a user/org. GET /v3/sharing/accessible */
  listAccessible(
    params: { resource_type: string; user_id: string; org_id: string },
    signal?: AbortSignal,
  ): Promise<unknown> {
    return this.request<unknown>("GET", "/v3/sharing/accessible", {
      params: {
        resource_type: params.resource_type,
        user_id: params.user_id,
        org_id: params.org_id,
      },
      signal,
    });
  }
}
