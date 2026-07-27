---
name: feature
description: Start a new feature — understand the intent, allocate its plan number across all branches, stub the plan file, spin up an isolated worktree, research the codebase into a neutral R-doc, then hand off to back-and-forth. Use when the user wants to start, kick off, or begin work on a new feature and no plan or worktree exists for it yet.
---

# feature

Bootstraps a new feature so all the work happens in an isolated git worktree
while the root checkout is left untouched. It forms a high-level understanding
of the intent, allocates the next plan number, names the feature once (that name
is the plan file, the branch, and the PR title), stubs the plan file, creates
the worktree, **researches the existing codebase into a neutral R-doc**, and
then runs `back-and-forth` inside it. Nothing is created until the user confirms.

## Inputs

The feature description comes from the skill argument. If none was given, ask
the user for a one- or two-sentence description of what we want to build before
doing anything else.

## Steps

### 1. Understand the intent — at a high level

Before touching git or the filesystem, get a clear high-level picture of *what
the user is trying to do* and *why*. This picture does two jobs: it drives the
slug, and — more importantly — it tells you which parts of the codebase the
research phase (step 7) must map.

Read the description and form the shape of the feature: what capability it adds,
which subsystems it plausibly touches, what "done" looks like. If the
description is too thin to direct research — you cannot name even roughly which
ports, adapters, or flows are in play — ask the user one or two sharp clarifying
questions now. Do **not** design anything or propose an approach here; you are
only orienting. Keep it to the goal, not the solution.

### 2. Allocate the plan number — across *all* branches

Plans are `docs/plans/P<n>-<slug>.md`. The number must be unique across every
branch, not just the current one, so two in-flight features never collide on a
number. Compute the highest `P<n>` seen anywhere and add one:

```
git fetch --all --quiet
{
  git for-each-ref --format='%(refname)' refs/heads refs/remotes \
    | while read -r ref; do git ls-tree -r --name-only "$ref" -- docs/plans/ 2>/dev/null; done
  ls docs/plans/ 2>/dev/null
} | grep -oE '[PR][0-9]+' | grep -oE '[0-9]+' | sort -n | tail -1
```

If that prints nothing, the next number is `1`; otherwise it's that value `+ 1`.
(The `[PR]` class counts both `P<n>` plans and `R<n>` research docs so a stray
R-doc can never shadow a plan number.)

### 3. Derive the identifier

From the description, write a short, kebab-case `<slug>` (lowercase, words
joined by `-`, no articles or filler — match the style of the existing plan
filenames). The identifier is:

- **Plan file:** `docs/plans/P<n>-<slug>.md`
- **Research doc:** `docs/plans/R<n>-<slug>.md` (same `<n>` and `<slug>` as the
  plan — the R-doc and the P-plan are a matched pair)
- **Branch:** `feat/<n>-<slug>` (per `docs/standards/planning.md`)
- **PR title:** uses the same `P<n>-<slug>` identity going forward
- **Worktree dir:** `.worktrees/<n>-<slug>`

### 4. Confirm before creating anything

This is a hard stop. Use `AskUserQuestion` to confirm the proposed identity
before touching the filesystem or git. Show the plan file path, the research
doc path, the branch name, and the worktree path, and let the user approve or
adjust (the slug is the thing most likely to need a tweak). Do **not** proceed
on assumption — wait for the answer.

### 5. Set up the worktree

The root checkout stays on its current branch and is never switched — all
feature work lives in the worktree.

1. Ensure `.worktrees/` exists and is gitignored. If `.gitignore` doesn't
   already list it, add a `.worktrees/` line (do this on whatever branch the
   root is on; it's an infra line, keep the change minimal).
2. Create the worktree on a new branch cut from `origin/main` (the feature
   should start from the integration base, not from whatever the root happens
   to be on):

   ```
   git worktree add -b feat/<n>-<slug> .worktrees/<n>-<slug> origin/main
   ```

   If `origin/main` isn't available, fall back to `main`.

### 6. Stub the plan file

Inside the worktree, create `docs/plans/P<n>-<slug>.md` as a stub — enough to
hold the identity, not the finished plan (back-and-forth writes the real
content). Give it a title (`# P<n>: <Title>`) and the one-line description.
Leave the body for the next step.

### 7. Research the codebase — into a neutral R-doc

Before anyone plans or writes code, produce `docs/plans/R<n>-<slug>.md`: a
factual map of the ground the feature will be built on. The point is a plan that
needs fewer corrections on review because it was written on top of accurate
technical context, not guesses.

**Fan out read-only documentarian subagents.** Using the high-level picture from
step 1, decompose the feature into distinct areas of the codebase to map
(typically 2–4 — e.g. "the messaging port and its adapters", "the agent runtime
loop", "config wiring and the composition root"). Launch one read-only subagent
per area, **in parallel** (a single message with multiple `Task` calls). Use a
read-only exploration agent (the `Explore` agent, or `general-purpose` driven
strictly read-only) — these agents must not edit anything.

**Give every subagent this brief, adapted to its area.** The wording of the
constraints is not optional — a research agent that starts proposing designs
defeats the purpose:

> You are a **documentarian**, not a designer or a reviewer. Map the existing
> code in `<area>` as it relates to `<one-line feature intent>`. Report **only
> what exists and how it currently works**.
>
> Hard constraints:
> - Do **not** propose changes, refactors, improvements, or an architecture for
>   the feature. Do not say how to implement anything.
> - Do **not** evaluate code quality or flag things to "fix". If current
>   behavior is surprising, describe it plainly as-is; do not editorialize.
> - Do **not** make decisions that belong in the plan. Where the feature could
>   plausibly attach, state *"this is where X lives / how X currently flows"*,
>   never *"change X"* or *"add Y here"*.
>
> Deliver factual context a fresh agent needs before planning: the ports,
> adapters, and types involved; the current control flow through the area; the
> extension points that already exist; the invariants (`CLAUDE.md`), standards
> (`docs/standards/*.md`), and data-flow diagrams (`docs/data-flows/`) that
> govern it; and the specific locations the feature would most plausibly touch,
> stated descriptively. Include 5–10 key files to read as `path:line — note`.
> Return structured notes, not prose padding.

**Read the key files the agents surface** yourself before writing the R-doc, so
the document reflects verified fact rather than a second-hand summary.

**Write `docs/plans/R<n>-<slug>.md`.** Match the plan-file naming and voice, but
keep it strictly descriptive. Open with the marker line so no reader mistakes it
for a plan, then:

```
# R<n>: <Title> — research notes for P<n>-<slug>

> Descriptive, not prescriptive. This records what the codebase looks like today
> so planning needs fewer corrections on review. It holds no design decisions —
> those belong in P<n>-<slug>.md.

<One paragraph: the high-level intent of the feature, so a fresh reader knows the
goal these notes serve.>

## Relevant subsystems
## Where the feature would touch — existing change sites (descriptive)
## Where new code would most plausibly live — existing add sites (descriptive)
## Existing pieces that are relevant or reusable
## Invariants, standards, and data-flows in scope
## Key files to read (path:line — note)
## Open technical questions — factual gaps only, not recommendations
```

The bar: an agent with **fresh context** and only this file plus the repo can
understand what is going on well enough to plan or code without re-deriving the
lay of the land. If the notes drift into "we should…", cut it — that is
back-and-forth's job, not this document's.

### 8. Hand off to back-and-forth

All remaining work happens in the worktree. Make the worktree the working
directory for subsequent commands, then invoke the `back-and-forth` skill and
proceed as normal — it will pressure-test the idea and fill out
`docs/plans/P<n>-<slug>.md`. **Point it (and every later coding agent) at
`docs/plans/R<n>-<slug>.md` as the primary technical context to read first.**
Tell the user the worktree path, that the research doc is written, and that the
root checkout was left as-is.

## Notes

- Never switch the root checkout's branch. If the root is dirty in a way that
  blocks `git worktree add`, surface that to the user rather than working around
  it.
- The number is allocated at creation time from what exists across branches; it
  is not a reservation. If the user runs `/feature` twice before either lands,
  the second run will see the first only if its branch exists — which it will,
  since the worktree creates the branch immediately.
- The R-doc is descriptive scaffolding, not a deliverable to defend. It lives
  next to the plan (`R<n>` ↔ `P<n>`) and is committed on the feature branch so
  the plan's reviewers can see the ground it was built on.
