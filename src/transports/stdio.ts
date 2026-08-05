import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { parseArgs } from "node:util";
import { createServer } from "../server/index.js";
import {
  getStdioKey,
  getBaseUrl,
  getFeatures,
  getReadOnly,
  MissingApiKeyError,
} from "../config.js";
import { parseFeatures, type FeatureGroup } from "../tools/feature-groups.js";

/**
 * stdio transport: one process per user. The user's key comes from the
 * LYZR_API_KEY env var set in the MCP client's config. Missing key => fail fast.
 *
 * `--features`/`--read-only` (or LYZR_FEATURES/LYZR_READ_ONLY) scope which
 * tools register — same seam Supabase's MCP server exposes via its own
 * --features/--read-only flags. CLI flags win over env vars when both are set.
 *
 * IMPORTANT: never write to stdout here — it carries the JSON-RPC stream.
 * All human-facing logging goes to stderr via console.error.
 */
async function main(): Promise<void> {
  let apiKey: string;
  try {
    apiKey = getStdioKey();
  } catch (error) {
    if (error instanceof MissingApiKeyError) {
      console.error(`\n[lyzr-mcp] ${error.message}\n`);
      process.exit(1);
    }
    throw error;
  }

  const {
    values: { features: cliFeatures, "read-only": cliReadOnly },
  } = parseArgs({
    args: process.argv.slice(3), // argv[2] is the transport name, consumed by index.ts
    options: {
      features: { type: "string" },
      "read-only": { type: "boolean" },
    },
    strict: false,
  });

  let features: FeatureGroup[] | undefined;
  try {
    features = cliFeatures ? parseFeatures(String(cliFeatures)) : getFeatures();
  } catch (error) {
    console.error(`\n[lyzr-mcp] ${(error as Error).message}\n`);
    process.exit(1);
  }
  const readOnly =
    cliReadOnly !== undefined ? Boolean(cliReadOnly) : getReadOnly();

  const { server, cleanup } = createServer(apiKey, getBaseUrl(), {
    features,
    readOnly,
  });
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("[lyzr-mcp] running on stdio");

  process.on("SIGINT", async () => {
    await server.close();
    cleanup();
    process.exit(0);
  });
}

main().catch((error) => {
  console.error("[lyzr-mcp] fatal error:", error);
  process.exit(1);
});
