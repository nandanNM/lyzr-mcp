/**
 * Feature-group + read-only gating — the same pattern Supabase's MCP server
 * uses (`--features`, `--read-only`) to keep tool exposure scoped per agent
 * and to block destructive calls without needing a second, crippled API key.
 *
 * Every tool in this codebase already declares `readOnlyHint`/`destructiveHint`
 * annotations (see .claude/skills/lyzr-api-endpoint/SKILL.md), so read-only
 * gating is annotation-driven — no per-tool allowlist to maintain.
 */
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

/** Coarse groupings of the tool surface. A user picks a subset via --features / LYZR_FEATURES. */
export const FEATURE_GROUPS = [
  "core", // agent CRUD, chat/stream/task, sessions (v1 + v3)
  "rag", // knowledge base, parse/classify, knowledge graph, file parse/train, live sources
  "kb-sync", // KB Sync connectors/cc-pairs/legacy OAuth
  "memory", // Cognis memory + agent memory providers config
  "scheduler", // cron scheduling
  "rai", // Responsible AI guardrail policies
  "a2a", // agent-to-agent agents
  "inference", // extended inference (tasks, webrtc, voice, /v4 completions)
  "eval", // agent eval + world model (personas/test cases/scenarios/evaluation runs)
  "git", // GitAgent
  "tools", // Tools v3 (registry, ACI, Composio, MCP servers, credentials)
  "workflows", // workflow CRUD/execute/share
  "admin", // audit logs, channels, contexts, platform admin, sharing, providers, org fallbacks, lifecycle-extra
  "content", // artifacts, assets, semantic model, human feedback, skills
  "ops", // ops, reports, traces, usage alerts/widget/user-assets
] as const;

export type FeatureGroup = (typeof FEATURE_GROUPS)[number];

const FEATURE_GROUP_SET: ReadonlySet<string> = new Set(FEATURE_GROUPS);

export const isFeatureGroup = (value: string): value is FeatureGroup =>
  FEATURE_GROUP_SET.has(value);

/**
 * Parse a comma-separated feature-group list (from --features or LYZR_FEATURES).
 * Returns undefined for "enable everything" (the default). Throws on an unknown
 * group name so a typo fails loudly instead of silently registering zero tools.
 */
export const parseFeatures = (
  raw: string | undefined,
): FeatureGroup[] | undefined => {
  const trimmed = raw?.trim();
  if (!trimmed) return undefined;
  const groups = trimmed
    .split(",")
    .map((g) => g.trim())
    .filter(Boolean);
  for (const g of groups) {
    if (!isFeatureGroup(g)) {
      throw new Error(
        `Unknown feature group "${g}". Valid groups: ${FEATURE_GROUPS.join(", ")}`,
      );
    }
  }
  return groups as FeatureGroup[];
};

/**
 * Wrap a McpServer so every `registerTool` call is intercepted: if `readOnly`
 * is set and the tool's own annotations don't mark it `readOnlyHint: true`,
 * the tool is registered and immediately `.disable()`d (hidden from
 * tools/list, calls rejected) rather than skipped — registrars stay
 * unconditional and simple, this is the single gating seam.
 */
export const applyReadOnlyGate = (
  server: McpServer,
  readOnly: boolean,
): McpServer => {
  if (!readOnly) return server;
  return new Proxy(server, {
    get(target, prop, receiver) {
      if (prop === "registerTool") {
        return (...args: unknown[]) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const registered = (target.registerTool as any)(...args);
          const config = args[1] as
            | { annotations?: { readOnlyHint?: boolean } }
            | undefined;
          if (!config?.annotations?.readOnlyHint) {
            registered.disable();
          }
          return registered;
        };
      }
      return Reflect.get(target, prop, receiver);
    },
  }) as McpServer;
};
