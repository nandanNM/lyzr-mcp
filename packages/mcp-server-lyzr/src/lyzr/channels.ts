/**
 * Lyzr Channels client (host: agent-prod).
 * Manages messaging-platform channel configurations (e.g. Telegram, Slack)
 * that route inbound messages to Lyzr agents.
 */
import { LyzrHttp, LyzrApiError, normalizeList } from "./http.js";

export { LyzrApiError };

/** A named agent accessible through a channel bot. */
export interface AgentRoute {
  agent_id: string;
  name: string;
  [key: string]: unknown;
}

/** Request body for creating a channel configuration. */
export interface ChannelCreateInput {
  platform: string;
  default_agent_id: string;
  agent_routes?: AgentRoute[];
  config: Record<string, unknown>;
}

/** A channel configuration as returned by the API. */
export interface ChannelResponse {
  channel_id: string;
  platform: string;
  default_agent_id: string;
  agent_routes: AgentRoute[];
  webhook_url: string;
  is_active: boolean;
  created_at: string;
  [key: string]: unknown;
}

/** Request body for adding a new agent route to an existing channel. */
export interface AddAgentRouteInput {
  agent_id: string;
  name: string;
}

export class ChannelsClient extends LyzrHttp {
  /** Handle an inbound platform webhook. POST /v3/channels/webhook/{channel_id} */
  channelWebhook(
    channelId: string,
    payload: Record<string, unknown>,
    signal?: AbortSignal,
  ): Promise<Record<string, unknown>> {
    return this.request<Record<string, unknown>>(
      "POST",
      `/v3/channels/webhook/${encodeURIComponent(channelId)}`,
      { body: payload, signal },
    );
  }

  /** Create a channel. POST /v3/channels/ */
  createChannel(
    input: ChannelCreateInput,
    signal?: AbortSignal,
  ): Promise<ChannelResponse> {
    return this.request<ChannelResponse>("POST", "/v3/channels/", {
      body: input,
      signal,
    });
  }

  /** List channels for an agent. GET /v3/channels/ */
  async listChannels(
    agentId: string,
    signal?: AbortSignal,
  ): Promise<ChannelResponse[]> {
    const raw = await this.request<unknown>("GET", "/v3/channels/", {
      params: { agent_id: agentId },
      signal,
    });
    return normalizeList<ChannelResponse>(raw, "channels");
  }

  /** List all channels. GET /v3/channels/all */
  async listAllChannels(signal?: AbortSignal): Promise<ChannelResponse[]> {
    const raw = await this.request<unknown>("GET", "/v3/channels/all", {
      signal,
    });
    return normalizeList<ChannelResponse>(raw, "channels");
  }

  /** Delete a channel. DELETE /v3/channels/{channel_id} */
  deleteChannel(channelId: string, signal?: AbortSignal): Promise<unknown> {
    return this.request<unknown>(
      "DELETE",
      `/v3/channels/${encodeURIComponent(channelId)}`,
      { signal },
    );
  }

  /** Add an agent route to a channel. POST /v3/channels/{channel_id}/agents */
  addAgentRoute(
    channelId: string,
    input: AddAgentRouteInput,
    signal?: AbortSignal,
  ): Promise<ChannelResponse> {
    return this.request<ChannelResponse>(
      "POST",
      `/v3/channels/${encodeURIComponent(channelId)}/agents`,
      { body: input, signal },
    );
  }

  /** Remove an agent route from a channel. DELETE /v3/channels/{channel_id}/agents/{agent_id} */
  removeAgentRoute(
    channelId: string,
    agentId: string,
    signal?: AbortSignal,
  ): Promise<ChannelResponse> {
    return this.request<ChannelResponse>(
      "DELETE",
      `/v3/channels/${encodeURIComponent(channelId)}/agents/${encodeURIComponent(agentId)}`,
      { signal },
    );
  }
}
