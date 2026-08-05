---
name: lyzr-api-endpoint
description: Use whenever adding a new Lyzr API endpoint (or small batch) as an MCP tool in this server, or wiring a new Lyzr service client into it.
---

# Adding a Lyzr API endpoint

House style for `lyzr-mcp`: one client method per endpoint, one tool per method,
wired through `config.ts` → `server/index.ts` → `tools/index.ts`. Follow the
existing files exactly — this repo has zero tolerance for drift in style.

## 1. Client method (or new client file)

All clients extend `LyzrHttp` (`src/lyzr/http.ts`), which owns `apiKey`,
`baseUrl`, `request()`, `headers()`, `buildUrl()`. **Never log or touch
`apiKey` outside `http.ts`.**

**Adding to an existing service** (e.g. another `/v3/agents/*` endpoint) — add
a method to `src/lyzr/client.ts` (or `rag.ts`, `memory.ts`, etc.):

```ts
/** Delete an agent. DELETE /v3/agents/{agent_id} */
deleteAgent(agentId: string, signal?: AbortSignal): Promise<unknown> {
  return this.request<unknown>(
    "DELETE",
    `/v3/agents/${encodeURIComponent(agentId)}`,
    { signal },
  );
}
```

Rules:
- One-line `/** verb description. METHOD /path */` doc comment above every method, method+path stated explicitly.
- `encodeURIComponent` any id interpolated into a path.
- Always accept and forward an optional trailing `signal?: AbortSignal`.
- Return `Promise<SpecificType>` when you define an interface for the shape; `Promise<unknown>` is fine for passthrough delete/mutate responses (see `rai.ts`).
- List endpoints: use `normalizeList<T>(raw, "keyName")` from `http.ts` to handle a bare array or `{ keyName: [...] }` / `{data:[...]}` / `{results:[...]}` shapes — see `listAgents()`.
- Complex payload transforms (renaming fields, resolving aliases, filling defaults) live in the client method, not the tool — see `createAgent`'s `PROVIDER_MAP` resolution or `updateAgent`'s GET→merge→PUT.

**New service host** (a Lyzr host not yet represented) — new file `src/lyzr/<service>.ts`:

```ts
/**
 * <Service> client — host: <name>.
 * Endpoints/shapes confirmed against the lyzr-adk SDK.
 */
import { LyzrHttp } from "./http.js";

export class <Service>Client extends LyzrHttp {
  ...
}
```
Mirror `rai.ts`'s shape: top-of-file doc comment naming the host, exported input interfaces only where the payload needs shaping, plain `LyzrHttp` methods otherwise.

## 2. Tool registrar file

One file per tool-set under `src/tools/`, exporting a single
`registerXTools(server, client)` function. Small single-tool files
(`create-agent.ts`) register one tool; multi-tool files (`knowledge-base.ts`)
register several with a local `txt()` helper.

```ts
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { LyzrClient } from "../lyzr/client.js";

export const registerDeleteAgentTool = (
  server: McpServer,
  client: LyzrClient,
) => {
  server.registerTool(
    "lyzr_delete_agent",
    {
      title: "Delete Lyzr Agent",
      description: "Permanently delete an agent by id.",
      inputSchema: {
        agent_id: z.string().describe("The agent_id to delete"),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ agent_id }, extra) => {
      const result = await client.deleteAgent(agent_id, extra.signal);
      return {
        content: [
          { type: "text", text: `Deleted agent \`${agent_id}\`.\n\n${JSON.stringify(result, null, 2)}` },
        ],
      };
    },
  );
};
```

For multi-tool files use the shared helper instead of hand-building `content`:
```ts
const txt = (data: unknown) => ({
  content: [{ type: "text" as const, text: typeof data === "string" ? data : JSON.stringify(data, null, 2) }],
});
...
async ({ kb_id }, extra) => txt(await rag.getKb(kb_id, extra.signal)),
```

Conventions:
- Tool name: `lyzr_<snake_case>`, prefixed with the noun group (`lyzr_kb_*`, `lyzr_rai_*`, `lyzr_schedule_*`).
- **Every** `inputSchema` field has `.describe("...")`. Use `.default(...)` for sensible defaults (`provider`, `vector_store`), `.optional()` for everything else that isn't required, `.min()/.max()` for bounded numbers.
- `extra.signal` is always forwarded into the client call so callers can cancel.
- Destructure the exact args you need in the handler signature (`{ agent_id, ...updates }`, `{ rag_id, query, top_k }`) rather than passing a raw `args` blob, except where the whole object matches the client input 1:1 (`createAgent`).

### The four annotation hints — decide each explicitly
| hint | true when | false/omit when |
|---|---|---|
| `readOnlyHint` | pure GET/list/query, no side effect | any create/update/delete |
| `destructiveHint` | irreversible delete (`lyzr_kb_delete`) | creates, updates, reversible ops |
| `idempotentHint` | re-running with the same args is safe/no-op-ish (GET, DELETE-by-id, PUT-style update) | POST-create (new resource each time) |
| `openWorldHint` | true for basically everything here — every tool talks to the live Lyzr API | never omit-false in this repo; all tools set `true` |

Look at real examples: create = `{readOnlyHint:false, destructiveHint:false, idempotentHint:false, openWorldHint:true}`; update = same but `idempotentHint:true`; read = `{readOnlyHint:true, idempotentHint:true, openWorldHint:true}` (destructiveHint omitted); delete = `{readOnlyHint:false, destructiveHint:true, idempotentHint:true, openWorldHint:true}`.

## 3. Wiring

**`src/config.ts`** — only if introducing a *new service host*. Add the URL to `ServiceUrls`/`DEFAULT_SERVICE_URLS` in `http.ts`, then in `config.ts`'s `getServiceUrls()` add an env-var override following the pattern:
```ts
<service>: process.env.LYZR_<SERVICE>_API?.trim() || DEFAULT_SERVICE_URLS.<service>,
```

**`src/server/index.ts`** — add the client to the `LyzrClients` interface and instantiate it in `createServer()`, matching the host it belongs to:
```ts
// in LyzrClients
<name>: <Service>Client;
// in createServer()
<name>: new <Service>Client({ apiKey, baseUrl: urls.<service> }), // <service> host
```
Reuse `baseUrl` (agent host, param wins) or `urls.<service>` (any other host) exactly like the existing entries.

**`src/tools/index.ts`** — import the client type, import the registrar, add the client to `LyzrClients`, instantiate-call it in `registerTools()` under a one-line host comment grouping it with its service:
```ts
// <Group name> (host: <service>)
register<X>Tools(server, clients.<name>);
```

## 4. Tests (`__tests__/*.test.ts`, vitest)

Pattern used throughout: inject `fetchImpl`, assert URL + method + body, and cover an error path.

```ts
const okJson = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });

it("deleteAgent DELETEs by id", async () => {
  const fetchMock = vi.fn(async () => okJson({}, 200));
  const client = new LyzrClient({ apiKey: "k", baseUrl: "https://api.example.test", fetchImpl: fetchMock as unknown as typeof fetch });
  await client.deleteAgent("agent-1");
  const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
  expect(url).toBe("https://api.example.test/v3/agents/agent-1");
  expect(init.method).toBe("DELETE");
});
```

Also assert:
- Request body via `JSON.parse(init.body as string)` with `toEqual`/`toMatchObject`.
- Provider/store-name resolution or validation errors thrown synchronously (`expect(() => ...).toThrow(/pattern/)`).
- At least one non-2xx path: `await expect(client.foo()).rejects.toBeInstanceOf(LyzrApiError)`, and confirm the message never contains the api key (`expect(e.message).not.toContain("test-key-123")`).
- List-normalization: feed array / `{key:[...]}` / `{data:[...]}` shapes through the same test.

## Checking for API drift

The two live OpenAPI specs (`agent-dev.test.studio.lyzr.ai/openapi.json`,
`rag-dev.test.studio.lyzr.ai/openapi.json`) can change independently of this
repo, and the hand-written clients in `src/lyzr/*.ts` can drift from them.
Before re-reading an entire spec by hand to check for changes, run:

```
npm run generate:openapi-types
```

This regenerates `src/lyzr/generated/agent-api-types.ts` and
`src/lyzr/generated/rag-api-types.ts` (raw `openapi-typescript` output,
gitignored, never hand-edited, never the source of truth for the hand-rolled
clients). Diff the relevant generated file against the client method(s) you
suspect changed — new/renamed fields, changed required-ness, new endpoints —
instead of manually diffing the whole spec.

## MCP-specific rules (non-negotiable)

- **Never log or leak the API key** — it only ever lives inside `LyzrHttp`/`http.ts`. Don't print it, don't put it in error messages, don't echo it back in tool output.
- **Bring-your-own-key** — never hardcode a shared/default key anywhere. Keys come from `LYZR_API_KEY` env (stdio) or `x-api-key`/`Authorization: Bearer` header (HTTP), via `config.ts` only.
- **Tool names**: `lyzr_` prefix, snake_case, grouped by noun (`lyzr_kb_*`, `lyzr_session_*`).
- **`normalizeList`**: use it for any endpoint that may return a bare array or a key-wrapped object — don't write ad hoc unwrapping.
- **One concern per file**: one client per service host, one tool-set per file, registrar function named `register<X>Tools` exported and imported into `tools/index.ts` — never inline tool registration elsewhere.
