---
name: feature
description: Start a new feature — name it once, allocate its number, cut an isolated worktree, stub its research and plan files, then hand straight over to back-and-forth. Use when the user wants to start, kick off, or begin work on a new feature and no worktree exists for it yet.
---

# feature

Bootstrap only: a name, a worktree, two stub files, then hand to `back-and-forth`. No shaping the idea, no research, no design. The root checkout is never switched.

## 1. Check whether this work already exists

```bash
git worktree list                      # feature worktrees and their branches
git branch -a --list 'feat/*'          # branches with no worktree
```

Match the description against plan titles, not filenames. **If it exists, this skill is done** — say which worktree holds it and invoke `back-and-forth` to resume. Never renumber it or cut a second branch.

## 2. Resolve where documents live

Read the `## Knowledge base` table in `AGENTS.md` for the `Plan` and `Research` directories and filename patterns. **No table → invoke `kb-init` and stop.**

## 3. Name it once

Take the description from the argument, or ask for a sentence or two — enough for a slug, not enough to design. Write a short kebab-case `<slug>` matching the names already in the plan directory. It becomes all four:

- **Plan:** `<plan-dir>/P<n>-<slug>.md`
- **Research:** `<research-dir>/R<n>-<slug>.md` — the pair is matched by name
- **Branch:** `feat/<n>-<slug>`
- **Worktree:** `.worktrees/<n>-<slug>`

## 4. Allocate the number across every branch

The only place numbers are allocated, and unique across all branches so two in-flight features never collide.

```bash
git fetch --all --quiet
{
  git for-each-ref --format='%(refname)' refs/heads refs/remotes \
    | while read -r ref; do git ls-tree -r --name-only "$ref" -- <plan-dir> <research-dir> 2>/dev/null; done
  ls <plan-dir> <research-dir> 2>/dev/null
} | grep -oE '[PR][0-9]+' | grep -oE '[0-9]+' | sort -n | tail -1
```

Nothing printed means `1`, otherwise that `+ 1`. Both prefixes count, so a stray research doc cannot shadow a plan number. Skip where the pattern has no `<n>`.

## 5. Confirm

Hard stop. `AskUserQuestion` with the plan path, research path, branch and worktree path — the slug is what usually needs a tweak.

## 6. Cut the worktree

Ensure `.worktrees/` is gitignored, then branch from the integration base rather than wherever the root sits:

```bash
git worktree add -b feat/<n>-<slug> .worktrees/<n>-<slug> origin/main
```

Fall back to `main` if `origin/main` is unavailable. A dirty root that blocks this gets surfaced, not worked around.

## 7. Stub both files

Inside the worktree: OKF frontmatter (`type: Plan` / `type: Research`, a `title`, a one-line `description`), a title line, the user's one sentence, nothing else. Add both to their types' `index.md`.

## 8. Hand over

Make the worktree the working directory and invoke `back-and-forth` with both paths, saying they are stubs. Tell the user the worktree path and that the root checkout was left alone.
