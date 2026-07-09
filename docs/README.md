# lyzr-mcp — Documentation

An [MCP](https://modelcontextprotocol.io) server that exposes the **Lyzr Enterprise API** as tools, resources, and prompts. **Bring-your-own-key**, like the Supabase MCP server: every user authenticates with their **own** Lyzr API key — the server never holds a shared one.

- 📖 **[Full tool reference →](./tools.md)** (all 34 tools, resources, and prompts)
- 🧭 Architecture patterns: [`../mcp-everything-server-explained.md`](../mcp-everything-server-explained.md)
- 🗺️ Implementation plan: [`../IMPLEMENTATION-PLAN.md`](../IMPLEMENTATION-PLAN.md)

---

## Contents
1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Setup](#setup)
4. [Environment variables](#environment-variables)
5. [Scripts](#scripts)
6. [Transports](#transports)
7. [The bring-your-own-key model](#the-bring-your-own-key-model)
8. [HTTP endpoint contract](#http-endpoint-contract)
9. [Connecting a client](#connecting-a-client)
10. [Hosting a public endpoint](#hosting-a-public-endpoint)
11. [Lyzr REST endpoints wrapped](#lyzr-rest-endpoints-wrapped)
12. [Troubleshooting](#troubleshooting)

---

## Overview

The server wraps the Lyzr Enterprise API across **five service hosts** and surfaces them as MCP primitives:

| Primitive | Count | What |
|---|---|---|
| **Tools** | 34 | Agents, inference (chat/stream/tasks), Knowledge Base (RAG), Cognis memory, Scheduler, RAI guardrails |
| **Resources** | 2 | `lyzr://agents`, `lyzr://agent/{agentId}` |
| **Prompts** | 2 | `draft_support_agent`, `summarize_conversation` |

Endpoints and payload shapes were confirmed against the official `lyzr-adk` Python SDK.

## Architecture

Three layers, transport-agnostic core (mirrors the MCP "everything" reference server):

```
src/
├─ index.ts                 # LAUNCHER — argv → dynamic import of one transport
├─ config.ts                # per-user key helpers + service-URL resolution
├─ lyzr/                    # API clients (one per Lyzr service host)
│  ├─ http.ts               #   LyzrHttp base (key, request, query params) + ServiceUrls + LyzrApiError
│  ├─ client.ts             #   agents + inference        (agent-prod)
│  ├─ rag.ts                #   knowledge base / RAG       (rag-prod)
│  ├─ memory.ts             #   Cognis memory             (memory.studio)
│  ├─ scheduler.ts          #   scheduler                 (scheduler.studio)
│  └─ rai.ts                #   RAI guardrails            (rai-prod)
├─ server/
│  ├─ index.ts              # createServer(apiKey) FACTORY → { server, cleanup }
│  ├─ logging.ts            # sendLog (respects client level) + per-session cleanup
│  └─ roots.ts              # syncRoots (client roots cache)
├─ tools/                   # one file per tool / tool-set + index.ts registry
├─ resources/               # agents-as-resources + subscription handlers
├─ prompts/                 # reusable prompt templates
└─ transports/
   ├─ stdio.ts              # local (Claude Desktop/Code)
   ├─ sse.ts                # deprecated
   └─ streamableHttp.ts     # hosted, multi-tenant, resumable
```

**Data flow:** `transport` (acquires the key) → `createServer(apiKey)` (builds one client per host) → `tool` handler → `LyzrClient`/`RagClient`/… → Lyzr REST API.

## Setup

Requires **Node ≥ 18** (uses the global `fetch`).

```bash
git clone <repo> && cd lyzr-mcp
npm install
npm run build        # tsc → build/
npm test             # vitest
```

## Environment variables

| Variable | Used by | Default | Purpose |
|---|---|---|---|
| `LYZR_API_KEY` | stdio | — (required) | Your Lyzr key. **stdio only** — HTTP reads it per-request. |
| `LYZR_API_BASE_URL` / `LYZR_AGENT_API` | all | `https://agent-prod.studio.lyzr.ai` | Agent API host override |
| `LYZR_RAG_API` | KB tools | `https://rag-prod.studio.lyzr.ai` | Knowledge Base host |
| `LYZR_MEMORY_API` | memory tools | `https://memory.studio.lyzr.ai` | Cognis memory host |
| `LYZR_SCHEDULER_API` | scheduler tools | `https://scheduler.studio.lyzr.ai` | Scheduler host |
| `LYZR_RAI_API` | RAI tools | `https://rai-prod.studio.lyzr.ai` | RAI guardrails host |
| `PORT` | HTTP transports | `3001` | Port for `sse` / `streamableHttp` |

See [`.env.example`](../.env.example).

## Scripts

| Script | Command | Purpose |
|---|---|---|
| `npm run build` | `tsc` | Compile to `build/` |
| `npm run dev` | `tsc --watch` | Rebuild on change |
| `npm start` | `node build/index.js` | Run (defaults to stdio) |
| `npm test` | `vitest run` | Unit tests |
| `npm run test:watch` | `vitest` | Watch-mode tests |
| `npm run format` | `prettier --write .` | Auto-format |
| `npm run format:check` | `prettier --check .` | CI format gate |

## Transports

Pick one via the first CLI arg (`node build/index.js <transport>`), default `stdio`:

| Transport | Command | Key source | Use |
|---|---|---|---|
| **stdio** | `node build/index.js stdio` | `LYZR_API_KEY` env | Local clients (Claude Desktop/Code) |
| **streamableHttp** | `node build/index.js streamableHttp` | per-request header | Hosted, multi-tenant, resumable |
| **sse** *(deprecated)* | `node build/index.js sse` | per-request header | Legacy clients |

## The bring-your-own-key model

The key's **source depends on the trust boundary**, because the two deployments differ:

- **stdio** → one process per user → key from `LYZR_API_KEY` (set in the client's MCP config `env`).
- **HTTP** → one process, many users → key read **per session** from a request header (`x-api-key` or `Authorization: Bearer`).

`createServer(apiKey)` takes the key as a parameter and never reads a global — so the HTTP transports are multi-tenant-safe. The key is never persisted by the server, never logged, and scrubbed from errors.

## HTTP endpoint contract

Base path: **`/mcp`** (Streamable HTTP transport).

| Method | Purpose | Auth |
|---|---|---|
| `POST /mcp` | JSON-RPC requests (initialize, tools/call, …) | `x-api-key` **or** `Authorization: Bearer` on the initialize request |
| `GET /mcp` | Open the server→client SSE stream (needs `mcp-session-id` header) | session |
| `DELETE /mcp` | Terminate a session (`mcp-session-id` header) | session |

Session id is returned as the `mcp-session-id` response header on initialize and must be echoed on subsequent requests. SSE resumability is supported via `Last-Event-ID`.

**Error responses** (JSON-RPC error body):

| HTTP | Code | Meaning |
|---|---|---|
| `401` | `-32001` | Missing API key (no `x-api-key`/`Authorization`) |
| `400` | `-32000` | No valid session id |
| `500` | `-32603` | Internal server error |

Tool-level failures (e.g. a Lyzr `401`) come back as a **successful** JSON-RPC result with `isError: true` and a message like *"Lyzr API error 401: authentication failed — check your Lyzr API key."* (the key is never echoed).

## Connecting a client

**Claude Desktop** (`claude_desktop_config.json`) — stdio:
```json
{ "mcpServers": { "lyzr": {
    "command": "npx", "args": ["-y", "lyzr-mcp", "stdio"],
    "env": { "LYZR_API_KEY": "<your-key>" } } } }
```

**Claude Code** — stdio:
```bash
claude mcp add lyzr -e LYZR_API_KEY=<your-key> -- node /abs/path/build/index.js stdio
```

**Claude Code** — remote HTTP (bring-your-own-key):
```bash
claude mcp add --transport http lyzr https://your-host/mcp \
  --header "x-api-key: <your-key>"
```

**Cursor / VS Code** — remote HTTP (`~/.cursor/mcp.json` or `.vscode/mcp.json`):
```json
{ "mcpServers": { "lyzr": {
    "url": "https://your-host/mcp",
    "headers": { "x-api-key": "<your-key>" } } } }
```

## Hosting a public endpoint

```bash
# local
PORT=3001 node build/index.js streamableHttp

# docker
docker build -t lyzr-mcp .
docker run -d -p 3001:3001 --name lyzr-mcp lyzr-mcp
```

Put it behind **HTTPS** (Caddy/nginx/Cloudflare or a tunnel like `ngrok http 3001`) — keys travel in headers, so TLS is mandatory. Sessions + the SSE event store are in-memory, so run a **single instance** (or add sticky sessions + a shared store to scale).

## Lyzr REST endpoints wrapped

| Group | Host | Endpoints |
|---|---|---|
| Agents | `agent-prod` | `POST/GET /v3/agents/`, `GET/PUT/DELETE /v3/agents/{id}` |
| Inference | `agent-prod` | `POST /v3/inference/chat/`, `/stream/`, `/task/`, `GET /v3/inference/task/{id}` |
| Knowledge Base | `rag-prod` | `POST/GET /v3/rag/`, `/v3/rag/{id}/`, `/v3/train/{text,website}/`, `GET /v3/rag/{id}/retrieve/`, `GET /v3/rag/documents/{id}/` |
| Cognis memory | `memory.studio` | `POST/GET /v1/memories`, `GET/PATCH/DELETE /v1/memories/{id}`, `POST /v1/memories/search` |
| Scheduler | `scheduler.studio` | `POST/GET /schedules/`, `/schedules/{id}`, `/{id}/{pause,resume,trigger}` |
| RAI | `rai-prod` | `POST/GET/DELETE /v1/rai/policies`, `/v1/rai/policies/{id}` |

**Not wrapped:** agent bulk-delete, KB file uploads (PDF/DOCX — awkward over MCP), memory summaries/context, RAI update. **Skills** have no REST API (they're client-side definitions attached to an agent).

## Troubleshooting

| Symptom | Cause & fix |
|---|---|
| **`lyzr_memory_*` returns 403** | The Cognis memory API isn't enabled for that key/account. Other hosts work with the same key — contact Lyzr to enable memory. |
| **Tools don't appear in Claude after `mcp add`** | Clients register MCP servers at **startup**. Restart the client (or the session). |
| **Tools missing in a project** | `claude mcp add` defaults to **local** (per-directory) scope. Re-add with `-s user` for global, or run the client from the directory where you added it. |
| **`401 Unauthorized` on HTTP** | No `x-api-key`/`Authorization` header on the initialize request. |
| **`400 No valid session ID`** | The server restarted (sessions are in-memory) — reconnect / re-initialize. |
| **`lyzr_kb_list` returns `[]`** | It needs your real Lyzr `user_id`; a wrong id returns empty. |
| **Changes not taking effect** | Rebuild (`npm run build`) and restart the client. |
| **ngrok URL stopped working** | Free-tier URLs rotate on restart — update the client config or deploy to a stable domain. |
| **`403` on a task (`Event loop is closed`)** | A Lyzr-side backend error for the task endpoint, not this server. |
