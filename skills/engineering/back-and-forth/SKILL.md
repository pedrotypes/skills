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

Resume at the first missing thing: no research → Phase 2; no PRD → Phase 3; no `## Program design` → Phase 4; both present but no recorded joint approval → back into the 3–4 loop; work unfinished → Phase 5; done → Phase 6. Artifacts beat the plan's `stage` hint. Never redo a finished phase.

## Phase 1 — Frame

Hear the idea out and ask for what was left implicit. Refine only enough to aim research. No designing, no arguing yet.

## Phase 2 — Research

Invoke `code-research` with the framed intent. It fans out read-only subagents and reports findings without writing anything.

Write those findings into the research doc (OKF frontmatter, `type: Research`) with a marker line that it holds no design decisions.

## Phase 3 — Pressure-test into a PRD

Poke holes at the idea, one or two sharpest objections at a time. Aim at: unexamined assumptions, whether it needs to exist, what success means, then the technical holes — security gaps, performance problems, find the errors that the user forgot to think about. Close every open question the research raised. Help the user arrive at something better, not just shoot theirs down. Drop objections you lose.

Write the PRD as the plan's first section: summary, problem, audience, success criteria, agreed solution. Fold every round of feedback into the PRD itself.

The PRD only contains facts, not discussion leftovers. We don't pollute the context with discarded alternatives, only what's real.

## Phase 4 — Program design

Invoke `program-design`; it reads the PRD and research and reports back without writing. Keep poking holes as the shape returns, then write the agreed shape into the plan as `## Program design`.

A shape that will not come out clean usually means the PRD asked for the wrong thing. Say so and go back to Phase 3 rather than designing around it.

## Phases 3 and 4 are one loop

They run until **both you and the user are about 92% confident this is ready to build**, and only then does any code get written.

Each lap, state your own confidence as a number and name the one or two things holding it down; ask the user for theirs. Below the bar on either side, take another lap — whoever is less sure sets its agenda. The number is a real measure, not a ritual: 92% means the doubt that remains is the kind only writing the code will settle, and anything a further exchange could answer means you are not there yet. It is deliberately not 100 — chasing certainty in conversation costs more than discovering the last few percent in the editor.

When the bar is met, record in the plan that it is — that record is what a cold session reads to know code may be written.

Offer `adversarial-review` in one line, easy to decline; never nag. When one runs, work findings to green, record a verdict per finding in the plan, then commit everything as one commit. Do not leave the tree dirty and do not ask whether to commit.

## Phase 5 — Implement

Follow the plan as closely as possible. Small corrections that are necessary to fix problems that pop up can be folded into the plan in a later "implementation notes" section. Any correction that changes functionality needs to be checked with the user first. Be very brief in your output, report only which section you are in when it changes, and only point out corrections, no need to narrate successes.

When done, honor the `Adversarial review` setting in the workflow table without asking: `auto` runs `adversarial-review` on the diff, `ask` puts the one-line offer, `no` skips it. Only an absent table earns a question. Fix any findings that don't affect functionality. For the findings that do, make a recommendation to the user but ask them what to do.

Finally, honor the workflow that is stated in the agents file. If none exists, ask the user what they want to do and offer "merge" or "open pr"

## Phase 6 — Land

Invoke `land`, naming the feature. It rebases, captures knowledge, writes the retrospective, gates once, merges, removes the worktree.
