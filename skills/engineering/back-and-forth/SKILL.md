---
name: back-and-forth
description: Conversational development from rough idea to landed code — locate or resume the work, research the codebase, pressure-test the idea into a grounded PRD, design the program shape, implement, then land it. Picks up work already in progress at whatever stage it reached. Use when the user says "let's go back and forth", wants to think through or pressure-test a feature, wants to continue or resume work in progress, or is starting anything that isn't a trivial fix.
---

# back-and-forth

One conversation from "I want to build X" to landed code. Be a sharp, skeptical thinking partner.

Two artifacts hold all state, always current enough that a cold session can resume from them alone:

- **Research doc** — what the codebase is today. Descriptive, never prescriptive.
- **Plan** — PRD, then program design, then work, then retrospective. Every decision, including ones made mid-implementation, lands here as it happens.

Paths come from the `## Knowledge base` table in `AGENTS.md` (and `## Workflow` for PR/merge preferences). No table → invoke `kb-init`. Never guess a path.

Scale ceremony to the work: small fix → skip the phases, just do it. Moderate change → light pass at each. Substantial feature → full flow. Say which you picked in one line.

## Phase 0 — Locate

If `feature` handed off, start at Phase 1. Otherwise search `git worktree list`, `git branch -a --list 'feat/*'`, and the plan/research dirs; match against the user's description. One match → confirm. Several → `AskUserQuestion`. None → new work; invoke `feature` if the project uses worktrees.

Move into the worktree and say so; never switch the root checkout's branch.

Resume at the first missing thing: no research → Phase 2; no PRD → Phase 3; PRD unapproved → Phase 3 gate; no `## Program design` → Phase 4; design unapproved → Phase 4 gate; work unfinished → Phase 5; done → Phase 6. Artifacts beat the plan's `stage` hint. Never redo a finished phase.

## Phase 1 — Frame

Hear the idea out and ask for what was left implicit. Refine only enough to aim research. No designing, no arguing yet.

## Phase 2 — Research

Invoke `code-research` with the framed intent. It fans out read-only subagents and reports findings without writing anything.

Write those findings into the research doc (OKF frontmatter, `type: Research`) with a marker line that it holds no design decisions.

## Phase 3 — Pressure-test into a PRD

Poke holes at the idea, one or two sharpest objections at a time. Aim at: unexamined assumptions, whether it needs to exist, what success means, then the technical holes — security gaps, performance problems, find the errors that the user forgot to think about. Close every open question the research raised. Help the user arrive at something better, not just shoot theirs down. Drop objections you lose.

Write the PRD as the plan's first section: summary, problem, audience, success criteria, agreed solution. **Then stop** — the user approves before designing. Fold every round of feedback into the PRD itself.

The PRD only contains facts, not discussion leftovers. We don't pollute the context with discarded alternatives, only what's real.

## Phase 4 — Program design

Invoke `program-design`; it reads the PRD and research and reports back without writing. Keep poking holes as the shape returns, then write the agreed shape into the plan as `## Program design`. **Stop again** for approval before any code.

## Phase 5 — Implement

Build it per `AGENTS.md` and the project's standards and test discipline. Fold every correction and deviation into the plan as it happens. Work in sections; report each as it finishes.

When done, honor `open PR` from `## Workflow`; if it says `ask` or is absent, ask once, then either push and `gh pr create` with the PRD problem statement as body, or stop with the work committed locally.

## Phase 6 — Land

Invoke `land`, naming the feature. It rebases, captures knowledge, writes the retrospective, gates once, merges, removes the worktree.

## At every gate

Offer `adversarial-review` in one line, easy to decline; never nag. When one runs, work findings to green, record a verdict per finding in the plan, then commit everything as one commit. Do not leave the tree dirty and do not ask whether to commit.
