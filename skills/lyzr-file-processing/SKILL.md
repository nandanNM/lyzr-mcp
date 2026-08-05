---
name: lyzr-file-processing
description: >-
  Load this skill before parsing or training a knowledge base from an actual binary file (PDF, DOCX, TXT, CSV, XLSX, PPTX, image) via the lyzr MCP server, or before extracting structured fields from a document. Covers the base64-encode-the-file-yourself pattern every one of these tools requires, parse-vs-train tool selection, and matching the tool to the file's real type rather than its extension.
license: MIT
metadata:
  author: lyzr-mcp
  version: "0.1.0"
  organization: Lyzr
---

# Lyzr File Processing (parse / train / extract)

Tools: `lyzr_parse_pdf`, `lyzr_parse_docx`, `lyzr_parse_txt`, `lyzr_parse_csv`, `lyzr_parse_xlsx`,
`lyzr_parse_pptx`, `lyzr_parse_image`, `lyzr_kb_train_pdf`, `lyzr_kb_train_docx`, `lyzr_kb_train_txt_file`,
`lyzr_kb_train_xlsx`, `lyzr_kb_train_pptx`, `lyzr_kb_train_image`, `lyzr_extract`.

These are the **binary-file** counterparts to `lyzr-knowledge-base`'s text/website tools — use this skill
whenever the user has an actual file (not a URL or raw text) to parse or train into a KB.

## The base64 pattern

Every one of these tools takes the file as **base64-encoded content** plus a filename (e.g.
`file_content_base64` + `filename`), because MCP tool arguments are JSON, not multipart. You are responsible
for base64-encoding the file's bytes before calling the tool. If the user gave you a local file path, read
it, encode it, and pass the result — don't ask the user to base64-encode it themselves.

## Parse vs. train

- **Parse** (`lyzr_parse_*`) extracts text from the file and returns it to you — use when the user wants the
  content itself (to read, summarize, or process further), no KB involved.
- **Train** (`lyzr_kb_train_*`) ingests the file directly into an existing knowledge base (needs a `rag_id`
  from `lyzr_kb_create` / `lyzr_kb_list` first) — use when the goal is "make this file queryable."

## Extract

`lyzr_extract` pulls structured data out of a document (e.g. fields from an invoice or form) rather than
plain text — reach for this instead of `lyzr_parse_*` when the user wants specific fields, not a full-text
dump.

## Gotchas

- Large files make for large base64 payloads — if a file is huge, mention that to the user rather than
  silently sending a multi-MB tool call.
- Match the tool to the actual file type — `lyzr_parse_docx` will not correctly handle a `.pdf` renamed to
  `.docx`; if unsure of the real type, ask or inspect the file's magic bytes.
