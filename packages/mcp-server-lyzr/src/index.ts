#!/usr/bin/env node

/**
 * Launcher. Picks a transport from argv[0] and dynamically imports ONLY that
 * module, so unused transports (and their side effects, e.g. starting an HTTP
 * server) never initialize. Mirrors the reference server's launcher.
 */
const args = process.argv.slice(2);
const transport = args[0] || "stdio";

async function run(): Promise<void> {
  switch (transport) {
    case "stdio":
      await import("./transports/stdio.js");
      break;
    case "sse":
      await import("./transports/sse.js");
      break;
    case "streamableHttp":
      await import("./transports/streamableHttp.js");
      break;
    default:
      console.error("-".repeat(53));
      console.error("  Lyzr MCP Server Launcher");
      console.error("  Usage: node ./index.js [stdio|sse|streamableHttp]");
      console.error("  Default transport: stdio");
      console.error("-".repeat(53));
      console.error(`Unknown transport: ${transport}`);
      process.exit(1);
  }
}

run().catch((error) => {
  console.error("[lyzr-mcp] launcher error:", error);
  process.exit(1);
});
