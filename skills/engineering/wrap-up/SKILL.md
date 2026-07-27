---
name: wrap-up
version: 1.0.0
description: Close out a feature — capture the high-value logic/design/architecture/workflow changes and a short retrospective into the proper docs and flowcharts, confirm everything in one review gate, then merge the PR, delete the branch, fast-forward main, and remove the worktree.
triggers:
  - /wrap-up
  - wrap up this feature
  - wrap up the feature
  - close out this feature
  - let's wrap up
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Bash
  - AskUserQuestion
  - Skill
---

# wrap-up

The bookend to `/feature`. It turns a finished-and-reviewed feature branch into
landed, documented history: it captures what actually changed into the docs that
outlive the branch, reflects on what could have gone better, runs the whole
proposal past the user in a **single** review gate (so nothing hallucinated or
low-value slips into the permanent record), and then does the irreversible git
plumbing — merge, delete branch, fast-forward main, remove worktree.

Two hard rules:

- **Nothing is written or merged until the user confirms** in the review gate.
- **Only high-value, verified changes are captured.** Better to record three
  true, load-bearing facts than ten plausible-sounding ones. If you cannot point
  to the diff hunk, commit, or conversation turn that a claim comes from, drop it.

## Preconditions

Run from the feature's worktree (or know its path). Establish these first:

- The **PR number** (`gh pr list --head <branch>` or `gh pr view`), its branch
  `feat/<n>-<slug>`, and that it is green and reviewed. If CI isn't green or the
  PR is still in review, say so and stop — wrap-up lands things, it doesn't
  rush them.
- The **worktree path** (`git worktree list`) and the **root checkout** path
  (the primary worktree, usually on `main`).
- The plan file `docs/plans/P<n>-<slug>.md`.

## Steps

### 1. Reconstruct what actually changed

Read the branch's real diff against main — do not rely on memory of the
conversation:

```
git fetch origin --quiet
git log --oneline origin/main..HEAD
git diff --stat origin/main...HEAD
git diff origin/main...HEAD        # read the hunks that matter
```

From the diff plus the conversation, build a candidate list of changes that
warrant permanent documentation, sorted into these buckets. Ignore anything that
is pure test churn, formatting, or a config-schema addition with no runtime
effect.

- **Logic / behaviour** — a new invariant, failure path, or rule a future reader
  must know. → usually `docs/plans/P<n>-*.md` and, if it's a cross-cutting rule,
  `docs/standards/*.md` (architecture, agent-model, tool-safety, testing).
- **Design / architecture** — a new port/adapter/component, a changed
  responsibility, a boundary that moved. → `docs/standards/architecture.md` /
  `agent-model.md`, and the plan file.
- **Workflow / process** — a change to how the system is built, deployed, or
  operated (build flags, deploy mechanics, a new gotcha). → the plan file's notes
  and, if it's a durable operational fact, the auto-memory (see step 4).
- **Data flow** — anything that changes a sequence, state machine, or wiring the
  `docs/data-flows/` Mermaid diagrams depict. → **delegate to the `data-flow-aura`
  skill**, which owns those diagrams; don't hand-edit them here.

For each candidate, note the exact target file and a one-sentence summary, and
keep the evidence (hunk / commit / turn) so the review gate isn't guesswork.

### 2. Draft the doc edits

For each surviving candidate, work out the precise edit — the specific lines to
add or change, in the voice and structure of the target file (read it first).
Prefer a tight `Edit` over a rewrite. Do **not** apply anything yet.

For data-flow diagrams, invoke `data-flow-aura` to draft (not yet apply) the
diagram diff, so its confirmation folds into this skill's single gate rather than
firing its own.

### 3. Reflect — what could have gone better

Independently of the docs, write a short retrospective (2–5 bullets) grounded in
*this* feature's actual history: where we backtracked, a check that was skipped
and cost us, a wrong assumption, a step that worked well and should become the
default. Be specific and honest — "skipped eng-review, then folded 11 findings
late" beats "could improve process."

Split them:

- **Feature-specific** reflections → a `## Retrospective` section appended to the
  plan file `docs/plans/P<n>-*.md`.
- **Durable process learnings** that should change how future work is done →
  propose as an auto-memory entry of type `feedback` (with the *why*), per the
  memory instructions. These are the ones worth carrying across sessions.

### 4. The single review gate (anti-hallucination)

Present **everything** — every doc edit, every diagram change, every retro
bullet, and the merge/cleanup go-ahead — in **one** `AskUserQuestion` call. This
is the whole point of the skill: the user validates the permanent record in one
pass. `AskUserQuestion` allows at most 4 questions and 4 options each, so map the
buckets onto questions and **pre-filter each to the strongest ≤4 items** (if a
bucket has more, keep the highest-value and say in prose what you dropped and
why):

- **Q1 (multiSelect) — Doc / architecture captures.** Options = the proposed
  edits to plan/standards files; use the `preview` field to show the actual
  old→new lines. User keeps the true ones, drops the rest.
- **Q2 (multiSelect) — Flowchart updates.** Options = the `data-flow-aura` diagram
  diffs. Omit this question if no diagram changed.
- **Q3 (multiSelect) — Retrospective.** Options = the retro bullets (plan-file
  ones and any proposed `feedback` memory), so the user curates what's worth
  keeping.
- **Q4 (single) — Land it?** e.g. "Apply the confirmed captures, then merge PR
  #<n> and clean up?" Options: **Yes — apply + merge + clean up** /
  **Apply docs only, hold the merge** / **Cancel**.

Keep each question's prose to one sentence; the detail lives in the option
descriptions and previews. Wait for the answer. Capture only what the user
checks — dropped items are dropped, no negotiation.

### 5. Apply the confirmed captures

For each kept item:

1. Edit the target doc (`Edit` for targeted changes; `Write` only for a
   structural rewrite). For diagrams, let `data-flow-aura` apply its confirmed
   diff. For a new data-flow file, add its bullet to `AGENTS.md` and `CLAUDE.md`.
2. Apply any confirmed auto-memory `feedback` entry (write the file, add the
   one-line pointer to `MEMORY.md`).
3. Verify markdown/Mermaid fences are intact.

Commit the doc changes on the feature branch and push, so the PR that lands
includes them:

```
git add <the doc files>
git commit -m "docs: capture <feature> changes and retrospective"
git push
```

If CI must re-run on the new commit, wait for green before merging.

If the user chose **Apply docs only, hold the merge**, stop here and report
what's committed; do not touch git plumbing.

### 6. Land and clean up

Only after an explicit **merge** go-ahead. Order matters — the worktree and the
branch-checked-out-elsewhere constraint make a naive `--delete-branch` fail, so
do the plumbing from the **root checkout**, worktree first:

1. **Merge** (squash, matching this repo's history):
   ```
   gh pr merge <n> --squash
   ```
   Prefer running the local cleanup yourself rather than relying on
   `--delete-branch`: run from inside the worktree, `gh`'s local branch delete
   fails because it can't switch this checkout to `main` (it's checked out in the
   root). Delete the remote branch explicitly instead (next step).
2. **Delete the remote branch:**
   ```
   git push origin --delete feat/<n>-<slug>
   ```
3. **Remove the worktree** — from the root checkout, not from inside it:
   ```
   git -C <root> worktree remove .worktrees/<n>-<slug>
   ```
   If the worktree has stray untracked files it refuses to remove, surface that
   to the user rather than forcing `--force`.
4. **Delete the local branch** (now that no worktree holds it):
   ```
   git -C <root> branch -D feat/<n>-<slug>
   ```
5. **Fast-forward main:**
   ```
   git -C <root> checkout main
   git -C <root> fetch origin --prune
   git -C <root> pull --ff-only origin main
   ```
6. Confirm the end state: `git -C <root> log --oneline -3` shows the squash
   commit at the tip, and `git -C <root> worktree list` no longer lists the
   feature worktree.

## Report

Close with a short status: the merge commit, which docs/diagrams/memory captured
what, the retrospective, and any deliberately-dropped candidates. If a live
deployment consumes this code, remind the user it is **not** deployed by wrap-up
— landing ≠ deploying.

## Notes

- Wrap-up **lands**, it does not **deploy**. Never restart or redeploy a running
  agent as part of wrap-up unless the user separately asks.
- If the feature was developed on a plain branch with no worktree, skip the
  worktree-removal step; everything else holds.
- The review gate is not a formality — its job is to keep the permanent record
  honest. When in doubt about a capture, put it in the gate and let the user
  decide, or leave it out entirely. Do not write unconfirmed claims into docs.
