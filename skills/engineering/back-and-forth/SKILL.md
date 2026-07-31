---
name: back-and-forth
description: Conversational development from rough idea to landed code — locate or resume the work, research the codebase, pressure-test the idea into a grounded PRD, design the program shape, implement, then land it. Picks up work already in progress at whatever stage it reached. Use when the user says "let's go back and forth", wants to think through or pressure-test a feature, wants to continue or resume work in progress, or is starting anything that isn't a trivial fix.
---

# back-and-forth

One continuous conversation from "I want to build X" to landed code. You are a sharp, skeptical thinking partner throughout — not a stenographer, not an order-taker.

Two artifacts carry the work, and they are as much the source of truth as the code is:

- **The research doc** — facts about the codebase as it exists. Descriptive, never prescriptive.
- **The plan** — the PRD, then the program design, then the work, then the retrospective. Everything decided in conversation lands here, including feedback received *during* implementation. A decision that stays in the chat is a decision that is lost.

The bar for both: **a brand new session, with only these two files and the repo, can pick up exactly where this one left off.** Test every write against that. It is also what makes the whole flow resumable — see [Resumability](#resumability).

## Scale the ceremony to the work

Judgement first. Read what is being asked and pick the weight:

- **A fix or a small change** — a button, a copy tweak, a one-file bug. Skip the phases. Confirm you understand it, do it, offer the review at the end. Running a PRD gate on a button is insulting.
- **A moderate change** — new behavior in an existing subsystem. Frame it, a focused research pass, a short PRD, a light design sketch, build.
- **A substantial feature** — new subsystem, cross-cutting change, anything with an architecture boundary in it. The full flow, gates and all.

Say which weight you picked, in one line, and adjust if the user disagrees. Being wrong about the weight is cheap; ceremony the user did not need is not. When genuinely unclear, ask — but bias toward less.

## Where documents live

Read the `## Knowledge base` table in `AGENTS.md` for the `Plan` and `Research` directories and filename patterns, and the `## Workflow` block for this project's PR and merge preferences. **No table means invoke `kb-init` first.** Never guess a path and never fall back to a default.

## Phase 0 — Locate the work

Before anything else, find out whether this work already exists. It usually does — a session died, a day passed, or `feature` just set it up.

**If `feature` handed off**, the plan and research paths came with the handoff and the stage is the beginning. Skip to Phase 1.

**Otherwise, look — including in other worktrees.** A session started in the root checkout must be able to find work living elsewhere:

```bash
git worktree list                      # feature worktrees and their branches
git branch -a --list 'feat/*'          # branches with no worktree
ls <plan-dir> <research-dir> 2>/dev/null
```

Match the user's description against the plans you find (read their titles and descriptions, not just filenames). Then:

- **One obvious match** — name it and confirm in one line before continuing.
- **Several plausible matches** — `AskUserQuestion` listing each with its stage, newest first.
- **No match** — this is new work. If the project uses worktrees, invoke `feature` to set up the workspace properly and let it hand back. Otherwise ask where the research should go, slug the topic, and start at Phase 1.

**Move into the worktree.** Once identified, make it the working directory for every later command, and say so plainly — the user needs to know which checkout they are operating on. Never switch the root checkout's branch. If the harness has a native way to enter a worktree, use it; otherwise `cd` in Bash, whose working directory persists.

**Then determine the stage** from what exists, in this order — the first miss is where we resume:

| Present | Resume at |
| --- | --- |
| Research doc missing or still a stub | Phase 2 — research |
| Research written, plan has no PRD | Phase 3 — pressure-test |
| PRD written, not yet approved by the user | Phase 3's gate |
| PRD approved, no `## Program design` in the plan | Phase 4 — design |
| Design present, not yet approved | Phase 4's gate |
| Design approved, work sections unfinished or no commits | Phase 5 — implement |
| Implementation complete | Phase 6 — land |

The plan's frontmatter carries a `stage` hint, which you keep current as phases complete. **The artifacts win over the hint** — if the plan says `stage: implement` but there is no program design section, believe the file. Then state the stage, summarize where things stand in two or three lines, and continue from there. Do not redo a completed phase; re-reading its output is enough.

## Phase 1 — Frame

Let the user describe the idea. Ask for what they left implicit before critiquing anything: you cannot poke holes in an idea you have only half-heard.

Refine it *just enough to direct research* — no further. You need to know which subsystems are plausibly in play and roughly what "done" looks like. One or two sharp questions if the description is too thin to aim a research pass. Do not design, do not propose approaches, do not argue yet.

## Phase 2 — Research the codebase

Facts only, gathered by subagents so their file-reading never floods this conversation.

Decompose the feature into 2–4 distinct areas, then launch one **read-only** subagent per area, all in a single message so they run in parallel. Use the `Explore` agent, or `general-purpose` held strictly read-only.

Brief each one — the constraints are not optional, because a research agent that starts designing defeats the purpose:

> You are a **documentarian**, not a designer or a reviewer. Map the existing code in `<area>` as it relates to `<one-line intent>`. Report **only what exists and how it works today**.
>
> - Do **not** propose changes, refactors, improvements, or an architecture. Do not say how to implement anything.
> - Do **not** evaluate code quality or flag things to fix. If current behavior is surprising, describe it plainly; do not editorialize.
> - Do **not** make decisions that belong in a plan. Say *"this is where X lives / how X flows today"*, never *"change X"* or *"add Y here"*.
>
> Deliver: the types, interfaces, and boundaries involved; the current control flow; the extension points that already exist; the invariants and standards that govern the area (from `AGENTS.md` and the knowledge base); and the specific locations the feature would most plausibly touch, stated descriptively. Include 5–10 key files as `path:line — note`. Structured notes, no prose padding.

Read the key files they surface yourself before writing anything, so the doc records verified fact rather than a second-hand summary.

Then write the research doc: OKF frontmatter with `type: Research`, and a marker line so no reader mistakes it for a plan.

```markdown
> Descriptive, not prescriptive. What the codebase looks like today, so planning needs fewer corrections. It holds no design decisions — those live in the plan.
```

Cover: the relevant subsystems; where the feature would touch existing code; where new code would plausibly live; existing pieces worth reusing; the invariants, standards, and data flows in scope; key files as `path:line — note`; and open technical questions, as factual gaps only. If a line reads "we should…", cut it — that is the next phase's job.

## Phase 3 — Pressure-test into a PRD

Now argue. You have ground truth, so every objection can be concrete.

One or two of the sharpest objections at a time, never a scattershot list. Aim at, roughly in order of value: **what the user is assuming that may not be true**; whether the feature — or a piece of it — needs to exist at all; what *success* actually means and how we would know we got it; then the technical holes the research doc makes visible. Walk the real change sites: the signatures and callers that shift, the error path at *that* call site, ordering and concurrency where the new code runs, schema and backward compatibility, where state lives and who else reads it, the boundaries crossed. Chase every open question the research doc raised — those are unresolved by construction and must not survive into the plan.

Be proactive, not merely critical: help the user *arrive* at a solution you both believe will produce the outcome, rather than only shooting down the one they brought. When you are wrong, say so and drop it. Track open questions so nothing quietly disappears.

Converge, then write the **PRD as the first section of the plan**: the problem, who it is for, the success criteria, the agreed solution in prose, the decisions and their *why*, what is explicitly out of scope, and the remaining risks. Grounded in the research doc throughout — a PRD that could have been written without reading the codebase has not done this phase's work.

**Then stop.** Hard gate: the user reviews the PRD and gives feedback, possibly over several rounds. Do not start designing until they say they are ready. Fold every round of feedback into the PRD itself, not just into the reply.

## Phase 4 — Program design

Invoke `program-design`. It draws the call maps, the file-tree diff, the interfaces and key signatures, and the libraries and tools in play, then argues them out — dense enough to review at a glance, which is the point. It reads the PRD and research doc; do not re-derive that context for it.

Keep poking holes as the shape comes back. The design being right is not the same as the code shape being right, and this is the level where agents quietly go wrong.

Its artifacts land in the plan as `## Program design`, between the PRD and the work sections. **Then stop again** — the user approves the shape before any code is written.

## Phase 5 — Implement

Build it, honoring the project's implementation rules — `AGENTS.md`, the standards in the knowledge base, the test discipline the project actually uses. Where the program design named a test-first order, follow it.

As you go, the plan stays the source of truth. Every correction the user makes, every decision forced by something the code turned out to do, every deviation from the designed shape and its reason — **fold it into the plan as it happens**, not in a cleanup pass. If the plan and the code disagree when you are done, the plan is wrong and it was your job to prevent that.

Work in sections the plan can reference, and say what changed as you finish each one.

**When the implementation is done, ask about the PR.** The `## Workflow` block in `AGENTS.md` records the project's default (`open PR: yes | no | ask`); honor it, and when it says `ask` — or is absent — ask once, plainly: open a PR now, or keep it local? Then act: push the branch and `gh pr create` with the PRD's problem statement as the body, or say the work is committed locally and stop there.

## Phase 6 — Land

When the user says the work is done, **invoke `land`**. It rebases onto the base branch and works any conflict through with the user, captures what changed into the knowledge base, writes the retrospective, confirms all of it plus the merge in one gate, then merges and removes the worktree. Tell it which feature this is so it does not have to ask.

## Offer the adversarial review at every gate

At the end of each phase — research written, PRD agreed, design approved, implementation done, before the merge — offer to run `adversarial-review` against what was just produced, saying what it would look at. One line, easy to decline:

> Want an adversarial review of the PRD before we design? (skip / run)

The user skips freely and a skip is never questioned. Do not run it unprompted; do not nag. On a small change, offering once at the end is enough.

**When a review runs, its fixes land as one commit.** Work the findings to green, then commit them together — not one commit per finding, and never left dirty for the user to discover and chase. The review is a single event in the history and reads as one; splitting it buries which change answered which finding, and leaving it uncommitted strands a green tree behind an unrecorded pile of edits.

Concretely, once the suite is green again: fold the findings into the plan as a table with a verdict per finding — fixed, answered, or referred to the user — then stage everything, including deletions and new test files, and write one commit whose message says what the review found and what changed. A finding that needs the user's decision waits for their answer and joins the same commit rather than trailing behind in a second one. Do not ask whether to commit; asking is how the tree ends up dirty.

## Resumability

Any session can die at any moment, so no state lives only in this conversation. After every phase, and after every decision inside a phase, the plan and research doc must be current enough that a cold session reading them plus [Phase 0](#phase-0--locate-the-work) lands on the same stage with the same context.

Concretely: update the plan's `stage` frontmatter when a phase completes, record gate approvals in the plan (an approved PRD says so), and never hold an agreed decision in conversation alone while moving on to the next thing. If you are about to do something the plan does not yet reflect, write it down first.

## Judgement, not theatre

Confidence is a feel, not a checklist you pad to hit a number. If the idea is sound in three exchanges, call it in three. If it is still soft after ten, keep going. Do not invent objections to look rigorous, and do not wave through a real gap to seem agreeable. The bar is whether a competent agent could build this from the plan alone and get it right.

Terse throughout. The artifacts carry the content; prose around them is overhead.
