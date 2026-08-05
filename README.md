# lyzr-mcp

An [MCP](https://modelcontextprotocol.io) server that exposes the **Lyzr Enterprise API** as MCP tools, resources, and prompts.

**Bring-your-own-key**, like the Supabase MCP server: every user supplies their **own** Lyzr API key. The server authenticates as that user and **never uses a shared key**.

> Status: **runnable.** All three transports (stdio, SSE, Streamable HTTP), **423 tools** across the agent + rag hosts — the original core set (agents, sessions, inference, RAG/knowledge base, parse/classify, credentials, live sources, knowledge graph, Cognis memory, scheduler, RAI) plus the full remaining `agent-dev` OpenAPI surface (A2A, agent eval, artifacts, assets, audit logs, channels, contexts, platform admin, GitAgent, human feedback, tool requests, skills, org LLM fallbacks, reports, semantic model, sessions v3, sharing, tools v3, traces, usage alerts, widget stream, user assets, world model, agent memory providers, ops, providers, workflows) plus the full remaining `rag-dev` OpenAPI surface (Live Sources browse/webhooks/sync-permissions, Knowledge Graph Neo4j variants, Extract, doc content, Source Auth, file-based Parse/Train for PDF/DOCX/TXT/CSV/XLSX/PPTX/image, and the full KB Sync connector subsystem including deprecated legacy endpoints) — **5 resources**, and **4 prompts**. Endpoints confirmed against the `lyzr-adk` SDK and the Lyzr OpenAPI specs.

## Documentation

- 📖 **[docs/README.md](./docs/README.md)** — architecture, setup, env vars, transports, HTTP contract, hosting, troubleshooting.
- 🧰 **[docs/tools.md](./docs/tools.md)** — reference for the core tools, resources, and prompts.

## Tools (363)

See [.claude/skills/lyzr-api-endpoint/SKILL.md](.claude/skills/lyzr-api-endpoint/SKILL.md) for the conventions
used to add these, and `npx lyzr-mcp-skills` below for end-user-facing skills covering the core groups.

### Core groups

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

### Extended agent-dev groups (`agent` host)

| Group | Tools |
|---|---|
| **Agent lifecycle (extra)** | `lyzr_set_agent_status`, `lyzr_set_agent_lock`, `lyzr_bulk_delete_agents`, `lyzr_list_org_agents`, `lyzr_list_agent_versions`, `lyzr_get_agent_version`, `lyzr_activate_agent_version`, `lyzr_clone_agent`, `lyzr_reassign_agent`, `lyzr_publish_agents` |
| **Inference (extra)** | `lyzr_execute_tool`, `lyzr_submit_chat_task`, `lyzr_get_chat_task_status`, `lyzr_create_webrtc_session`, `lyzr_chat_with_file`, `lyzr_stop_session`, `lyzr_start_session`, `lyzr_list_voices`, `lyzr_agent_chat_completions`, `lyzr_simple_chat_completions`, `lyzr_create_inference_v4`, `lyzr_chat_completions_v4`, `lyzr_create_response_v4` |
| **A2A agents** | `lyzr_list_a2a_agents`, `lyzr_create_a2a_agent`, `lyzr_get_a2a_agent`, `lyzr_update_a2a_agent`, `lyzr_delete_a2a_agent`, `lyzr_infer_a2a_agent`, `lyzr_get_a2a_agent_card(_convenience)`, `lyzr_send_a2a_jsonrpc` |
| **Agent eval** | `lyzr_create_agent_eval`, `lyzr_get_agent_eval`, `lyzr_create_agent_eval_result`, `lyzr_get_agent_eval_result(_by_agent)` |
| **Artifacts** | `lyzr_create/list/get/update/delete_artifact`, `lyzr_list_artifacts_by_session` |
| **Assets** | `lyzr_upload_asset`, `lyzr_resolve_asset_by_source`, `lyzr_get_asset(_raw)`, `lyzr_delete_asset`, `lyzr_list_assets`, `lyzr_get/update_asset_parsing_status` |
| **Audit logs** | `lyzr_list_org_audit_logs`, `lyzr_list_my_audit_logs`, `lyzr_list_user_audit_logs`, `lyzr_list_resource_audit_logs`, `lyzr_list_session_audit_logs`, `lyzr_get_audit_stats`, `lyzr_get_activity_metrics`, `lyzr_get_dau(_trend)`, `lyzr_get_mau(_trend)`, `lyzr_log_auth_event`, `lyzr_get_audit_log` |
| **Channels** | `lyzr_channel_webhook`, `lyzr_create/list_channel(s)`, `lyzr_list_all_channels`, `lyzr_delete_channel`, `lyzr_add/remove_channel_agent_route` |
| **Contexts** | `lyzr_create/list/get/update/delete_context`, `lyzr_get_contexts_count`, `lyzr_get_context_usage`, `lyzr_get_context_by_name_internal`, `lyzr_get_context_value_internal`, `lyzr_get_multiple_context_values_internal` |
| **Platform admin** (credits/flags/modules) | `lyzr_get/refresh_cached_credits`, `lyzr_get_feature_flags`, `lyzr_*_feature_flag(_admin)`, `lyzr_get_modules`, `lyzr_*_module(_admin)`, `lyzr_get_features` |
| **GitAgent** | `lyzr_git_save/disconnect/validate_config`, `lyzr_git_pull/init_repo/get_status`, `lyzr_git_list_commits`, `lyzr_git_create/list_pr(s)`, `lyzr_git_merge/deploy_branch`, `lyzr_git_update_reviewers`, `lyzr_git_switch/create/list_branch(es)`, `lyzr_git_get_commit_snapshot`, `lyzr_git_restore_commit`, `lyzr_git_list_repo_files`, `lyzr_git_get/save_file_content`, `lyzr_git_get/save/delete/sync_governance` |
| **Human feedback / tool requests / skills** | `lyzr_create_feedback`, `lyzr_create_tool_request`, `lyzr_list_shared_skills`, `lyzr_get_skill_usage` |
| **Org LLM fallbacks** | `lyzr_get/update_org_llm_fallbacks` |
| **Reports** | `lyzr_report_usage_by_agent/user/model/sub_account`, `lyzr_report_get_status`, `lyzr_report_list` |
| **Semantic model** | `lyzr_semantic_model_list/create_documentation_agent(s)`, `lyzr_semantic_model_connect_database`, `lyzr_semantic_model_list_tables`, `lyzr_semantic_model_table_preview`, `lyzr_semantic_model_get_descriptions`, `lyzr_semantic_model_save/remove_documentation(_task)`, `lyzr_semantic_model_get_task_status` |
| **Sessions v3** | `lyzr_session3_create/list/get/update/delete`, `lyzr_session3_list_messages`, `lyzr_session3_branch/list_branches/tree/ancestry` |
| **Sharing** | `lyzr_sharing_create/list/get/update/delete_group`, `lyzr_sharing_share/refresh_group`, `lyzr_sharing_get_resource_groups`, `lyzr_sharing_reconcile_indexes`, `lyzr_sharing_check_access`, `lyzr_sharing_list_accessible` |
| **Tools v3 (core + integrations)** | `lyzr_list/create/get/update/delete_tool`, `lyzr_bulk_delete_tools`, `lyzr_list_all_user_tools`, `lyzr_get_agent_stale_connections`, ACI configs, Composio auth-configs, MCP server management (`lyzr_list/create_mcp_server`, oauth, tools/resources/prompts, execute), tool credentials (static/oauth/test/delete/bulk-delete) |
| **Traces** | `lyzr_list_traces`, `lyzr_get_trace_gantt`, `lyzr_get_trace_summary`, `lyzr_kill_switch_trace`, `lyzr_get_traces_dashboard`, `lyzr_get_trace_details` |
| **Usage alerts / widget stream / user assets** | `lyzr_run_usage_alerts`, `lyzr_widget_stream`, `lyzr_list_user_asset_filters`, `lyzr_list/search_user_assets` |
| **World model** | `lyzr_world_model_list_by_agent/create/get/delete`, personas/test_cases/scenarios CRUD, `lyzr_world_model_create/list_evaluation_run(s)`, `lyzr_world_model_dashboard_overview`, `lyzr_world_model_dashboard_by_world_model` |
| **Agent memory providers** | `lyzr_memprovider_list/get_provider`, AWS AgentCore validate/status/resources/provision/delete, mem0 + supermemory validate/status |
| **Ops** | `lyzr_ops_generate_report`, `lyzr_ops_export_report_csv`, `lyzr_ops_get_dashboard`, `lyzr_ops_get_trace(s)(_run)`, `lyzr_ops_get_grouped_logs`, `lyzr_ops_get_agent_tool_logs` |
| **Providers** (core + credentials) | `lyzr_create/update/delete/get_provider`, `lyzr_create_lyzr_provider`, ACI custom apps/tools, `lyzr_create/get/update/delete_provider_credential`, BigQuery/file-upload credentials |
| **Workflows** | `lyzr_list/create/get/update/delete_workflow`, `lyzr_bulk_delete_workflows`, `lyzr_execute_workflow`, `lyzr_share_workflow`, `lyzr_trigger_workflow_with_file` |

### Extended rag-dev groups (`rag` host)

| Group | Tools |
|---|---|
| **Live sources (extra)** | `lyzr_livesource_ext_sync_permissions`, `lyzr_livesource_ext_browse_sites/drives/children`, `lyzr_livesource_ext_validate_access`, `lyzr_livesource_ext_webhook_get/post` |
| **Knowledge graph (Neo4j)** | `lyzr_kg_ext_train_file(_task)`, `lyzr_kg_ext_train_file_neo4j(_task)`, `lyzr_kg_ext_train_website_neo4j`, `lyzr_kg_ext_train_text_neo4j`, `lyzr_kg_ext_train_text_task_neo4j`, `lyzr_kg_ext_get_graph_neo4j`, `lyzr_kg_ext_deduplicate_neo4j` |
| **Extract / doc content / source auth** | `lyzr_extract`, `lyzr_rag_get_doc_content`, `lyzr_rag_source_auth_status/sharepoint_authorize/aci_handoff` |
| **Parse (file uploads)** | `lyzr_parse_pdf/docx/txt/csv/xlsx/pptx/image` |
| **Train (file uploads)** | `lyzr_kb_train_pdf/docx/txt_file/xlsx/pptx/image` |
| **KB Sync connectors** | `lyzr_kbsync_connector_list/create/get/update/delete`, `lyzr_kbsync_credential_list/create` |
| **KB Sync cc-pairs** | `lyzr_kb_sync_cc_pairs_list/create/get/pause/resume/sync/status`, `lyzr_kb_sync_cc_pairs_list_attempts/get_attempt/cancel_attempt` |
| **KB Sync legacy** [deprecated] | `lyzr_kb_sync_sharepoint_oauth_*`, `lyzr_kb_sync_browse_*`, `lyzr_kb_sync_webhook_*` |

**Resources (11):** `lyzr://agents`, `lyzr://agent/{agentId}`, `lyzr://kb/{ragId}`, `lyzr://kb/{ragId}/documents`, `lyzr://session/{sessionId}`, `lyzr://workflows`, `lyzr://workflow/{flowId}`, `lyzr://a2a-agents`, `lyzr://a2a-agent/{agentId}`, `lyzr://traces`, `lyzr://world-model/{agentId}`.
**Prompts (6):** `draft_support_agent`, `summarize_conversation`, `setup_rag_agent`, `draft_guardrail_policy`, `draft_a2a_agent`, `audit_agent_activity`.

> Skipped: **KB Sync legacy OAuth/browse/webhooks** are implemented but flagged `[deprecated]` per the upstream API. **Skills** (client-side agent skill definitions) have no REST API and remain unwrapped.

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
npm run lint       # biome lint .
npm run format     # biome format --write .
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

## Skills

This repo ships nine **Claude skills** — short guides that teach Claude the right way to use this
server's tools (when to use `lyzr_chat` vs `lyzr_stream_chat`, how KB training works, when a destructive op
needs confirmation, etc). One skill per capability: `lyzr-agents`, `lyzr-knowledge-base`,
`lyzr-knowledge-graph`, `lyzr-memory`, `lyzr-scheduler`, `lyzr-guardrails`, `lyzr-credentials`,
`lyzr-file-processing`, `lyzr-kb-sync`.

There are two ways to install them, same as Supabase documents for its own `agent-skills` repo.

### Option A: the community `skills` CLI (repo-agnostic)

Install all skills using the [`skills`](https://www.npmjs.com/package/skills) CLI, pointed at this
GitHub repo — no dependency on this package being published to npm, just a `git` checkout of
`NeuralgoLyzr/lyzr-mcp`:

```bash
npx skills add NeuralgoLyzr/lyzr-mcp
```

Install a specific skill:

```bash
npx skills add NeuralgoLyzr/lyzr-mcp --skill lyzr-agents
```

This works because `skills` discovers any `skills/<name>/SKILL.md` folder with `name`/`description`
frontmatter in a repo — the exact layout under [`skills/`](skills/) here — and copies the selected
skill(s) into `.claude/skills/` (or the equivalent path for whichever coding agent you use).

### Option B: the bundled `lyzr-mcp-skills` installer (zero GitHub dependency)

If you'd rather not depend on cloning this repo — e.g. air-gapped environments, or you just want the
skills bundled with the npm package — use the installer shipped alongside this server:

```bash
npx lyzr-mcp-skills          # interactive checklist
npx lyzr-mcp-skills all      # install everything
npx lyzr-mcp-skills lyzr-agents lyzr-knowledge-base   # install specific ones
```

Both install to `.claude/skills/<name>/SKILL.md` in your current directory.

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
    <28 more agent-host clients: a2a.ts, workflows.ts, world-model-*.ts, git-agent.ts, ...>
    <8 more rag-host clients: kb-sync-*.ts, rag-parse-files.ts, rag-train-files.ts, ...>
  server/             # createServer() factory, logging, roots
  tools/              # one file per tool-set + index.ts registry (423 tools total)
  resources/          # agents/KBs/sessions/workflows/A2A/traces/world-models as resources + subscriptions
  prompts/            # reusable prompt templates
  cli/                # install-skills.ts — the `lyzr-mcp-skills` installer
  transports/         # stdio, sse (deprecated), streamableHttp
__tests__/            # vitest unit tests (one file per lyzr/*.ts client)
skills/               # end-user Claude skills, installed via `npx lyzr-mcp-skills`
.claude/skills/       # contributor-facing skill (lyzr-api-endpoint) for adding new endpoints
```
