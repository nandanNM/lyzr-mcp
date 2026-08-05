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
- Attaching a policy to an agent happens in Lyzr Studio, not through this MCP server — say so if asked.
- Deleting a policy is irreversible and may affect any agent currently using it — confirm before calling
  `lyzr_rai_delete_policy`.
