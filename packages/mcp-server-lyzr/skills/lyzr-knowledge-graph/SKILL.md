---
name: lyzr-knowledge-graph
description: >-
  Load this skill before building or querying a knowledge graph (entities + relationships, not chunked retrieval text) from text, a website, or a file via the lyzr MCP server — including the Neo4j-backed variants. Covers the default-store vs Neo4j-store distinction, sync vs async/task training, deduplicating entities after repeated training runs, and not conflating this with the Knowledge Base (RAG) tools.
license: MIT
metadata:
  author: lyzr-mcp
  version: "0.1.0"
  organization: Lyzr
---

# Lyzr Knowledge Graph (v4)

Tools: `lyzr_kg_train_text`, `lyzr_kg_train_text_task`, `lyzr_kg_train_website`, `lyzr_kg_get_graph`,
`lyzr_kg_deduplicate`, `lyzr_kg_task_status`, plus the file-based/Neo4j-backed variants:
`lyzr_kg_ext_train_file(_task)`, `lyzr_kg_ext_train_website_neo4j`, `lyzr_kg_ext_train_text_neo4j`,
`lyzr_kg_ext_train_text_task_neo4j`, `lyzr_kg_ext_train_file_neo4j(_task)`, `lyzr_kg_ext_get_graph_neo4j`,
`lyzr_kg_ext_deduplicate_neo4j`.

This is a **separate system from the Knowledge Base / RAG tools** — a KG stores entities + relationships, not
chunked text for retrieval. Don't conflate `lyzr_kg_*` with `lyzr_kb_*`.

## Workflow

1. Train: `lyzr_kg_train_text` (small/sync) or `lyzr_kg_train_text_task` (large text, async — poll with
   `lyzr_kg_task_status`) or `lyzr_kg_train_website` for a URL.
2. Fetch the resulting graph with `lyzr_kg_get_graph`.
3. If entities look duplicated after multiple training runs (e.g. "Acme Corp" and "Acme Corporation" as
   separate nodes), run `lyzr_kg_deduplicate` to merge them — mention this proactively if you notice it in a
   fetched graph.

## Neo4j-backed graphs

The `lyzr_kg_ext_*` tools store the graph in Neo4j instead of the default store, and also add a file-upload
training path (`lyzr_kg_ext_train_file`, base64-encoded content — same pattern as `lyzr-file-processing`).
Use the `_neo4j` variants only when the user specifically wants a Neo4j-backed graph (e.g. to query it
separately with Cypher); otherwise the plain `lyzr_kg_*` tools are the simpler default.

## Gotchas

- Website training can take a while for large sites; if you used the async task variant, poll
  `lyzr_kg_task_status` (or `lyzr_kg_ext_get_graph_neo4j`'s equivalent flow), don't assume completion.
- A knowledge graph is not directly attachable to an agent through this MCP server — that wiring happens in
  Lyzr Studio.
- Don't mix the default-store tools and the `_neo4j` tools for the same graph — they're different backends.
