/**
 * Lyzr Skills client (host: skills — a standalone service, not agent-prod).
 *
 * Skills are reusable agent-skill packages (must include a SKILL.md), stored
 * in Mongo with their content in GitHub repos and versioned via git tags.
 * agent-prod only proxies the read-only subset (`/v3/skills/shared`,
 * `/v3/skills/{id}/usage`, already wrapped in agent-extras-adjacent
 * human-feedback.ts) — full CRUD lives on this separate host. Confirmed
 * against the actual `lyzr_agent_skills` FastAPI service source
 * (app/models.py, app/routes/skills.py) and the Studio UI's real axios
 * calls (skills.service.ts), not guessed from the OpenAPI spec.
 */
import { LyzrHttp, LyzrApiError, normalizeList } from "./http.js";

export { LyzrApiError };

export interface SkillMetadata {
  skill_id: string;
  name?: string | null;
  description?: string | null;
  repository_name?: string | null;
  repository_full_name?: string | null;
  repository_url?: string | null;
  default_branch?: string | null;
  file_count?: number | null;
  files?: string[] | null;
  created_at?: string | null;
  version?: number | null;
  credential_id?: string | null;
  github_owner?: string | null;
  github_branch?: string | null;
  github_visibility?: string | null;
  /** "zip_upload" | "external_github" */
  source?: string;
  is_global?: boolean;
  external_repo_owner?: string | null;
  external_repo_name?: string | null;
  external_repo_path?: string | null;
  org_id?: string | null;
  /** "private" | "organization" */
  share_type?: string;
  is_owner?: boolean;
  [key: string]: unknown;
}

export interface SkillCreateResult {
  id: string;
  name: string;
  description: string;
  version: number;
  message: string;
}

export interface SkillListParams {
  limit?: number;
  offset?: number;
  search?: string;
  /** "global" | "user" | "org" | "shared" */
  skill_type?: string;
  [key: string]: unknown;
}

export interface SkillListResult {
  items: SkillMetadata[];
  total: number;
}

/** One file to upload: raw bytes + filename. Must include a SKILL.md among the set. */
export interface SkillFileInput {
  data: Buffer | Blob;
  filename: string;
  mimeType?: string;
}

export interface ImportSkillFromGithubInput {
  github_url: string;
  branch?: string;
  credential_id?: string;
}

export interface UpdateSkillMetadataInput {
  name?: string;
  description?: string;
  /** "private" | "organization" */
  share_type?: string;
}

export interface UpdateSkillMetadataResult {
  id: string;
  name?: string | null;
  description?: string | null;
  version?: number | null;
  share_type?: string | null;
  message: string;
}

export interface SkillDeleteResult {
  id: string;
  deleted_records: number;
  message: string;
}

export interface SkillContentResult {
  id: string;
  path: string;
  ref?: string | null;
  is_binary: boolean;
  content?: string | null;
  content_base64?: string | null;
}

export interface SkillVersionCreateResult {
  id: string;
  version: number;
  tag: string;
  commit_sha: string;
  message: string;
}

export interface SkillVersionDeleteResult {
  id: string;
  version: number;
  tag: string;
  deleted_records: number;
  message: string;
}

export class SkillsClient extends LyzrHttp {
  /** Upload a new skill (multipart/form-data, files must include SKILL.md). POST /v1/skills */
  async createSkill(
    files: SkillFileInput[],
    credentialId?: string,
    signal?: AbortSignal,
  ): Promise<SkillCreateResult> {
    if (!files.length) {
      throw new Error("createSkill requires at least one file");
    }
    const form = new FormData();
    for (const f of files) {
      const blob =
        f.data instanceof Blob
          ? f.data
          : new Blob([f.data as unknown as ArrayBuffer], { type: f.mimeType });
      form.append("files", blob, f.filename);
    }
    if (credentialId !== undefined) {
      form.append("credential_id", credentialId);
    }
    const res = await this.fetchImpl(this.buildUrl("/v1/skills"), {
      method: "POST",
      headers: { "x-api-key": this.apiKey, Accept: "application/json" },
      body: form,
      signal,
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new LyzrApiError(res.status, text);
    }
    return res.json() as Promise<SkillCreateResult>;
  }

  /** Import a skill from a public/credentialed GitHub repo. POST /v1/skills/import-github */
  importSkillFromGithub(
    input: ImportSkillFromGithubInput,
    signal?: AbortSignal,
  ): Promise<SkillCreateResult> {
    return this.request<SkillCreateResult>("POST", "/v1/skills/import-github", {
      body: input,
      signal,
    });
  }

  /** Register a GitHub-hosted skill as globally available to all users (admin/master-key only). POST /v1/skills/register-global */
  registerGlobalSkill(
    url: string,
    signal?: AbortSignal,
  ): Promise<SkillCreateResult> {
    return this.request<SkillCreateResult>("POST", "/v1/skills/register-global", {
      body: { url },
      signal,
    });
  }

  /** List skills. GET /v1/skills */
  async listSkills(
    params?: SkillListParams,
    signal?: AbortSignal,
  ): Promise<SkillListResult> {
    const raw = await this.request<unknown>("GET", "/v1/skills", {
      params,
      signal,
    });
    if (Array.isArray(raw)) return { items: raw as SkillMetadata[], total: raw.length };
    const items = normalizeList<SkillMetadata>(raw, "items");
    const total =
      (raw as { total?: number } | undefined)?.total ?? items.length;
    return { items, total };
  }

  /** Batch-fetch metadata for specific skill ids. POST /v1/skills/batch */
  listSkillsByIds(
    skillIds: string[],
    signal?: AbortSignal,
  ): Promise<SkillMetadata[]> {
    return this.request<SkillMetadata[]>("POST", "/v1/skills/batch", {
      body: { skill_ids: skillIds },
      signal,
    });
  }

  /** Get one skill's metadata. GET /v1/skills/{skill_id} */
  getSkill(
    skillId: string,
    version?: number,
    signal?: AbortSignal,
  ): Promise<SkillMetadata> {
    return this.request<SkillMetadata>(
      "GET",
      `/v1/skills/${encodeURIComponent(skillId)}`,
      { params: version !== undefined ? { version } : undefined, signal },
    );
  }

  /** Update a skill's name/description/sharing. PUT /v1/skills/{skill_id} */
  updateSkillMetadata(
    skillId: string,
    updates: UpdateSkillMetadataInput,
    signal?: AbortSignal,
  ): Promise<UpdateSkillMetadataResult> {
    return this.request<UpdateSkillMetadataResult>(
      "PUT",
      `/v1/skills/${encodeURIComponent(skillId)}`,
      { body: updates, signal },
    );
  }

  /** Delete a skill (DB + GitHub). DELETE /v1/skills/{skill_id} */
  deleteSkill(skillId: string, signal?: AbortSignal): Promise<SkillDeleteResult> {
    return this.request<SkillDeleteResult>(
      "DELETE",
      `/v1/skills/${encodeURIComponent(skillId)}`,
      { signal },
    );
  }

  /** Get a file's content from the skill's repo (default SKILL.md). GET /v1/skills/{skill_id}/content */
  getSkillContent(
    skillId: string,
    path = "SKILL.md",
    ref?: string,
    signal?: AbortSignal,
  ): Promise<SkillContentResult> {
    return this.request<SkillContentResult>(
      "GET",
      `/v1/skills/${encodeURIComponent(skillId)}/content`,
      { params: { path, ref }, signal },
    );
  }

  /** Upload a new version (multipart/form-data). POST /v1/skills/{skill_id}/versions */
  async createSkillVersion(
    skillId: string,
    files: SkillFileInput[],
    signal?: AbortSignal,
  ): Promise<SkillVersionCreateResult> {
    if (!files.length) {
      throw new Error("createSkillVersion requires at least one file");
    }
    const form = new FormData();
    for (const f of files) {
      const blob =
        f.data instanceof Blob
          ? f.data
          : new Blob([f.data as unknown as ArrayBuffer], { type: f.mimeType });
      form.append("files", blob, f.filename);
    }
    const res = await this.fetchImpl(
      this.buildUrl(`/v1/skills/${encodeURIComponent(skillId)}/versions`),
      {
        method: "POST",
        headers: { "x-api-key": this.apiKey, Accept: "application/json" },
        body: form,
        signal,
      },
    );
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new LyzrApiError(res.status, text);
    }
    return res.json() as Promise<SkillVersionCreateResult>;
  }

  /** List a skill's versions. GET /v1/skills/{skill_id}/versions */
  async listSkillVersions(
    skillId: string,
    params?: { limit?: number; offset?: number },
    signal?: AbortSignal,
  ): Promise<SkillListResult> {
    const raw = await this.request<unknown>(
      "GET",
      `/v1/skills/${encodeURIComponent(skillId)}/versions`,
      { params, signal },
    );
    const items = normalizeList<SkillMetadata>(raw, "items");
    const total =
      (raw as { total?: number } | undefined)?.total ?? items.length;
    return { items, total };
  }

  /** Delete a specific version. DELETE /v1/skills/{skill_id}/versions/{version} */
  deleteSkillVersion(
    skillId: string,
    version: number,
    signal?: AbortSignal,
  ): Promise<SkillVersionDeleteResult> {
    return this.request<SkillVersionDeleteResult>(
      "DELETE",
      `/v1/skills/${encodeURIComponent(skillId)}/versions/${version}`,
      { signal },
    );
  }
}
