import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { KbSyncCcPairsClient } from "../lyzr/kb-sync-cc-pairs.js";

const txt = (data: unknown) => ({
  content: [
    {
      type: "text" as const,
      text: typeof data === "string" ? data : JSON.stringify(data, null, 2),
    },
  ],
});

/** Register the KB Sync connector-credential pair tools. */
export const registerKbSyncCcPairsTools = (
  server: McpServer,
  client: KbSyncCcPairsClient,
) => {
  server.registerTool(
    "lyzr_kb_sync_cc_pairs_list",
    {
      title: "List KB Sync Connector-Credential Pairs",
      description: "List all connector-credential pairs.",
      inputSchema: {},
      annotations: {
        readOnlyHint: true,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async (_args, extra) => txt(await client.listCcPairs(extra.signal)),
  );

  server.registerTool(
    "lyzr_kb_sync_cc_pairs_create",
    {
      title: "Create KB Sync Connector-Credential Pair",
      description:
        "Create a connector-credential pair, linking a connector to a credential (and optionally a knowledge base).",
      inputSchema: {
        connector_id: z.number().int().describe("The connector id to link"),
        credential_id: z.string().describe("The credential id to link"),
        name: z
          .string()
          .optional()
          .describe("Optional display name for the pair"),
        rag_id: z
          .string()
          .optional()
          .describe("Optional knowledge base (rag) id to sync into"),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async ({ connector_id, credential_id, name, rag_id }, extra) =>
      txt(
        await client.createCcPair(
          { connector_id, credential_id, name, rag_id },
          extra.signal,
        ),
      ),
  );

  server.registerTool(
    "lyzr_kb_sync_cc_pairs_get",
    {
      title: "Get KB Sync Connector-Credential Pair",
      description: "Fetch a connector-credential pair by id.",
      inputSchema: {
        cc_pair_id: z
          .number()
          .int()
          .describe("The connector-credential pair id"),
      },
      annotations: {
        readOnlyHint: true,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ cc_pair_id }, extra) =>
      txt(await client.getCcPair(cc_pair_id, extra.signal)),
  );

  server.registerTool(
    "lyzr_kb_sync_cc_pairs_pause",
    {
      title: "Pause KB Sync Connector-Credential Pair",
      description: "Pause syncing for a connector-credential pair.",
      inputSchema: {
        cc_pair_id: z
          .number()
          .int()
          .describe("The connector-credential pair id"),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ cc_pair_id }, extra) =>
      txt(await client.pauseCcPair(cc_pair_id, extra.signal)),
  );

  server.registerTool(
    "lyzr_kb_sync_cc_pairs_resume",
    {
      title: "Resume KB Sync Connector-Credential Pair",
      description: "Resume syncing for a connector-credential pair.",
      inputSchema: {
        cc_pair_id: z
          .number()
          .int()
          .describe("The connector-credential pair id"),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ cc_pair_id }, extra) =>
      txt(await client.resumeCcPair(cc_pair_id, extra.signal)),
  );

  server.registerTool(
    "lyzr_kb_sync_cc_pairs_sync",
    {
      title: "Trigger KB Sync",
      description: "Trigger a sync run for a connector-credential pair.",
      inputSchema: {
        cc_pair_id: z
          .number()
          .int()
          .describe("The connector-credential pair id"),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async ({ cc_pair_id }, extra) =>
      txt(await client.triggerSync(cc_pair_id, extra.signal)),
  );

  server.registerTool(
    "lyzr_kb_sync_cc_pairs_status",
    {
      title: "Get KB Sync Status",
      description:
        "Get the current sync status for a connector-credential pair, including its active and last completed index attempts.",
      inputSchema: {
        cc_pair_id: z
          .number()
          .int()
          .describe("The connector-credential pair id"),
      },
      annotations: {
        readOnlyHint: true,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ cc_pair_id }, extra) =>
      txt(await client.getSyncStatus(cc_pair_id, extra.signal)),
  );

  server.registerTool(
    "lyzr_kb_sync_cc_pairs_list_attempts",
    {
      title: "List KB Sync Index Attempts",
      description:
        "List index attempts (sync runs) for a connector-credential pair.",
      inputSchema: {
        cc_pair_id: z
          .number()
          .int()
          .describe("The connector-credential pair id"),
        limit: z
          .number()
          .int()
          .min(1)
          .max(100)
          .optional()
          .describe("Max number of attempts to return (default 10)"),
        offset: z
          .number()
          .int()
          .min(0)
          .optional()
          .describe("Number of attempts to skip (default 0)"),
      },
      annotations: {
        readOnlyHint: true,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ cc_pair_id, limit, offset }, extra) =>
      txt(
        await client.listAttempts(cc_pair_id, { limit, offset }, extra.signal),
      ),
  );

  server.registerTool(
    "lyzr_kb_sync_cc_pairs_get_attempt",
    {
      title: "Get KB Sync Index Attempt",
      description: "Fetch a single index attempt by id.",
      inputSchema: {
        cc_pair_id: z
          .number()
          .int()
          .describe("The connector-credential pair id"),
        attempt_id: z.number().int().describe("The index attempt id"),
      },
      annotations: {
        readOnlyHint: true,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ cc_pair_id, attempt_id }, extra) =>
      txt(await client.getAttempt(cc_pair_id, attempt_id, extra.signal)),
  );

  server.registerTool(
    "lyzr_kb_sync_cc_pairs_cancel_attempt",
    {
      title: "Cancel KB Sync Index Attempt",
      description: "Cancel an in-progress index attempt.",
      inputSchema: {
        cc_pair_id: z
          .number()
          .int()
          .describe("The connector-credential pair id"),
        attempt_id: z.number().int().describe("The index attempt id to cancel"),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ cc_pair_id, attempt_id }, extra) =>
      txt(await client.cancelAttempt(cc_pair_id, attempt_id, extra.signal)),
  );
};
