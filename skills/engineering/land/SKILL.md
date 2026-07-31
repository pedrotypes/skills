---
name: land
description: Land a finished feature — identify which one, rebase it onto the base branch and work any conflicts through with the user, capture what changed into the knowledge base, confirm everything in one gate, then merge, delete the branch and remove the worktree. Use when the user says the work is done, ready to land, ready to merge, or asks to finish, ship or wrap up a feature.
---

# land

Turns a finished feature into landed, documented history. Two hard rules govern all of it: **nothing is written or merged until the user confirms in the single gate**, and **only high-value, verified captures** — if you cannot point to the diff hunk, commit, or conversation turn a claim comes from, drop it. Better three true load-bearing facts than ten plausible ones.

Landing **lands**. It does not deploy. Never restart or redeploy anything as part of this unless the user separately asks.

Read the `## Knowledge base` table in `AGENTS.md` for the `Plan` and `Research` directories, and the `## Workflow` block for this project's base branch and merge preferences. Never guess a path.

## 1. Identify the feature

If the argument or the conversation names it, use that. Otherwise **look, then ask** — never guess, and never land whatever happens to be checked out.

```bash
git worktree list                                                    # worktrees and their branches
git for-each-ref --sort=-committerdate --format='%(refname:short) %(committerdate:relative)' refs/heads/feat
```

`AskUserQuestion` with the candidates **most recently updated first**, each option naming the branch, its worktree if it has one, and how long since its last commit. Read the matching plan's title for the description rather than restating the slug. Include a **Cancel** option. If exactly one candidate exists and the user just said the work is done, confirm it in one line instead of opening a dialog.

**Move into the worktree** and say which checkout you are operating on. Never switch the root checkout's branch.

## 2. Rebase and confirm mergeability

Do this before anything else. A conflict found here is a conversation; a conflict found mid-merge is a mess.

```bash
git fetch origin --quiet
git rebase origin/main            # or the project's base branch
```

If the rebase conflicts, **stop and work through it with the user**. Resolve only what is genuinely mechanical — a lockfile, an import list, two adjacent appends. Anything where both sides changed the same logic goes to the user with the conflicting hunks and what each side was trying to do; ask which behavior wins. Never `--skip`, never `--theirs`/`--ours` blindly, never abandon their work to make the rebase pass.

After a successful rebase the branch has new SHAs, so force-push with lease if a PR exists:

```bash
git push --force-with-lease
```

Then confirm the merge is actually clean and CI is green:

```bash
gh pr view <n> --json mergeable,mergeStateStatus,statusCheckRollup
```

If CI is red or the PR is still under review, say so and stop. Landing does not rush things.

With no PR, verify locally instead — `git merge --no-commit --no-ff main` from the branch, inspect, then `git merge --abort` — so mergeability is known before anything irreversible.

## 3. Reconstruct what actually changed

Read the real diff. Do not rely on memory of the conversation.

```bash
git log --oneline origin/main..HEAD
git diff --stat origin/main...HEAD
git diff origin/main...HEAD          # read the hunks that matter
```

## 4. Draft the knowledge-base captures

**Invoke `kb-maintain`** with the diff and what the conversation established. It reads the `## Knowledge base` table, works out which document types this change actually affects — which varies by project — learns each type's local conventions, and drafts the edits. Tell it to **draft and hand back rather than run its own gate**, so its confirmations fold into the single gate below.

It does not cover the plan itself. Handle that yourself.

Keep the evidence — hunk, commit, or conversation turn — attached to every candidate, so the gate is not guesswork.

## 5. The single review gate

Present **everything** — every doc edit, every diagram change, and the merge go-ahead — in **one** `AskUserQuestion`. This is the point: the user validates the permanent record in one pass.

The tool allows at most 4 questions with 4 options each, so map buckets onto questions and pre-filter each to the strongest ≤4 items, saying in prose what you dropped and why:

- **Q1 (multiSelect) — Knowledge-base captures.** The edits `kb-maintain` drafted; use `preview` to show the actual old→new lines. Split across two questions by type when there are many.
- **Q2 (single) — Land it?** "Apply the confirmed captures, then merge PR #<n> and clean up?" → **Yes, apply + merge + clean up** / **Apply docs only, hold the merge** / **Cancel**.

One sentence per question; detail lives in the option descriptions and previews. Capture only what the user checks — dropped items are dropped, no negotiation.

## 6. Apply the captures

Hand the approvals back to `kb-maintain` to apply — it also updates each type's `index.md` and the bundle's `log.md`, which are the easiest things to forget by hand. Then commit on the feature branch and push, so the landing includes them:

```bash
git add <the doc files>
git commit -m "docs: capture <feature> changes"
git push
```

If CI must re-run, wait for green. If the user chose **Apply docs only**, stop here and report what is committed — touch no git plumbing.

## 7. Merge and clean up

Only after an explicit merge go-ahead. **Order matters**: a naive `--delete-branch` fails while a worktree holds the branch, so do the plumbing from the root checkout, worktree first.

1. **Merge**, matching the project's history style:
   ```bash
   gh pr merge <n> --squash
   ```
   Run the local cleanup yourself rather than relying on `--delete-branch` — from inside the worktree, `gh`'s local delete fails because it cannot switch this checkout to the base branch. With no PR, merge locally from the root checkout instead: `git -C <root> checkout main && git -C <root> merge --squash feat/<n>-<slug> && git -C <root> commit`.
2. **Delete the remote branch:** `git push origin --delete feat/<n>-<slug>`
3. **Remove the worktree**, from the root checkout, not inside it: `git -C <root> worktree remove .worktrees/<n>-<slug>`. If stray untracked files make it refuse, surface that rather than forcing.
4. **Delete the local branch**, now that no worktree holds it: `git -C <root> branch -D feat/<n>-<slug>`
5. **Fast-forward the base:**
   ```bash
   git -C <root> checkout main
   git -C <root> fetch origin --prune
   git -C <root> pull --ff-only origin main
   ```
6. **Confirm the end state:** `git -C <root> log --oneline -3` shows the merge at the tip, and `git -C <root> worktree list` no longer lists the feature worktree.

Developed on a plain branch with no worktree? Skip step 3 and the worktree parts; everything else holds.

## 8. Report

The merge commit, what was captured where, and anything deliberately dropped. If a live deployment consumes this code, remind the user it is **not** deployed — landing is not deploying.
