import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
  SubscribeRequestSchema,
  UnsubscribeRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { sendLog } from "../server/logging.js";

/**
 * Resource subscription handling — mirrors the reference server. Clients may
 * subscribe to a resource URI; when the underlying data changes, the server
 * emits `notifications/resources/updated`. Lyzr has no push source yet, so this
 * is a seam: `notifyResourceUpdated` is exported for when one is added.
 */

// subscriber session ids, keyed by resource URI
const subscriptions: Map<string, Set<string | undefined>> = new Map();
// per-session update intervals (for a future polling source); kept for cleanup
const intervals: Map<
  string | undefined,
  ReturnType<typeof setInterval>
> = new Map();

export const setSubscriptionHandlers = (server: McpServer) => {
  server.server.setRequestHandler(
    SubscribeRequestSchema,
    async (request, extra) => {
      const { uri } = request.params;
      const sessionId = extra.sessionId;
      await sendLog(server, "info", `Subscribe to ${uri}`, sessionId);
      const subscribers =
        subscriptions.get(uri) ?? new Set<string | undefined>();
      subscribers.add(sessionId);
      subscriptions.set(uri, subscribers);
      return {};
    },
  );

  server.server.setRequestHandler(
    UnsubscribeRequestSchema,
    async (request, extra) => {
      const { uri } = request.params;
      const sessionId = extra.sessionId;
      await sendLog(server, "info", `Unsubscribe from ${uri}`, sessionId);
      subscriptions.get(uri)?.delete(sessionId);
      return {};
    },
  );
};

/** Notify subscribers that a resource changed. Seam for a real update source. */
export const notifyResourceUpdated = async (
  server: McpServer,
  uri: string,
): Promise<void> => {
  if (subscriptions.get(uri)?.size) {
    await server.server.notification({
      method: "notifications/resources/updated",
      params: { uri },
    });
  }
};

/** Clear a session's resource-update interval. Session id can be undefined. */
export const stopResourceUpdates = (sessionId?: string): void => {
  const interval = intervals.get(sessionId);
  if (interval) {
    clearInterval(interval);
    intervals.delete(sessionId);
  }
};
