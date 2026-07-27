---
name: codex-review
version: 1.0.0
description: Second-opinion code review — runs the Codex CLI's non-interactive review of the current branch vs main in a subagent and feeds the findings back as actionable feedback.
triggers:
  - codex review
  - run codex review
  - second opinion on this branch
allowed-tools:
  - Agent
  - Bash
  - Read
---

# codex-review

Run OpenAI Codex's code review over this branch's diff against `main` (or a
base the user names) and bring the findings back into the conversation as
feedback to address. Codex is a second reviewer with no context from this
session — that independence is the point.

## Procedure

### 1. Preflight (cheap, inline)

- `git rev-parse --abbrev-ref HEAD` — if already on the base branch, tell the
  user there is nothing to review and stop.
- If the working tree is dirty, mention that uncommitted changes are NOT part
  of `--base` reviews; offer `--uncommitted` mode if that's what they meant.

### 2. Run the review in a subagent

Spawn one Agent (general-purpose) so codex's raw output never floods the main
context. The subagent must:

1. Run: `codex review --base <base>` from the repo root via Bash with a
   10-minute timeout (`timeout: 600000`). Default base: `main`.
2. If codex exits non-zero (not installed, not authenticated, network),
   return the error verbatim, prefixed `CODEX FAILED:` — nothing else.
3. Otherwise distill the review output into a structured findings list and
   return ONLY that:

   ```
   ## Codex findings (<n> total)
   1. [P1|P2|P3] <file>:<line> — <one-sentence issue> (<why it matters>)
   ...
   Verbatim summary: <codex's own closing summary, if it printed one>
   ```

   Keep codex's severity/priority labels if present; otherwise judge:
   P1 = correctness/security, P2 = robustness, P3 = style/nit.

### 3. Feed back into the main context

Relay the findings list to the user, then treat it as review feedback:

- **Verify before fixing.** Codex has no session context and may be wrong or
  may flag deliberate choices (e.g. `ponytail:`-commented shortcuts, plan-
  documented limitations). Read the flagged code first. A finding that
  contradicts a documented decision in the active plan or a standards doc is
  answered, not applied.
- For each finding, state a verdict: **fix** (and fix it, TDD per
  `docs/standards/testing.md` — failing test first for behavior bugs),
  **skip** (one line why), or **ask** (genuinely the user's call).
- Finish with a one-line tally: `N findings: x fixed, y skipped, z asked`.

## Notes

- Never pipe secrets into the prompt; codex reads the repo itself.
- Long reviews: if the subagent times out, suggest re-running against a
  narrower base (`--commit <sha>`) instead of raising the timeout.
