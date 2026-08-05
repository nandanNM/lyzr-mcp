---
name: lyzr-memory
description: Use whenever the user wants to store, search, or manage long-term Cognis memories via the lyzr MCP server.
---

# Lyzr Cognis Memory

Tools: `lyzr_memory_add`, `lyzr_memory_search`, `lyzr_memory_list`, `lyzr_memory_get`, `lyzr_memory_update`,
`lyzr_memory_delete`.

Cognis memory stores durable facts extracted from conversations, scoped by an identifier the caller controls
(`owner_id`, `user_id`, `agent_id`, or `session_id` — at least one is required by `lyzr_memory_add`).

## Workflow

- **Add**: `lyzr_memory_add(messages, { owner_id })` — pass the conversation turns you want distilled into
  memory, not a manual summary; the API does the extraction.
- **Search**: `lyzr_memory_search(query, { owner_id })` for semantic recall — use this instead of
  `lyzr_memory_list` when you have a specific question the memory might answer.
- **List**: `lyzr_memory_list({ owner_id })` for a full dump — use for auditing/showing the user everything
  stored under an identifier.
- **Update/delete**: target a specific memory by id (from a prior list/search result) — never guess an id.

## Gotchas

- This is a different system from the Knowledge Graph (`lyzr_kg_*`) — memory is per-user/session facts, KG is
  a general entity graph. Don't mix them up when the user says "remember this."
- Always scope by the narrowest identifier that fits the request — a bare `owner_id` shared across all your
  users will leak one user's facts into another's search results.
