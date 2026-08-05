---
name: lyzr-agents
description: >-
  Load this skill before creating, configuring, updating, deleting, or chatting with a Lyzr agent via the lyzr MCP server, or before starting/polling a long-running agent task. Covers: choosing a provider/model, generating and reusing session_id across a conversation, when to use lyzr_chat vs lyzr_stream_chat vs lyzr_start_task, and looking up an existing agent by name before creating a duplicate.
license: MIT
metadata:
  author: lyzr-mcp
  version: "0.1.0"
  organization: Lyzr
---

# Lyzr Agents

Tools: `lyzr_create_agent`, `lyzr_update_agent`, `lyzr_delete_agent`, `lyzr_list_agents`, `lyzr_get_agent`,
`lyzr_chat`, `lyzr_stream_chat`, `lyzr_start_task`, `lyzr_get_task_status`, `lyzr_agent_id_by_name`,
`lyzr_agent_sessions`, `lyzr_agent_published_sessions`, `lyzr_agent_create_single_task`, `lyzr_agent_update_single_task`.

## Creating an agent

Always ask for (or infer from context): **name**, **role**, **goal**, **instructions**. `provider`/`model`
default to `openai`/`gpt-4o-mini` — only ask if the user cares. Valid providers: openai, anthropic, google,
groq, perplexity, aws-bedrock.

```
lyzr_create_agent({ name, role, goal, instructions, provider, model })
→ returns agent_id — save it, you need it for every other call
```

## Chatting

`lyzr_chat` needs an `agent_id` **and** a `session_id`. Generate a session_id yourself (e.g. a uuid or
`"<agent_id>-default"`) if the user doesn't have one — Lyzr creates the session lazily on first use. Reuse the
same `session_id` across a conversation to keep memory/context; use a new one to start fresh.

Use `lyzr_stream_chat` only when the host surface can render incremental output; otherwise prefer `lyzr_chat`.

## Long-running work

If a task may exceed a normal chat turn (large document processing, multi-step workflows), use
`lyzr_start_task` then poll `lyzr_get_task_status` until `status` is terminal — don't poll tighter than a
few seconds apart.

## Updating / deleting

`lyzr_update_agent` only needs the fields that change — it merges with the existing config server-side.
`lyzr_delete_agent` is irreversible: confirm with the user before calling it, same as any destructive action.

## Attaching tools

`lyzr_update_agent` accepts a `tools` array of tool ids (either the catalog id
or the tool's provider_id — from `lyzr_get_all_tools`/`lyzr_list_all_user_tools`)
and now correctly resolves tool identity, `tool_source`, and `action_names`
automatically, so a bare id attaches a fully working, callable tool. The
response echoes back the resolved `tools`/`tool_configs` that were actually
persisted — read that response rather than assuming success from a generic
`{"message": "updated"}` ack, since it's the only way to confirm what was
really attached without a separate `lyzr_get_agent` call.

## Attaching features (create-prerequisite-then-reference)

Many `features[]` entries on `lyzr_create_agent`/`lyzr_update_agent` reference an external resource that must
be created **first**, via its own tool, then wired in by id. Don't try to inline the resource's full config
into the feature — create it, get the id, reference it.

- **Skills**: `lyzr_skill_create` (or `lyzr_skill_import_github` / `lyzr_skill_register_global`) first → skill
  id → set it in `skills_catalog: [skill_id, ...]`.
- **RAI**: `lyzr_rai_create_policy` first → `policy_id` → `{type: "RAI", config: {policy_id, policy_name, endpoint}}`.
  `config.endpoint` is ignored server-side (hardcoded) — harmless to include, just pointless.
- **Knowledge Base**: `lyzr_kb_create` (+ train it) first → `rag_id` → then attach one of:
  - single-KB "basic": `{type: "KNOWLEDGE_BASE", config: {lyzr_rag: {base_url, rag_id, rag_name, params: {top_k, retrieval_type, score_threshold}}, agentic_rag: []}}`
  - "one_shot" (planner picks among multiple KBs): `{lyzr_rag: {}, oneshot_rag: [{rag_id, name, description, top_k, retrieval_type, score_threshold}, ...], planner_model, merge_top_k}`
  - "agentic" (ReAct loop over multiple KBs): `{lyzr_rag: {}, agentic_rag: [{base_url, rag_id, rag_name, params: {top_k, retrieval_type, score_threshold}}, ...]}`
  - server-side dispatch order: `oneshot_rag` checked first, then `agentic_rag`, then `lyzr_rag`.
  - see `lyzr-knowledge-base`'s SKILL.md for a `retrieval_type` gotcha (`"mmr"` is unreliable).
- **Memory / Knowledge Graph (Cognis)**: no prerequisite resource for the shared Cognis provider — attach
  directly: `{type: "MEMORY", config: {provider: "cognis", lyzr_memory: {provider_type: "cognis", params: {cross_session: true, instructions: "..."}}}}`.
- **Context**: `lyzr_create_context` first → `context_id` → `{type: "CONTEXT", config: {context_id, context_name}}`.
- **Data Query** (text-to-SQL over a database): needs a KB created with `semantic_data_model: true` (via
  `lyzr_kb_create`) **then** connected to a real database via `lyzr_semantic_model_connect_database` **before**
  attaching `{type: "DATA_QUERY", config: {docs_rag_id, rag_url, max_tries}}`. **Warning:** pointing this at a
  plain vector-retrieval KB (not `semantic_data_model`) crashes EVERY message with a 500, even "hello" —
  it's a "Pre" module that runs unconditionally and can't resolve a database. Confirmed live; not a rare edge case.
- **Fairness & Bias / Reflection**: shown as two separate toggles in Studio but both map to ONE feature type,
  `SRS`: `{type: "SRS", config: {max_tries: 1, modules: {reflection: bool, bias: bool}}}`. Both `max_tries`
  and `modules` are **required with no server-side defaults** — omitting either crashes agent init on every
  message. Confirmed working with both fields supplied; shows up in traces as `reflection_report_completed`
  and "Bias process started" events.
- **Groundedness**: `{type: "GROUNDEDNESS", config: {facts: string[]}}` — this is **not** a knowledge-injection
  mechanism; it's a post-response quality check that scores whether the answer aligns with the given facts
  (visible in traces as a `groundedness` span with a `groundedness_evaluation` event, 0.0-1.0 score, and a
  misalignments list). Empty/missing `facts` just makes every check trivially pass (score 1.0) — not an error.
- **RAI + UQLM_LLM_JUDGE together**: attaching both features on the same agent breaks every chat message with
  `HTTP 400 {"detail": "Expecting value: line 1 column 2 (char 1)"}`, even though each works fine alone.
  Confirmed real interaction bug — don't combine them until it's fixed backend-side.
- **Vector-store/database credentials**: most `lyzr_kb_create` vector_store aliases (qdrant/weaviate/
  pg_vector/milvus) resolve to working shared `lyzr_*` credentials, but `neptune`'s shared credential
  (`lyzr_neptune`) does not exist server-side — confirmed via a real 500 (`Processing Error: 'credentials'`)
  when training a Neptune-backed KB. Workaround: create your own credential first via
  `lyzr_create_provider_credential` (same fields Studio's Data Connectors page uses — e.g. Neptune needs
  `{graph_id, region, aws_role_arn, aws_session_name}`), then pass its id as `vector_db_credential_id` to
  `lyzr_kb_create`. If a credential already exists from Studio's Data Connectors UI, look it up by name with
  `lyzr_list_provider_credentials_by_type`/`lyzr_list_provider_credentials_by_user` instead of recreating it.

## Gotchas

- Look up an agent by name with `lyzr_agent_id_by_name` before assuming you need to create a new one.
- Most agent features **are** settable through this MCP server via `features[]` on `create_agent`/
  `update_agent` — see "Attaching features" above for the create-prerequisite-then-reference pattern each one
  needs.
