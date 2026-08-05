---
name: lyzr-scheduler
description: >-
  Load this skill before creating, listing, pausing, resuming, triggering, or deleting a cron schedule that runs a Lyzr agent automatically via the lyzr MCP server. Covers cron_expression/timezone/retry defaults, using an immediate trigger to test before leaving a schedule unattended, and preferring pause/resume over delete-and-recreate.
license: MIT
metadata:
  author: lyzr-mcp
  version: "0.1.0"
  organization: Lyzr
---

# Lyzr Scheduler

Tools: `lyzr_schedule_create`, `lyzr_schedule_list`, `lyzr_schedule_get`, `lyzr_schedule_pause`,
`lyzr_schedule_resume`, `lyzr_schedule_trigger`, `lyzr_schedule_delete`.

## Workflow

1. Confirm the **agent_id**, the **cron_expression**, and the message the agent should run with each time.
   `lyzr_schedule_create` defaults `timezone` to UTC and `max_retries`/`retry_delay` to sane values — only
   override if the user specifies a timezone or retry policy.
2. Use `lyzr_schedule_trigger` to run a schedule immediately (for testing) without waiting for the next cron
   tick — good for "does this actually work" verification before leaving it running unattended.
3. `lyzr_schedule_pause` / `lyzr_schedule_resume` for temporary stops — prefer these over delete-and-recreate
   when the user just wants to pause something.

## Gotchas

- Deleting a schedule is irreversible — confirm before calling `lyzr_schedule_delete`, same as any destructive
  action.
- A bad cron expression fails at creation with a validation error from the API — don't hand-validate it
  yourself, just surface the API's error if it rejects one.
