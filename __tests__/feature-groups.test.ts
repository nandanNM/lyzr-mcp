import { describe, it, expect, vi } from "vitest";
import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
  parseFeatures,
  isFeatureGroup,
  applyReadOnlyGate,
  FEATURE_GROUPS,
} from "../src/tools/feature-groups";

describe("parseFeatures", () => {
  it("returns undefined for empty/undefined input (enable everything)", () => {
    expect(parseFeatures(undefined)).toBeUndefined();
    expect(parseFeatures("")).toBeUndefined();
    expect(parseFeatures("   ")).toBeUndefined();
  });

  it("parses a comma-separated list, trimming whitespace", () => {
    expect(parseFeatures("core, rag ,a2a")).toEqual(["core", "rag", "a2a"]);
  });

  it("throws on an unknown group name", () => {
    expect(() => parseFeatures("core,bogus")).toThrow(/Unknown feature group/);
  });
});

describe("isFeatureGroup", () => {
  it("accepts every declared group and rejects unknown strings", () => {
    for (const g of FEATURE_GROUPS) {
      expect(isFeatureGroup(g)).toBe(true);
    }
    expect(isFeatureGroup("nope")).toBe(false);
  });
});

describe("applyReadOnlyGate", () => {
  const mk = () => new McpServer({ name: "t", version: "0.0.0" });

  it("passes the server through unchanged when readOnly is false", () => {
    const server = mk();
    expect(applyReadOnlyGate(server, false)).toBe(server);
  });

  it("disables a tool without readOnlyHint:true, keeps one with it enabled", () => {
    const server = mk();
    const gated = applyReadOnlyGate(server, true);

    const write = gated.registerTool(
      "write_thing",
      { annotations: { readOnlyHint: false } },
      async () => ({ content: [] }),
    );
    const read = gated.registerTool(
      "read_thing",
      { annotations: { readOnlyHint: true } },
      async () => ({ content: [] }),
    );
    const unannotated = gated.registerTool(
      "unannotated_thing",
      { inputSchema: { x: z.string().optional() } },
      async () => ({ content: [] }),
    );

    expect(write.enabled).toBe(false);
    expect(read.enabled).toBe(true);
    expect(unannotated.enabled).toBe(false);
  });

  it("forwards non-registerTool properties/methods to the real server", () => {
    const server = mk();
    const spy = vi.spyOn(server, "registerResource");
    const gated = applyReadOnlyGate(server, true);

    expect(gated.server).toBe(server.server);
    gated.registerResource("r", "test://r", {}, async () => ({ contents: [] }));
    expect(spy).toHaveBeenCalledTimes(1);
  });
});
