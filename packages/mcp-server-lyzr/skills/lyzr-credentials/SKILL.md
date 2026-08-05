---
name: lyzr-credentials
description: >-
  Load this skill before creating, listing, updating, or deleting a stored API credential, or before adding/syncing/pausing/resuming a live source that keeps a knowledge base continuously synced to an external system, via the lyzr MCP server. Covers not echoing raw secrets back into chat, and the three-layer live-source model (kb_id + credential_id + sync lifecycle).
license: MIT
metadata:
  author: lyzr-mcp
  version: "0.1.0"
  organization: Lyzr
---

# Lyzr Credentials & Live Sources

Tools: `lyzr_credential_create`, `lyzr_credential_list`, `lyzr_credential_get`, `lyzr_credential_update`,
`lyzr_credential_delete`, `lyzr_livesource_add`, `lyzr_livesource_list`, `lyzr_livesource_get`,
`lyzr_livesource_pause`, `lyzr_livesource_resume`, `lyzr_livesource_repoint`, `lyzr_livesource_remove`,
`lyzr_livesource_sync`, `lyzr_livesource_list_credentials`.

## Credentials

These store secrets Lyzr agents/tools use server-side (e.g. a database connection, a third-party API key) —
never ask the user to paste a raw secret into chat if you can avoid it; if you must, treat it as sensitive and
don't echo it back in your response.

## Live sources

A live source keeps a knowledge base automatically synced to an external system (using a stored credential).

- `lyzr_livesource_add` needs a `kb_id` and a `credential_id` (list with `lyzr_livesource_list_credentials`
  if the user doesn't already have one).
- `lyzr_livesource_sync` triggers an immediate re-sync instead of waiting for the next scheduled one.
- `lyzr_livesource_pause` / `resume` for temporary stops; `lyzr_livesource_repoint` to swap which
  KB/credential it targets without recreating it; `lyzr_livesource_remove` is irreversible — confirm first.
