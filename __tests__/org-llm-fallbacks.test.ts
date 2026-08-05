import { describe, it, expect, vi } from "vitest";
import { OrgLlmFallbacksClient } from "../src/lyzr/org-llm-fallbacks";
import { LyzrApiError } from "../src/lyzr/http";

const okJson = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });

const mk = <T>(
  Cls: new (cfg: any) => T,
  fetchImpl: typeof fetch,
  baseUrl: string,
) => new Cls({ apiKey: "k", baseUrl, fetchImpl });

describe("OrgLlmFallbacksClient", () => {
  it("getLlmFallbacks GETs /v3/org/llm-fallbacks", async () => {
    const f = vi.fn(async () => okJson({ fallbacks: [] }));
    const client = mk(
      OrgLlmFallbacksClient,
      f as unknown as typeof fetch,
      "https://agent.test",
    );
    const result = await client.getLlmFallbacks();
    const [url, init] = f.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://agent.test/v3/org/llm-fallbacks");
    expect(init.method).toBe("GET");
    expect(result).toEqual({ fallbacks: [] });
  });

  it("updateLlmFallbacks PUTs /v3/org/llm-fallbacks with the fallbacks body", async () => {
    const f = vi.fn(async () => okJson({ fallbacks: [{ priority: 1 }] }));
    const client = mk(
      OrgLlmFallbacksClient,
      f as unknown as typeof fetch,
      "https://agent.test",
    );
    const input = {
      fallbacks: [
        {
          priority: 1,
          provider_id: "OpenAI",
          model: "gpt-4o-mini",
          credential_id: "lyzr_openai",
        },
      ],
    };
    await client.updateLlmFallbacks(input);
    const [url, init] = f.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://agent.test/v3/org/llm-fallbacks");
    expect(init.method).toBe("PUT");
    const body = JSON.parse(init.body as string);
    expect(body).toEqual(input);
  });

  it("throws LyzrApiError on a non-2xx response", async () => {
    const f = vi.fn(async () => okJson({ detail: "nope" }, 422));
    const client = mk(
      OrgLlmFallbacksClient,
      f as unknown as typeof fetch,
      "https://agent.test",
    );
    await expect(client.getLlmFallbacks()).rejects.toBeInstanceOf(LyzrApiError);
  });
});
