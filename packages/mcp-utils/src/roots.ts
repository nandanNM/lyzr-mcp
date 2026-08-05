import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
  type Root,
  RootsListChangedNotificationSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { sendLog } from "./logging.js";

/**
 * Client roots sync — mirrors the reference server. For Lyzr this is
 * informational (we don't read the filesystem), but the seam is kept so the
 * architecture matches and future features can use client roots.
 *
 * Idempotent: requests roots once per session, then serves from cache and
 * refreshes on `roots/list_changed`.
 */
export const roots: Map<string | undefined, Root[]> = new Map();

export const syncRoots = async (
  server: McpServer,
  sessionId?: string,
): Promise<Root[] | undefined> => {
  const clientCapabilities = server.server.getClientCapabilities() || {};
  if (clientCapabilities.roots === undefined) return;

  const requestRoots = async (): Promise<void> => {
    try {
      const response = await server.server.listRoots();
      if (response && "roots" in response) {
        roots.set(sessionId, response.roots);
        await sendLog(
          server,
          "info",
          `Roots updated: ${response.roots?.length ?? 0} root(s) received from client`,
          sessionId,
        );
      }
    } catch (error) {
      console.error(
        `[lyzr-mcp] failed to request roots: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  };

  if (!roots.has(sessionId)) {
    server.server.setNotificationHandler(
      RootsListChangedNotificationSchema,
      requestRoots,
    );
    await requestRoots();
  }

  return roots.get(sessionId);
};
