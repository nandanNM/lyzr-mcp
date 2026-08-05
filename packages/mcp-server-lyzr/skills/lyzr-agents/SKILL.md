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

## Gotchas

- Look up an agent by name with `lyzr_agent_id_by_name` before assuming you need to create a new one.
- Other agent features (KB attachment, RAI policy, etc.) besides tools are **not** settable through this
  MCP server — they're configured in Lyzr Studio's UI. Say so if asked.
