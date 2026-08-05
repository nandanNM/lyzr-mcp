import { describe, it, expect, vi } from "vitest";
import { WorkflowsClient } from "../src/lyzr/workflows";
import { LyzrApiError } from "../src/lyzr/http";

const okJson = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });

const mk = (fetchImpl: typeof fetch, baseUrl = "https://wf.test") =>
  new WorkflowsClient({ apiKey: "k", baseUrl, fetchImpl });

describe("WorkflowsClient", () => {
  it("listWorkflows GETs /v3/workflows/ and normalizes a bare array", async () => {
    const f = vi.fn(async () => okJson([{ flow_id: "f1" }]));
    const wf = mk(f as unknown as typeof fetch);
    const result = await wf.listWorkflows();
    const [url, init] = f.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://wf.test/v3/workflows/");
    expect(init.method).toBe("GET");
    expect(result).toEqual([{ flow_id: "f1" }]);
  });

  it("createWorkflow POSTs /v3/workflows/ with the body", async () => {
    const f = vi.fn(async () =>
      okJson({ flow_id: "f1", flow_name: "my_flow" }),
    );
    const wf = mk(f as unknown as typeof fetch);
    await wf.createWorkflow({ flow_name: "my_flow", flow_data: { a: 1 } });
    const [url, init] = f.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://wf.test/v3/workflows/");
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body as string)).toEqual({
      flow_name: "my_flow",
      flow_data: { a: 1 },
    });
  });

  it("getWorkflow GETs /v3/workflows/{flow_id}", async () => {
    const f = vi.fn(async () => okJson({ flow_id: "f1" }));
    const wf = mk(f as unknown as typeof fetch);
    await wf.getWorkflow("f1");
    const [url, init] = f.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://wf.test/v3/workflows/f1");
    expect(init.method).toBe("GET");
  });

  it("updateWorkflow PUTs /v3/workflows/{flow_id} with the body", async () => {
    const f = vi.fn(async () =>
      okJson({ flow_id: "f1", flow_name: "renamed" }),
    );
    const wf = mk(f as unknown as typeof fetch);
    await wf.updateWorkflow("f1", { flow_name: "renamed" });
    const [url, init] = f.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://wf.test/v3/workflows/f1");
    expect(init.method).toBe("PUT");
    expect(JSON.parse(init.body as string)).toEqual({ flow_name: "renamed" });
  });

  it("deleteWorkflow DELETEs /v3/workflows/{flow_id}", async () => {
    const f = vi.fn(async () => okJson({}));
    const wf = mk(f as unknown as typeof fetch);
    await wf.deleteWorkflow("f1");
    const [url, init] = f.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://wf.test/v3/workflows/f1");
    expect(init.method).toBe("DELETE");
  });

  it("bulkDeleteWorkflows POSTs /v3/workflows/bulk-delete with flow_ids", async () => {
    const f = vi.fn(async () => okJson({}));
    const wf = mk(f as unknown as typeof fetch);
    await wf.bulkDeleteWorkflows({ flow_ids: ["a", "b"] });
    const [url, init] = f.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://wf.test/v3/workflows/bulk-delete");
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body as string)).toEqual({ flow_ids: ["a", "b"] });
  });

  it("executeWorkflow POSTs /v3/workflows/{flow_id}/execute with input data", async () => {
    const f = vi.fn(async () => okJson({ output: "ok" }));
    const wf = mk(f as unknown as typeof fetch);
    await wf.executeWorkflow("f1", { x: 1 });
    const [url, init] = f.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://wf.test/v3/workflows/f1/execute");
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body as string)).toEqual({ x: 1 });
  });

  it("shareWorkflow POSTs /v3/workflows/share with the body", async () => {
    const f = vi.fn(async () => okJson({}));
    const wf = mk(f as unknown as typeof fetch);
    await wf.shareWorkflow({
      workflow_id: "f1",
      email_ids: ["a@b.com"],
      org_id: "org1",
      user_token: "tok",
    });
    const [url, init] = f.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://wf.test/v3/workflows/share");
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body as string)).toEqual({
      workflow_id: "f1",
      email_ids: ["a@b.com"],
      org_id: "org1",
      user_token: "tok",
    });
  });

  it("triggerWorkflowWithFile POSTs multipart form data to /v3/workflows/{flow_id}/trigger/file", async () => {
    const f = vi.fn(async () => okJson({ status: "triggered" }));
    const wf = mk(f as unknown as typeof fetch);
    await wf.triggerWorkflowWithFile("f1", {
      file_content: "hello world",
      file_name: "data.txt",
    });
    const [url, init] = f.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://wf.test/v3/workflows/f1/trigger/file");
    expect(init.method).toBe("POST");
    expect(init.body).toBeInstanceOf(FormData);
    const form = init.body as FormData;
    expect(form.get("additional_fields")).toBe("{}");
    const file = form.get("file") as File;
    expect(file.name).toBe("data.txt");
    expect(await file.text()).toBe("hello world");
  });

  it("throws LyzrApiError on a non-2xx response", async () => {
    const f = vi.fn(async () => okJson({ detail: "bad" }, 422));
    const wf = mk(f as unknown as typeof fetch);
    await expect(wf.getWorkflow("f1")).rejects.toBeInstanceOf(LyzrApiError);
  });
});
