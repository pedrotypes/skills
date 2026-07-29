---
name: adversarial-review
description: Independent second opinion on whatever was just produced — a PRD, a program design, a plan, or the branch diff — run in a subagent by the Codex CLI, or an Opus subagent when Codex is unavailable, and fed back as findings to answer or fix. Use when the user asks for an adversarial review, a second opinion, a critique, or an independent review of a document or of the current branch.
---

# adversarial-review

A reviewer with **no context from this session** looks at what we just made and tries to break it. That independence is the entire value: this session is invested in its own conclusions, and a fresh reviewer is not. Run it in a subagent so the reviewer's raw output never floods this conversation.

## 1. Identify the target

The target determines the tool. Take it from the argument or the conversation; ask only when genuinely ambiguous.

| Target | What gets reviewed |
| --- | --- |
| **PRD** | The problem framing, the success criteria, the assumptions, the scope boundaries. |
| **Program design** | The shape: call maps, interfaces, signatures, file layout, library choices. |
| **Plan** | Whether a cold agent could execute it and get the intended result. |
| **Diff** | The branch against its base — the code as written. |

## 2. Pick the reviewer

Prefer Codex; fall back to Opus. Check once, cheaply:

```bash
command -v codex >/dev/null 2>&1 && echo codex || echo fallback
```

**Codex, document targets** — `codex exec` with the critique prompt, pointing at the file by path. Codex reads the repo itself.

**Codex, diff target** — `codex review --base <base>` (default `main`) from the repo root. First: `git rev-parse --abbrev-ref HEAD`, and if we are already on the base there is nothing to review — say so and stop. If the working tree is dirty, note that `--base` reviews exclude uncommitted work and offer `--uncommitted` instead.

**Fallback** — one `Agent` subagent on Opus, given the same critique prompt plus the file paths or `git diff <base>...HEAD`. Say which reviewer ran, always. "Codex was unavailable, so this is an Opus review" changes how much weight the findings deserve.

Run either through Bash with a 10-minute timeout (`timeout: 600000`).

## 3. Brief the reviewer adversarially

The default failure of a review is agreeableness. Prompt against it:

> You are an independent reviewer with no stake in this work. Your job is to find what is **wrong**, not to summarize or praise. Read `<paths>` and the code they reference.
>
> Attack, in order of value: assumptions stated as facts; success criteria that cannot actually be measured; a design that will not survive its own failure paths; anything that contradicts how the codebase actually works; scope that is quietly larger than it looks; and decisions with no stated reason.
>
> For a document, also ask: could a competent engineer with no other context execute this and get the intended result? Name specifically what is missing.
>
> Report only findings. No summary of what the document says — the reader has it. If you genuinely find nothing at a given severity, say so rather than padding.

Have the subagent return **only** a structured list, and nothing else:

```
## Findings (<n> total) — reviewer: codex|opus
1. [P1|P2|P3] <file>:<line or section> — <one-sentence problem> (<why it matters>)
...
```

Keep the reviewer's own severities when it gives them; otherwise P1 = wrong or unbuildable, P2 = fragile or underspecified, P3 = nit. If the reviewer fails to run (not installed, not authenticated, network), return the error verbatim prefixed `REVIEWER FAILED:` and nothing else.

## 4. Answer the findings

Relay the list, then work it — verifying before acting.

An independent reviewer has no session context, so it will sometimes flag a deliberate choice. Read the flagged code or section first. **A finding that contradicts a decision already recorded in the plan is answered, not applied** — and if the plan failed to record the reason, that is a finding against the plan, so fix the plan.

Give each finding a verdict: **fix** (and do it), **answer** (one line on why it is already handled or deliberate), or **ask** (genuinely the user's call). Close with a tally: `N findings: x fixed, y answered, z asked`.

Corrections that change a decision go into the plan, not just into this conversation.

**Then commit the fixes, in one commit.** A review that changed code ends with a green suite *and* a clean tree — never a pile of edits the user has to discover and chase. One commit for the whole review, not one per finding: the review is a single event in the history and reads as one, and splitting it buries which change answered which finding. Stage everything, including deletions and new test files, and write a message saying what the review found and what changed. A finding whose verdict was **ask** waits for the user's answer and joins the same commit rather than trailing behind in a second one. Do not ask whether to commit; asking is how the tree ends up dirty.

This applies whether the review was reached through `back-and-forth` or invoked on its own.

## Notes

- Never pipe secrets into the prompt; the reviewer reads the repo itself.
- If the subagent times out, narrow the target — a single section, or `--commit <sha>` — rather than raising the timeout.
