import { describe, it, expect, vi } from "vitest";
import { ChannelsClient, LyzrApiError } from "../src/lyzr/channels";

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

describe("ChannelsClient", () => {
  it("channelWebhook POSTs the webhook path with the payload", async () => {
    const f = vi.fn(async () => okJson({ ok: true }));
    const c = mk(
      ChannelsClient,
      f as unknown as typeof fetch,
      "https://agent.test",
    );
    await c.channelWebhook("ch1", { text: "hello" });
    const [url, init] = f.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://agent.test/v3/channels/webhook/ch1");
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body as string)).toEqual({ text: "hello" });
  });

  it("createChannel POSTs /v3/channels/ with the full body", async () => {
    const f = vi.fn(async () =>
      okJson({
        channel_id: "ch1",
        platform: "telegram",
        default_agent_id: "a1",
        agent_routes: [],
        webhook_url: "https://x",
        is_active: true,
        created_at: "2026-01-01T00:00:00Z",
      }),
    );
    const c = mk(
      ChannelsClient,
      f as unknown as typeof fetch,
      "https://agent.test",
    );
    const result = await c.createChannel({
      platform: "telegram",
      default_agent_id: "a1",
      config: { token: "abc" },
    });
    const [url, init] = f.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://agent.test/v3/channels/");
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body as string)).toEqual({
      platform: "telegram",
      default_agent_id: "a1",
      config: { token: "abc" },
    });
    expect(result.channel_id).toBe("ch1");
  });

  it("listChannels GETs /v3/channels/ with agent_id query param", async () => {
    const f = vi.fn(async () => okJson({ channels: [{ channel_id: "ch1" }] }));
    const c = mk(
      ChannelsClient,
      f as unknown as typeof fetch,
      "https://agent.test",
    );
    const result = await c.listChannels("a1");
    const [url, init] = f.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://agent.test/v3/channels/?agent_id=a1");
    expect(init.method).toBe("GET");
    expect(result).toEqual([{ channel_id: "ch1" }]);
  });

  it("listChannels normalizes a bare array response", async () => {
    const f = vi.fn(async () => okJson([{ channel_id: "ch2" }]));
    const c = mk(
      ChannelsClient,
      f as unknown as typeof fetch,
      "https://agent.test",
    );
    const result = await c.listChannels("a1");
    expect(result).toEqual([{ channel_id: "ch2" }]);
  });

  it("listAllChannels GETs /v3/channels/all", async () => {
    const f = vi.fn(async () => okJson([{ channel_id: "ch3" }]));
    const c = mk(
      ChannelsClient,
      f as unknown as typeof fetch,
      "https://agent.test",
    );
    const result = await c.listAllChannels();
    const [url, init] = f.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://agent.test/v3/channels/all");
    expect(init.method).toBe("GET");
    expect(result).toEqual([{ channel_id: "ch3" }]);
  });

  it("deleteChannel DELETEs /v3/channels/{channel_id}", async () => {
    const f = vi.fn(async () => okJson({}));
    const c = mk(
      ChannelsClient,
      f as unknown as typeof fetch,
      "https://agent.test",
    );
    await c.deleteChannel("ch1");
    const [url, init] = f.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://agent.test/v3/channels/ch1");
    expect(init.method).toBe("DELETE");
  });

  it("addAgentRoute POSTs /v3/channels/{channel_id}/agents with body", async () => {
    const f = vi.fn(async () =>
      okJson({
        channel_id: "ch1",
        platform: "telegram",
        default_agent_id: "a1",
        agent_routes: [{ agent_id: "a2", name: "support" }],
        webhook_url: "https://x",
        is_active: true,
        created_at: "2026-01-01T00:00:00Z",
      }),
    );
    const c = mk(
      ChannelsClient,
      f as unknown as typeof fetch,
      "https://agent.test",
    );
    await c.addAgentRoute("ch1", { agent_id: "a2", name: "support" });
    const [url, init] = f.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://agent.test/v3/channels/ch1/agents");
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body as string)).toEqual({
      agent_id: "a2",
      name: "support",
    });
  });

  it("removeAgentRoute DELETEs /v3/channels/{channel_id}/agents/{agent_id}", async () => {
    const f = vi.fn(async () =>
      okJson({
        channel_id: "ch1",
        platform: "telegram",
        default_agent_id: "a1",
        agent_routes: [],
        webhook_url: "https://x",
        is_active: true,
        created_at: "2026-01-01T00:00:00Z",
      }),
    );
    const c = mk(
      ChannelsClient,
      f as unknown as typeof fetch,
      "https://agent.test",
    );
    await c.removeAgentRoute("ch1", "a2");
    const [url, init] = f.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://agent.test/v3/channels/ch1/agents/a2");
    expect(init.method).toBe("DELETE");
  });

  it("throws LyzrApiError on a non-2xx response", async () => {
    const f = vi.fn(async () => okJson({ detail: "not found" }, 404));
    const c = mk(
      ChannelsClient,
      f as unknown as typeof fetch,
      "https://agent.test",
    );
    await expect(c.deleteChannel("missing")).rejects.toBeInstanceOf(
      LyzrApiError,
    );
  });
});
