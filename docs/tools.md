# Tool Reference

All 34 tools, 2 resources, and 2 prompts exposed by the Lyzr MCP server. Every tool authenticates with the caller's own Lyzr API key.

**Legend:** 🔴 destructive · 👁️ read-only · ⏱️ long-running/streaming

- [Agents](#agents)
- [Inference (chat / stream / tasks)](#inference)
- [Knowledge Base (RAG)](#knowledge-base-rag)
- [Cognis memory (knowledge graph)](#cognis-memory)
- [Scheduler](#scheduler)
- [RAI guardrails](#rai-guardrails)
- [Resources](#resources)
- [Prompts](#prompts)

---

## Agents

### `lyzr_create_agent`
Create a new agent. Returns the new `agent_id`.

| Param | Type | Req | Default | Notes |
|---|---|---|---|---|
| `name` | string | ✓ | | Agent name |
| `provider` | string | | `openai` | One of: openai, anthropic, google/gemini, groq, perplexity, aws-bedrock |
| `model` | string | | `gpt-4o-mini` | e.g. gpt-4o, claude-sonnet-4-5 |
| `role` | string | ✓ | | The agent's role/persona |
| `goal` | string | ✓ | | What the agent should accomplish |
| `instructions` | string | ✓ | | System instructions |
| `temperature` | number (0–2) | | 0.7 | |
| `description` | string | | | |

> `provider`+`model` resolve to the API's `provider_id`/`model`/`llm_credential_id`.

### `lyzr_update_agent`
Update selected fields; unspecified fields are preserved (fetch → merge → PUT).

| Param | Type | Req | Notes |
|---|---|---|---|
| `agent_id` | string | ✓ | |
| `name`, `role`, `goal`, `instructions`, `description` | string | | any subset |
| `temperature` | number (0–2) | | |
| `tools` | string[] | | Tool catalog id or provider_id; replaces the existing tool list. `tool_source`/`action_names` are resolved automatically unless `tool_configs` is also passed. |
| `tool_configs` | object[] | | Explicit per-tool config overrides; skips auto-resolution. |

Response echoes the resolved `tools`/`tool_configs` when `tools` was set, so callers can confirm what actually got attached without a follow-up `lyzr_get_agent`.

### `lyzr_delete_agent` 🔴
Permanently delete an agent. — `{ agent_id: string }`

### `lyzr_list_agents` 👁️
List all agents on the API key. — no arguments.

### `lyzr_get_agent` 👁️
Fetch one agent's full config. — `{ agent_id: string }`

---

## Inference

### `lyzr_chat`
Send a message to an agent, get the full reply.

| Param | Type | Req | Default | Notes |
|---|---|---|---|---|
| `agent_id` | string | ✓ | | |
| `message` | string | ✓ | | |
| `session_id` | string | | `mcp-<requestId>` | conversation continuity |
| `user_id` | string | | `default_user` | end-user identifier |

### `lyzr_stream_chat` ⏱️
Same as `lyzr_chat` but consumes the streaming endpoint; emits an MCP **progress notification per chunk** (when the client passes a `progressToken`) and returns the full accumulated text. Same params as `lyzr_chat`.

### `lyzr_start_task` ⏱️
Submit a long-running task; returns a `task_id` immediately (non-blocking). Same params as `lyzr_chat`.

### `lyzr_get_task_status` 👁️
Poll a task's status/result. — `{ task_id: string }`

---

## Knowledge Base (RAG)

### `lyzr_kb_create`
Create a RAG knowledge base.

| Param | Type | Req | Default | Notes |
|---|---|---|---|---|
| `name` | string | ✓ | | **lowercase letters, numbers, underscores only** |
| `vector_store` | string | | `qdrant` | qdrant, weaviate, pg_vector, milvus, neptune |
| `embedding_model` | string | | `text-embedding-3-large` | |
| `llm_model` | string | | `gpt-4o` | |
| `description` | string | | | |

### `lyzr_kb_get` 👁️
Fetch a KB. — `{ kb_id: string }`

### `lyzr_kb_list` 👁️
List a user's KBs. — `{ user_id: string }` *(needs your real Lyzr user_id)*

### `lyzr_kb_train_text`
Ingest text chunks. — `{ rag_id: string, texts: string[] }`

### `lyzr_kb_train_website`
Crawl + ingest URLs. — `{ rag_id: string, urls: string[] }`

### `lyzr_kb_query` 👁️
Retrieve relevant chunks. — `{ rag_id: string, query: string, top_k?: number }`

### `lyzr_kb_list_documents` 👁️
List indexed documents. — `{ rag_id: string }`

### `lyzr_kb_delete` 🔴
Delete a KB. — `{ kb_id: string }`

---

## Cognis memory

> ⚠️ These require the Cognis memory API to be enabled for your account (currently returns `403` on some keys).
> At least one of `owner_id` / `agent_id` / `session_id` is required for add/search/list.

### `lyzr_memory_add`
Store messages. — `{ messages: {role,content}[], owner_id?, agent_id?, session_id? }`

### `lyzr_memory_search` 👁️
Semantic search. — `{ query: string, owner_id?, agent_id?, session_id?, limit?, cross_session? }`

### `lyzr_memory_list` 👁️
List memories. — `{ owner_id?, agent_id?, session_id?, limit?, offset?, cross_session? }`

### `lyzr_memory_get` 👁️
Get one record. — `{ memory_id: string, owner_id? }`

### `lyzr_memory_update`
Update content. — `{ memory_id: string, content?, owner_id? }`

### `lyzr_memory_delete` 🔴
Delete a record. — `{ memory_id: string, owner_id? }`

---

## Scheduler

### `lyzr_schedule_create`
Schedule an agent to run on a cron.

| Param | Type | Req | Default | Notes |
|---|---|---|---|---|
| `user_id` | string | ✓ | | |
| `agent_id` | string | ✓ | | |
| `cron_expression` | string | ✓ | | 5-field cron, e.g. `0 9 * * 1` |
| `message` | string | | `""` | sent to the agent each run |
| `timezone` | string | | `UTC` | IANA tz |
| `max_retries` | number (0–5) | | 3 | |
| `retry_delay` | number (10–3600) | | 60 | seconds |

### `lyzr_schedule_list` 👁️
List schedules. — `{ user_id? }`

### `lyzr_schedule_get` 👁️
Fetch a schedule. — `{ schedule_id: string }`

### `lyzr_schedule_pause` / `lyzr_schedule_resume`
Pause / resume a schedule. — `{ schedule_id: string }`

### `lyzr_schedule_trigger`
Run a schedule immediately (out of band). — `{ schedule_id: string }`

### `lyzr_schedule_delete` 🔴
Delete a schedule. — `{ schedule_id: string }`

---

## RAI guardrails

### `lyzr_rai_create_policy`
Create a Responsible-AI guardrail policy.

| Param | Type | Req | Default | Notes |
|---|---|---|---|---|
| `name` | string | ✓ | | |
| `description` | string | | | |
| `toxicity_threshold` | number (0–1) | | 1.0 | `< 1.0` enables toxicity check at that threshold; `1.0` = off |
| `prompt_injection` | boolean | | false | |
| `nsfw_check` | boolean | | false | |
| `nsfw_threshold` | number (0–1) | | 0.5 | |
| `banned_topics` | string[] | | | topics to block |

### `lyzr_rai_list_policies` 👁️
List policies. — no arguments.

### `lyzr_rai_get_policy` 👁️
Fetch a policy. — `{ policy_id: string }`

### `lyzr_rai_delete_policy` 🔴
Delete a policy. — `{ policy_id: string }`

---

## Resources

| URI | Description |
|---|---|
| `lyzr://agents` | JSON list of all agents on your key |
| `lyzr://agent/{agentId}` | JSON details of one agent (templated) |

## Prompts

| Name | Args | Purpose |
|---|---|---|
| `draft_support_agent` | `product` | Draft name/role/goal/instructions for a support agent, ready for `lyzr_create_agent` |
| `summarize_conversation` | `agent_id` | Summarize a conversation with an agent into key points + action items |

---

## Calling tools

**In a Claude session** (natural language — the model picks the tool):
> "Create a Lyzr support agent for billing questions, then chat with it: 'my invoice is wrong'."

**Raw JSON-RPC over HTTP** (for testing):
```bash
# 1) initialize → capture the mcp-session-id response header
curl -sS -D - -X POST https://your-host/mcp \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -H "x-api-key: YOUR_KEY" \
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize",
       "params":{"protocolVersion":"2025-06-18","capabilities":{},
       "clientInfo":{"name":"curl","version":"0"}}}'

# 2) call a tool (reuse the session id from step 1)
curl -sS -X POST https://your-host/mcp \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -H "x-api-key: YOUR_KEY" \
  -H "mcp-session-id: <SID>" \
  -d '{"jsonrpc":"2.0","id":2,"method":"tools/call",
       "params":{"name":"lyzr_list_agents","arguments":{}}}'
```

**MCP Inspector** (GUI, no client needed):
```bash
LYZR_API_KEY=YOUR_KEY npx @modelcontextprotocol/inspector node build/index.js stdio
```
