/**
 * Lyzr Workflows client (host: agent-prod).
 * Endpoints confirmed against the workflows OpenAPI tag.
 */
import { LyzrHttp, LyzrApiError, normalizeList } from "./http.js";

export interface WorkflowCreateInput {
  flow_name: string;
  flow_data?: Record<string, unknown>;
  api_key?: string | null;
  [key: string]: unknown;
}

export interface WorkflowUpdateInput {
  flow_name?: string;
  flow_data?: Record<string, unknown>;
  api_key?: string | null;
  [key: string]: unknown;
}

export interface Workflow {
  flow_id?: string;
  flow_name?: string;
  flow_data?: Record<string, unknown>;
  api_key?: string;
  created_at?: string;
  updated_at?: string;
  [key: string]: unknown;
}

export interface BulkDeleteWorkflowsInput {
  flow_ids: string[];
}

export interface WorkflowShareInput {
  workflow_id: string;
  email_ids: string[];
  org_id: string;
  user_token: string;
}

export interface TriggerWorkflowFileInput {
  /** File contents as a UTF-8 string, or base64-encoded when isBase64 is true. */
  file_content: string;
  file_name: string;
  is_base64?: boolean;
  /** JSON string of additional fields (defaults to "{}" per the API). */
  additional_fields?: string;
}

export class WorkflowsClient extends LyzrHttp {
  /** List workflows. GET /v3/workflows/ */
  async listWorkflows(signal?: AbortSignal): Promise<Workflow[]> {
    const raw = await this.request<unknown>("GET", "/v3/workflows/", {
      signal,
    });
    return normalizeList<Workflow>(raw, "workflows");
  }

  /** Create a workflow. POST /v3/workflows/ */
  createWorkflow(
    input: WorkflowCreateInput,
    signal?: AbortSignal,
  ): Promise<Workflow> {
    return this.request<Workflow>("POST", "/v3/workflows/", {
      body: input,
      signal,
    });
  }

  /** Get one workflow. GET /v3/workflows/{flow_id} */
  getWorkflow(flowId: string, signal?: AbortSignal): Promise<Workflow> {
    return this.request<Workflow>(
      "GET",
      `/v3/workflows/${encodeURIComponent(flowId)}`,
      { signal },
    );
  }

  /** Update a workflow. PUT /v3/workflows/{flow_id} */
  updateWorkflow(
    flowId: string,
    input: WorkflowUpdateInput,
    signal?: AbortSignal,
  ): Promise<Workflow> {
    return this.request<Workflow>(
      "PUT",
      `/v3/workflows/${encodeURIComponent(flowId)}`,
      { body: input, signal },
    );
  }

  /** Delete a workflow. DELETE /v3/workflows/{flow_id} */
  deleteWorkflow(flowId: string, signal?: AbortSignal): Promise<unknown> {
    return this.request<unknown>(
      "DELETE",
      `/v3/workflows/${encodeURIComponent(flowId)}`,
      { signal },
    );
  }

  /** Bulk delete workflows. POST /v3/workflows/bulk-delete */
  bulkDeleteWorkflows(
    input: BulkDeleteWorkflowsInput,
    signal?: AbortSignal,
  ): Promise<unknown> {
    return this.request<unknown>("POST", "/v3/workflows/bulk-delete", {
      body: input,
      signal,
    });
  }

  /** Execute a workflow. POST /v3/workflows/{flow_id}/execute */
  executeWorkflow(
    flowId: string,
    inputData: Record<string, unknown> = {},
    signal?: AbortSignal,
  ): Promise<unknown> {
    return this.request<unknown>(
      "POST",
      `/v3/workflows/${encodeURIComponent(flowId)}/execute`,
      { body: inputData, signal },
    );
  }

  /** Share a workflow. POST /v3/workflows/share */
  shareWorkflow(
    input: WorkflowShareInput,
    signal?: AbortSignal,
  ): Promise<unknown> {
    return this.request<unknown>("POST", "/v3/workflows/share", {
      body: input,
      signal,
    });
  }

  /** Trigger a workflow with a file. POST /v3/workflows/{flow_id}/trigger/file */
  async triggerWorkflowWithFile(
    flowId: string,
    input: TriggerWorkflowFileInput,
    signal?: AbortSignal,
  ): Promise<unknown> {
    const bytes = input.is_base64
      ? Uint8Array.from(Buffer.from(input.file_content, "base64"))
      : new TextEncoder().encode(input.file_content);
    const form = new FormData();
    form.append("file", new Blob([bytes]), input.file_name);
    form.append("additional_fields", input.additional_fields ?? "{}");

    const res = await this.fetchImpl(
      this.buildUrl(
        `/v3/workflows/${encodeURIComponent(flowId)}/trigger/file`,
      ),
      {
        method: "POST",
        headers: {
          "x-api-key": this.apiKey,
          Accept: "application/json",
        },
        body: form,
        signal,
      },
    );
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new LyzrApiError(res.status, text);
    }
    const text = await res.text();
    return text ? JSON.parse(text) : {};
  }
}
