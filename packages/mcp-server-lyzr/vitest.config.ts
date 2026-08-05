import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    name: "mcp-server-lyzr",
    environment: "node",
    include: ["__tests__/**/*.test.ts"],
  },
});
