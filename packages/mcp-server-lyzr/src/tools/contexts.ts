import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { ContextsClient } from "../lyzr/contexts.js";

const txt = (data: unknown) => ({
  content: [
    {
      type: "text" as const,
      text: typeof data === "string" ? data : JSON.stringify(data, null, 2),
    },
  ],
});

/** Register the Contexts tools. */
export const registerContextsTools = (
  server: McpServer,
  contexts: ContextsClient,
) => {
  server.registerTool(
    "lyzr_create_context",
    {
      title: "Create Context",
      description: "Create a named key/value context. Returns the new context.",
      inputSchema: {
        name: z.string().describe("Context name"),
        value: z.string().describe("Context value"),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async (args, extra) =>
      txt(await contexts.createContext(args, extra.signal)),
  );

  server.registerTool(
    "lyzr_list_contexts",
    {
      title: "List Contexts",
      description: "List contexts, with pagination.",
      inputSchema: {
        skip: z
          .number()
          .int()
          .min(0)
          .optional()
          .describe("Number of contexts to skip (default 0)"),
        limit: z
          .number()
          .int()
          .min(1)
          .max(1000)
          .optional()
          .describe("Number of contexts to retrieve (default 100, max 1000)"),
      },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ skip, limit }, extra) =>
      txt(await contexts.listContexts({ skip, limit }, extra.signal)),
  );

  server.registerTool(
    "lyzr_get_contexts_count",
    {
      title: "Get Contexts Count",
      description: "Get the total count of contexts.",
      inputSchema: {},
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async (_args, extra) => txt(await contexts.getContextsCount(extra.signal)),
  );

  server.registerTool(
    "lyzr_get_context",
    {
      title: "Get Context",
      description: "Fetch a context by id.",
      inputSchema: {
        context_id: z.string().describe("Context id"),
      },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ context_id }, extra) =>
      txt(await contexts.getContext(context_id, extra.signal)),
  );

  server.registerTool(
    "lyzr_update_context",
    {
      title: "Update Context",
      description: "Update a context's name and/or value by id.",
      inputSchema: {
        context_id: z.string().describe("Context id"),
        name: z.string().optional().describe("New context name"),
        value: z.string().optional().describe("New context value"),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ context_id, name, value }, extra) =>
      txt(
        await contexts.updateContext(context_id, { name, value }, extra.signal),
      ),
  );

  server.registerTool(
    "lyzr_delete_context",
    {
      title: "Delete Context",
      description: "Permanently delete a context by id.",
      inputSchema: {
        context_id: z.string().describe("Context id"),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ context_id }, extra) =>
      txt(await contexts.deleteContext(context_id, extra.signal)),
  );

  server.registerTool(
    "lyzr_get_context_by_name_internal",
    {
      title: "Get Context By Name (Internal)",
      description:
        "Internal endpoint: fetch a context by its name using an internal api_key.",
      inputSchema: {
        context_name: z.string().describe("Context name"),
        api_key: z.string().describe("API key for internal access"),
      },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ context_name, api_key }, extra) =>
      txt(
        await contexts.getContextByNameInternal(
          context_name,
          api_key,
          extra.signal,
        ),
      ),
  );

  server.registerTool(
    "lyzr_get_context_value_internal",
    {
      title: "Get Context Value (Internal)",
      description:
        "Internal endpoint: fetch a context's value by its name using an internal api_key.",
      inputSchema: {
        context_name: z.string().describe("Context name"),
        api_key: z.string().describe("API key for internal access"),
      },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ context_name, api_key }, extra) =>
      txt(
        await contexts.getContextValueInternal(
          context_name,
          api_key,
          extra.signal,
        ),
      ),
  );

  server.registerTool(
    "lyzr_get_multiple_context_values_internal",
    {
      title: "Get Multiple Context Values (Internal)",
      description:
        "Internal endpoint: fetch multiple context values by name using an internal api_key.",
      inputSchema: {
        context_names: z
          .array(z.string())
          .min(1)
          .describe("List of context names to fetch values for"),
        api_key: z.string().describe("API key for internal access"),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async ({ context_names, api_key }, extra) =>
      txt(
        await contexts.getMultipleContextValuesInternal(
          context_names,
          api_key,
          extra.signal,
        ),
      ),
  );
};
