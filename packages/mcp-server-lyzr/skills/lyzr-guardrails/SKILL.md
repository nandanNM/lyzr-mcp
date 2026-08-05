---
name: lyzr-guardrails
description: >-
  Load this skill before creating, listing, fetching, or deleting a Responsible AI (RAI) guardrail policy via the lyzr MCP server. Covers passing flat inputs (toxicity_threshold, banned_topics, etc.) rather than constructing the nested API shape by hand, checking existing policies before creating a duplicate, and confirming before any deletion since it may affect agents currently using the policy.
license: MIT
metadata:
  author: lyzr-mcp
  version: "0.1.0"
  organization: Lyzr
---

# Lyzr RAI Guardrails

Tools: `lyzr_rai_create_policy`, `lyzr_rai_list_policies`, `lyzr_rai_get_policy`, `lyzr_rai_delete_policy`.

A policy bundles checks (toxicity threshold, banned topics, NSFW validation, etc). `lyzr_rai_create_policy`
builds the full nested structure from flat inputs (e.g. `toxicity_threshold`, `banned_topics: [...]`) — pass
flat fields, don't try to construct the nested API shape yourself.

## Workflow

- List existing policies first (`lyzr_rai_list_policies`) before creating a new one — the user may already
  have a suitable policy to reuse or tweak rather than duplicate.
- Attaching a policy to an agent is done through `lyzr-agents`' `create_agent`/`update_agent`: create the
  policy here first to get a `policy_id`, then attach `{type: "RAI", config: {policy_id, policy_name, endpoint}}`
  as an agent feature (`config.endpoint` is ignored server-side — harmless to include, just pointless).
- Deleting a policy is irreversible and may affect any agent currently using it — confirm before calling
  `lyzr_rai_delete_policy`.

## Gotchas

- **NSFW checker (`nsfw_check`) false-positives**: confirmed live at ~90% confidence on completely benign
  short text like "Hello, are you working?" — this isn't a one-off. Treat `nsfw_check: true` as noisy at the
  confidence thresholds tested (0.7), not production-ready as-is; warn the user if they enable it.
- **RAI + UQLM_LLM_JUDGE together breaks chat**: if an agent has both an RAI feature and an `UQLM_LLM_JUDGE`
  feature attached, every chat message fails with `HTTP 400 {"detail": "Expecting value: line 1 column 2 (char 1)"}`
  (a Python `json.loads` crash), even though each works fine alone. Root cause: RAI's guard is wired onto the
  agent's LLM client unconditionally, including UQLM_LLM_JUDGE's internal response-rewrite call, which reuses
  that same client — the guard fires a second, nested time on the rewrite and crashes downstream. Feature
  `priority` does NOT affect this (execution order is hardcoded, priority is never read for sequencing) — no
  config-level workaround exists. Don't combine RAI and UQLM_LLM_JUDGE on the same agent until fixed backend-side.
