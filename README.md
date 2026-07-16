# lyzr-mcp

An [MCP](https://modelcontextprotocol.io) server that exposes the **Lyzr Enterprise API** as MCP tools, resources, and prompts.

**Bring-your-own-key**, like the Supabase MCP server: every user supplies their **own** Lyzr API key. The server authenticates as that user and **never uses a shared key**.

> Status: **runnable.** All three transports (stdio, SSE, Streamable HTTP), **79 tools across the agent + rag hosts** (agents, sessions, inference, RAG/knowledge base, parse/classify, credentials, live sources, knowledge graph, Cognis memory, scheduler, RAI), **5 resources**, and **4 prompts**. Endpoints confirmed against the `lyzr-adk` SDK and the Lyzr OpenAPI specs.

## Documentation

- 📖 **[docs/README.md](./docs/README.md)** — architecture, setup, env vars, transports, HTTP contract, hosting, troubleshooting.
- 🧰 **[docs/tools.md](./docs/tools.md)** — reference for the core tools, resources, and prompts.

## Tools (79)

| Group | Tools |
|---|---|
| **Agents & inference** | `lyzr_create_agent`, `lyzr_update_agent`, `lyzr_delete_agent`, `lyzr_list_agents`, `lyzr_get_agent`, `lyzr_chat`, `lyzr_stream_chat`, `lyzr_start_task`, `lyzr_get_task_status` |
| **Sessions & templates** | `lyzr_session_*` (create / get / update / delete / history / summary / conversation / list-by-agent), `lyzr_agent_id_by_name`, `lyzr_agent_create_single_task`, `lyzr_agent_update_single_task` |
| **Knowledge Base (RAG)** | `lyzr_kb_create/get/list/query/list_documents/delete`, `lyzr_kb_train_text/train_website/train_documents`, `lyzr_kb_update/bulk_delete/reset`, `lyzr_kb_delete_docs/delete_docs_by_filter/update_docs_metadata` |
| **Parse & classify** | `lyzr_parse_website`, `lyzr_parse_website_apify`, `lyzr_parse_text`, `lyzr_classify` |
| **Credentials & live sources** | `lyzr_credential_*` (create/list/get/update/delete), `lyzr_livesource_*` (add/list/get/remove/sync/pause/resume/repoint/list_credentials) |
| **Knowledge Graph (v4)** | `lyzr_kg_train_website/train_text/train_text_task/get_graph/deduplicate/task_status` |
| **Cognis memory** | `lyzr_memory_add/search/list/get/update/delete` |
| **Scheduler** | `lyzr_schedule_create/list/get/pause/resume/trigger/delete` |
| **RAI guardrails** | `lyzr_rai_create_policy/list_policies/get_policy/delete_policy` |

**Resources (5):** `lyzr://agents`, `lyzr://agent/{agentId}`, `lyzr://kb/{ragId}`, `lyzr://kb/{ragId}/documents`, `lyzr://session/{sessionId}`.
**Prompts (4):** `draft_support_agent`, `summarize_conversation`, `setup_rag_agent`, `draft_guardrail_policy`.

> Skipped (not viable as plain MCP tools): multipart **file uploads** (PDF/DOCX/CSV/XLSX/PPTX/image parse & train, extract), **OAuth** flows, **webhooks**, browse endpoints, and the KB-Sync connector subsystem. **Skills** have no REST API (client-side definitions).

## How the API key flows

| Transport | Key source |
|---|---|
| **stdio** (local install) | `LYZR_API_KEY` env var, set in the MCP client's config |
| **Streamable HTTP / SSE** (hosted) | per-request header `x-api-key` or `Authorization: Bearer <key>` |

The server only *reads* the key — it never writes it to disk. The client (or the request header) is the secure store.

## Build

```bash
npm install
npm run build      # tsc -> build/index.js
npm test           # vitest
```

Requires Node ≥ 18 (uses the global `fetch`). Get your key from **Agent Studio → Account → API Keys**.

---

## Add to your coding tool (local, stdio)

All examples run the built entrypoint: `node <repo>/build/index.js stdio`. Replace `/ABS/PATH/lyzr-mcp` with your clone's absolute path and `YOUR_KEY` with your Lyzr API key. (Once published to npm you can swap `node <path>` for `npx -y lyzr-mcp`.)

### Claude Code
```bash
claude mcp add lyzr -e LYZR_API_KEY=YOUR_KEY -- node /ABS/PATH/lyzr-mcp/build/index.js stdio
```
Verify with `claude mcp list` or `/mcp`. Add `-s user` for a global (all-projects) install.

### Claude Desktop
`~/Library/Application Support/Claude/claude_desktop_config.json`:
```json
{
  "mcpServers": {
    "lyzr": {
      "command": "node",
      "args": ["/ABS/PATH/lyzr-mcp/build/index.js", "stdio"],
      "env": { "LYZR_API_KEY": "YOUR_KEY" }
    }
  }
}
```
Fully quit and reopen Claude Desktop; the tools appear under the 🔨 icon.

### OpenAI Codex CLI
`~/.codex/config.toml`:
```toml
[mcp_servers.lyzr]
command = "node"
args = ["/ABS/PATH/lyzr-mcp/build/index.js", "stdio"]
env = { LYZR_API_KEY = "YOUR_KEY" }
```
(Or `codex mcp add lyzr -- node /ABS/PATH/lyzr-mcp/build/index.js stdio`, then set the key in the config's `env`.) List servers with `codex mcp list`.

### Cursor
`~/.cursor/mcp.json` (global) or `.cursor/mcp.json` (per-project):
```json
{
  "mcpServers": {
    "lyzr": {
      "command": "node",
      "args": ["/ABS/PATH/lyzr-mcp/build/index.js", "stdio"],
      "env": { "LYZR_API_KEY": "YOUR_KEY" }
    }
  }
}
```

### Windsurf
`~/.codeium/windsurf/mcp_config.json` — same shape as Cursor (`mcpServers` → `command`/`args`/`env`).

### VS Code (GitHub Copilot)
`.vscode/mcp.json` — note `servers` and `type`, and prompt for the key so it lands in the secret store:
```json
{
  "inputs": [
    { "type": "promptString", "id": "lyzr-key", "description": "Lyzr API Key", "password": true }
  ],
  "servers": {
    "lyzr": {
      "type": "stdio",
      "command": "node",
      "args": ["/ABS/PATH/lyzr-mcp/build/index.js", "stdio"],
      "env": { "LYZR_API_KEY": "${input:lyzr-key}" }
    }
  }
}
```

---

## Add to a hosted server (remote, bring-your-own-key)

Run one shared instance and let each user connect with **their own** key in a header:

```bash
PORT=3001 node /ABS/PATH/lyzr-mcp/build/index.js streamableHttp   # endpoint: http://HOST:3001/mcp
```
Put it behind HTTPS (reverse proxy, or `ngrok http 3001` for a quick test). Then:

**Claude Code:**
```bash
claude mcp add --transport http lyzr https://your-host/mcp --header "x-api-key: YOUR_KEY"
```

**Cursor / Windsurf** (`mcp.json`):
```json
{ "mcpServers": { "lyzr": {
    "url": "https://your-host/mcp",
    "headers": { "x-api-key": "YOUR_KEY" } } } }
```

**VS Code** (`.vscode/mcp.json`): `{ "servers": { "lyzr": { "type": "http", "url": "https://your-host/mcp", "headers": { "x-api-key": "YOUR_KEY" } } } }`

**stdio-only clients (Codex CLI, older clients)** bridge to the remote server with [`mcp-remote`](https://www.npmjs.com/package/mcp-remote):
```toml
# ~/.codex/config.toml
[mcp_servers.lyzr]
command = "npx"
args = ["-y", "mcp-remote", "https://your-host/mcp", "--header", "x-api-key:YOUR_KEY"]
```

See [docs/README.md](./docs/README.md#hosting-a-public-endpoint) for Docker + HTTPS deployment.

## Layout

```
src/
  index.ts            # launcher: argv → dynamic import of one transport
  config.ts           # per-user key helpers (env / header) + service-URL resolution
  lyzr/               # one API client per Lyzr host, all extending LyzrHttp
    http.ts           #   shared base: key, request(), query params, LyzrApiError, ServiceUrls
    client.ts         #   agents + inference        (agent host)
    agent-extras.ts   #   sessions + templates       (agent host)
    rag.ts rag-admin.ts rag-content.ts rag-credentials.ts knowledge-graph.ts   (rag host)
    memory.ts scheduler.ts rai.ts
  server/             # createServer() factory, logging, roots
  tools/              # one file per tool-set + index.ts registry
  resources/          # agents/KBs/sessions as resources + subscriptions
  prompts/            # reusable prompt templates
  transports/         # stdio, sse (deprecated), streamableHttp
__tests__/            # vitest unit tests
```
