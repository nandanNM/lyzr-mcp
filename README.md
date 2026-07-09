# lyzr-mcp

An [MCP](https://modelcontextprotocol.io) server that exposes the **Lyzr Enterprise Agent API** as MCP tools.

**Bring-your-own-key**, like the Supabase MCP server: every user supplies their **own** Lyzr API key. The server authenticates as that user and **never uses a shared key**.

> Status: **runnable.** All three transports (stdio, SSE, Streamable HTTP), **34 tools across 5 Lyzr service hosts** (agent, rag, memory, scheduler, rai), agents-as-resources, and prompts are built; endpoints are confirmed against the `lyzr-adk` SDK. See [`IMPLEMENTATION-PLAN.md`](./IMPLEMENTATION-PLAN.md) for the full plan and [`mcp-everything-server-explained.md`](./mcp-everything-server-explained.md) for the patterns this follows.

## Documentation

- 📖 **[docs/README.md](./docs/README.md)** — architecture, setup, env vars, transports, HTTP contract, hosting, troubleshooting.
- 🧰 **[docs/tools.md](./docs/tools.md)** — full reference for all 34 tools, resources, and prompts.

## Tools

| Tool | What it does |
|---|---|
| `lyzr_create_agent` | Create an agent (returns `agent_id`) |
| `lyzr_update_agent` | Update fields on an agent (preserves the rest) |
| `lyzr_delete_agent` | Delete an agent (destructive) |
| `lyzr_list_agents` / `lyzr_get_agent` | List / fetch agents |
| `lyzr_chat` | Send a message, get the full reply |
| `lyzr_stream_chat` | Streamed reply with progress notifications |
| `lyzr_start_task` / `lyzr_get_task_status` | Submit and poll long-running tasks |

**Knowledge Base (RAG):** `lyzr_kb_create`, `lyzr_kb_get`, `lyzr_kb_list`, `lyzr_kb_train_text`, `lyzr_kb_train_website`, `lyzr_kb_query`, `lyzr_kb_list_documents`, `lyzr_kb_delete`.

**Knowledge Graph (Cognis memory):** `lyzr_memory_add`, `lyzr_memory_search`, `lyzr_memory_list`, `lyzr_memory_get`, `lyzr_memory_update`, `lyzr_memory_delete`.

**Scheduler:** `lyzr_schedule_create`, `_list`, `_get`, `_pause`, `_resume`, `_trigger`, `_delete`.

**RAI guardrails:** `lyzr_rai_create_policy`, `_list_policies`, `_get_policy`, `_delete_policy`.

Resources: `lyzr://agents`, `lyzr://agent/{agentId}`. Prompts: `draft_support_agent`, `summarize_conversation`.

> **Skills** are intentionally not exposed: in Lyzr they're client-side markdown definitions attached to an agent at creation, not a REST resource — there's no API to wrap.

## How the API key flows

| Transport | Key source |
|---|---|
| **stdio** (local install) | `LYZR_API_KEY` env var, set in the MCP client's config |
| **Streamable HTTP / SSE** (hosted) | per-request header `x-api-key` or `Authorization: Bearer <key>` |

The server only *reads* the key — it never writes it to disk. The MCP client is the secure store.

## Develop

```bash
npm install
npm run build      # tsc -> build/
npm test           # vitest
```

Requires Node ≥ 18 (uses the global `fetch`).

## Install in a client

**Claude Desktop** — `claude_desktop_config.json`:
```json
{ "mcpServers": { "lyzr": {
    "command": "npx", "args": ["-y", "lyzr-mcp", "stdio"],
    "env": { "LYZR_API_KEY": "<your-key>" } } } }
```

**Claude Code**:
```bash
claude mcp add lyzr --env LYZR_API_KEY=<your-key> -- npx -y lyzr-mcp stdio
```

**VS Code** — `.vscode/mcp.json` (prompts for the key, stores it in the secret store):
```json
{ "inputs": [
    { "type": "promptString", "id": "lyzr-key", "description": "Lyzr API Key", "password": true } ],
  "servers": { "lyzr": {
      "command": "npx", "args": ["-y", "lyzr-mcp", "stdio"],
      "env": { "LYZR_API_KEY": "${input:lyzr-key}" } } } }
```

Get your key from **Agent Studio → Account → API Keys**.

## Layout

```
src/
  config.ts        # per-user key helpers (env / header), base URL
  lyzr/client.ts   # LyzrClient — the only file that knows Lyzr HTTP endpoints
__tests__/         # vitest unit tests
```
