/**
 * Configuration & the per-user API key model.
 *
 * Bring-your-own-key, like the Supabase MCP server: the key is never bundled or
 * shared. Its SOURCE depends on the transport's trust boundary:
 *   - stdio  -> one process per user   -> read from the LYZR_API_KEY env var
 *   - HTTP   -> one process, many users -> read per-session from a request header
 *
 * This module only READS the key; it is never persisted to disk here. The MCP
 * client (Claude Desktop, VS Code, ...) is the secure store.
 */

import { DEFAULT_SERVICE_URLS, type ServiceUrls } from "./lyzr/http.js";
import { parseFeatures, type FeatureGroup } from "./tools/feature-groups.js";

/** Production Lyzr agent API base URL (paths include the /v3 prefix). */
export const DEFAULT_BASE_URL = DEFAULT_SERVICE_URLS.agent;

/**
 * Thrown when no API key can be found. Transports translate this to the right
 * failure surface: stdio exits with a message, HTTP responds 401.
 */
export class MissingApiKeyError extends Error {
  constructor(message = "No Lyzr API key provided.") {
    super(message);
    this.name = "MissingApiKeyError";
  }
}

/** Resolve the Lyzr agent API base URL (env override or production default). */
export const getBaseUrl = (): string =>
  process.env.LYZR_API_BASE_URL?.trim() ||
  process.env.LYZR_AGENT_API?.trim() ||
  DEFAULT_BASE_URL;

/**
 * Resolve every Lyzr service base URL. Each is overridable by its own env var
 * (LYZR_RAG_API, LYZR_MEMORY_API, LYZR_SCHEDULER_API, LYZR_RAI_API); the agent
 * host also honors LYZR_API_BASE_URL for back-compat.
 */
export const getServiceUrls = (): ServiceUrls => ({
  agent: getBaseUrl(),
  rag: process.env.LYZR_RAG_API?.trim() || DEFAULT_SERVICE_URLS.rag,
  memory: process.env.LYZR_MEMORY_API?.trim() || DEFAULT_SERVICE_URLS.memory,
  scheduler:
    process.env.LYZR_SCHEDULER_API?.trim() || DEFAULT_SERVICE_URLS.scheduler,
  rai: process.env.LYZR_RAI_API?.trim() || DEFAULT_SERVICE_URLS.rai,
});

/**
 * Which feature groups to register (see tools/feature-groups.ts), from
 * LYZR_FEATURES (comma-separated). Undefined = all groups (the default).
 * Same seam Supabase's MCP server exposes via --features / SUPABASE_FEATURES.
 */
export const getFeatures = (): FeatureGroup[] | undefined =>
  parseFeatures(process.env.LYZR_FEATURES);

/**
 * Whether to run in read-only mode (LYZR_READ_ONLY=true/1) — tools without
 * `readOnlyHint: true` are registered then disabled. Same seam as Supabase's
 * MCP server's --read-only flag.
 */
export const getReadOnly = (): boolean => {
  const v = process.env.LYZR_READ_ONLY?.trim().toLowerCase();
  return v === "true" || v === "1";
};

/**
 * Read the user's key for the stdio transport from the environment.
 * @throws {MissingApiKeyError} if LYZR_API_KEY is unset/empty.
 */
export const getStdioKey = (): string => {
  const key = process.env.LYZR_API_KEY?.trim();
  if (!key) {
    throw new MissingApiKeyError(
      "LYZR_API_KEY is not set. Add it to your MCP client's `env` config " +
        "(see README). The server never uses a shared key.",
    );
  }
  return key;
};

/** Minimal shape of the headers we read from — decoupled from express. */
export type HeaderBag = Record<string, string | string[] | undefined>;

/**
 * Extract the user's key from an HTTP request's headers for the HTTP transports.
 * Accepts either `x-api-key: <key>` or `Authorization: Bearer <key>`.
 * @throws {MissingApiKeyError} if neither header carries a key.
 */
export const extractHttpKey = (headers: HeaderBag): string => {
  const headerValue = (name: string): string | undefined => {
    const v = headers[name] ?? headers[name.toLowerCase()];
    return Array.isArray(v) ? v[0] : v;
  };

  const apiKeyHeader = headerValue("x-api-key")?.trim();
  if (apiKeyHeader) return apiKeyHeader;

  const auth = headerValue("authorization")?.trim();
  if (auth) {
    const match = /^Bearer\s+(.+)$/i.exec(auth);
    if (match?.[1]) return match[1].trim();
  }

  throw new MissingApiKeyError(
    "Missing API key. Send it as `x-api-key: <key>` or " +
      "`Authorization: Bearer <key>`.",
  );
};
