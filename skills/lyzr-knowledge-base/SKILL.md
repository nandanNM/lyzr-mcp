---
name: lyzr-knowledge-base
description: Use whenever the user wants to create a RAG knowledge base, train it on text/websites/documents, query it, or manage its documents via the lyzr MCP server.
---

# Lyzr Knowledge Base (RAG)

Tools: `lyzr_kb_create`, `lyzr_kb_get`, `lyzr_kb_list`, `lyzr_kb_update`, `lyzr_kb_delete`, `lyzr_kb_bulk_delete`,
`lyzr_kb_reset`, `lyzr_kb_query`, `lyzr_kb_list_documents`, `lyzr_kb_train_text`, `lyzr_kb_train_website`,
`lyzr_kb_train_documents`, `lyzr_kb_delete_docs`, `lyzr_kb_delete_docs_by_filter`, `lyzr_kb_update_docs_metadata`,
`lyzr_parse_text`, `lyzr_parse_website`, `lyzr_parse_website_apify`, `lyzr_classify`.

## Workflow

1. **Create** the KB: `lyzr_kb_create({ name })`. `name` must be lowercase — the tool validates this and
   throws a clear error if not; lowercase it yourself first rather than round-tripping an error.
2. **Train** it — pick the matching tool for the source:
   - `lyzr_kb_train_text` for raw text/markdown you already have.
   - `lyzr_kb_train_website` for a URL to crawl.
   - `lyzr_kb_train_documents` for already-uploaded document references.
   Training is async on the Lyzr side — it can take a while for large sites; don't assume `lyzr_kb_query`
   will see new content instantly after training returns.
3. **Query**: `lyzr_kb_query(kb_id, query, top_k)`. Default `top_k` to 5 unless the user wants more/less context.

## Managing documents

Use `lyzr_kb_list_documents` before deleting anything, so you can show the user what's actually indexed.
`lyzr_kb_delete_docs_by_filter` is a bulk destructive op — confirm the filter with the user before running it,
since a too-broad filter can wipe more than intended.

## Parsing without a KB

If the user just wants text extracted (not stored/queried), use `lyzr_parse_text` / `lyzr_parse_website` /
`lyzr_parse_website_apify` directly — no KB needed. `lyzr_classify` runs a standalone classification call,
also independent of any KB.

## Not supported here

Multipart file uploads (PDF/DOCX/CSV/XLSX/PPTX binary upload) aren't exposed as MCP tools — only
`lyzr_kb_train_documents` (already-hosted document references). Point the user to Lyzr Studio's UI for raw
file upload.
