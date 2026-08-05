import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { LoggingLevel } from "@modelcontextprotocol/sdk/types.js";

/**
 * Logging helpers. Mirrors the reference server's per-session interval bookkeeping
 * so the factory's `cleanup(sessionId)` has something to clear, and centralizes
 * the one call site for `sendLoggingMessage` (which respects the client's level).
 */

// Per-session timers (e.g. future heartbeats). Kept for the cleanup contract.
const intervals: Map<
  string | undefined,
  ReturnType<typeof setInterval>
> = new Map();

/**
 * Send a log message to the client. The SDK drops it if it's below the client's
 * chosen level. No-throw: clients that don't support logging are ignored.
 */
export const sendLog = async (
  server: McpServer,
  level: LoggingLevel,
  data: string,
  sessionId?: string,
): Promise<void> => {
  try {
    await server.server.sendLoggingMessage(
      { level, logger: "lyzr-mcp", data },
      sessionId,
    );
  } catch {
    // Client may not support logging, or isn't initialized yet — ignore.
  }
};

/** Register a per-session interval so it can be cleaned up later. */
export const trackInterval = (
  sessionId: string | undefined,
  interval: ReturnType<typeof setInterval>,
): void => {
  intervals.set(sessionId, interval);
};

/** Clear a session's logging interval. Session id can be undefined for stdio. */
export const stopLogging = (sessionId?: string): void => {
  const interval = intervals.get(sessionId);
  if (interval) {
    clearInterval(interval);
    intervals.delete(sessionId);
  }
};
