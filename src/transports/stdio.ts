import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createServer } from "../server/index.js";
import { getStdioKey, getBaseUrl, MissingApiKeyError } from "../config.js";

/**
 * stdio transport: one process per user. The user's key comes from the
 * LYZR_API_KEY env var set in the MCP client's config. Missing key => fail fast.
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

  const { server, cleanup } = createServer(apiKey, getBaseUrl());
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
