---
name: lyzr-kb-sync
description: Use whenever the user wants to connect a knowledge base to an external system (SharePoint, Google Drive, etc) for continuous syncing via the lyzr MCP server's KB Sync connectors.
---

# Lyzr KB Sync (connectors)

Tools: `lyzr_kbsync_connector_list/create/get/update/delete`, `lyzr_kbsync_credential_list/create`,
`lyzr_kb_sync_cc_pairs_list/create/get/pause/resume/sync/status/list_attempts/get_attempt/cancel_attempt`,
plus legacy/deprecated: `lyzr_kb_sync_sharepoint_oauth_*`, `lyzr_kb_sync_browse_*`, `lyzr_kb_sync_webhook_*`.

This is a **different, heavier-weight system than `lyzr-credentials`'s Live Sources** — KB Sync manages
long-lived **connectors** (a source system + auth) and **cc-pairs** (a connector wired to a specific KB), with
its own sync-attempt history. Use this when the user describes an ongoing enterprise data-source integration
(SharePoint, a shared drive) rather than a one-off crawl.

## The three-layer model

1. **Connector** (`lyzr_kbsync_connector_*`) — the source system config (e.g. "our SharePoint site").
2. **Credential** (`lyzr_kbsync_credential_*`) — auth for that connector. Don't confuse with
   `lyzr_credential_*` from `lyzr-credentials` — that's a separate, general-purpose credential store.
3. **CC-pair** (`lyzr_kb_sync_cc_pairs_*`) — a connector+credential bound to a specific KB; this is the thing
   you actually pause/resume/sync and whose attempt history you check.

## Workflow

1. Create or find the connector and credential.
2. Create a cc-pair linking them to the target KB.
3. Use `lyzr_kb_sync_cc_pairs_sync` to trigger an immediate sync, or `lyzr_kb_sync_cc_pairs_status` /
   `list_attempts` to check on an already-scheduled one — don't assume a sync completed just because the
   trigger call returned.
4. `pause`/`resume` for temporary stops instead of deleting the connector.

## Gotchas

- The `lyzr_kb_sync_sharepoint_oauth_*`, `lyzr_kb_sync_browse_*`, and `lyzr_kb_sync_webhook_*` tools are
  marked **deprecated** by the underlying API — prefer the connector/cc-pair flow above; only reach for these
  if the user is specifically working with an existing legacy integration.
- Connector and cc-pair ids are integers, not strings — don't quote them unnecessarily, but do accept
  whatever the list/create response actually returns rather than assuming a format.
