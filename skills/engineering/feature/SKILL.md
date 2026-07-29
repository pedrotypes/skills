---
name: feature
description: Start a new feature — name it once, allocate its number, cut an isolated worktree, stub its research and plan files, then hand straight over to back-and-forth. Use when the user wants to start, kick off, or begin work on a new feature and no worktree exists for it yet.
---

# feature

Bootstrap only. This skill creates the workspace and the two files the work will fill, then gets out of the way — all the thinking happens in `back-and-forth`, which it hands to. Do not shape the idea here, do not research, do not design. Naming and a worktree, nothing else.

The root checkout is never switched. Everything happens in the worktree.

## 1. Check whether this work already exists

Never create a second workspace for work that already has one. Before anything else, look — including in other worktrees, since this may be running from the root checkout:

```bash
git worktree list                      # feature worktrees and their branches
git branch -a --list 'feat/*'          # branches with no worktree
```

Match the description against what you find, reading plan titles and descriptions rather than guessing from filenames. **If it already exists, this skill is done**: say which worktree holds it and invoke `back-and-forth`, which figures out the stage and resumes. Do not renumber it, do not cut a second branch.

Only continue below when the work is genuinely new.

## 2. Resolve where documents live

Read the `## Knowledge base` table in `AGENTS.md` to get the directory and filename pattern for the `Plan` and `Research` types. **If there is no table, invoke `kb-init` and stop** — the rest of this skill has nowhere to write until the project is set up.

The examples below use `docs/plans/` with `P<n>-<slug>.md` and `R<n>-<slug>.md`; take the real values from the table.

## 3. Name it once

The description comes from the skill argument; if there is none, ask for a sentence or two and nothing more. You need enough to write a slug, not enough to design anything.

Write a short kebab-case `<slug>` — no articles, no filler, matching the style of names already in the plan directory. One name becomes all of these:

- **Plan:** `<plan-dir>/P<n>-<slug>.md`
- **Research:** `<research-dir>/R<n>-<slug>.md` — same `<n>` and `<slug>`; the pair is matched by name
- **Branch:** `feat/<n>-<slug>`
- **Worktree:** `.worktrees/<n>-<slug>`

## 4. Allocate the number — across every branch

The number must be unique across all branches, not just this one, so two in-flight features never collide. This is the only place numbers are allocated; nothing downstream renumbers.

```bash
git fetch --all --quiet
{
  git for-each-ref --format='%(refname)' refs/heads refs/remotes \
    | while read -r ref; do git ls-tree -r --name-only "$ref" -- <plan-dir> <research-dir> 2>/dev/null; done
  ls <plan-dir> <research-dir> 2>/dev/null
} | grep -oE '[PR][0-9]+' | grep -oE '[0-9]+' | sort -n | tail -1
```

Nothing printed means the next number is `1`; otherwise that value `+ 1`. Both prefixes are counted so a stray research doc can never shadow a plan number. If the registry's pattern has no `<n>` token, skip this step — the project doesn't number these documents.

## 5. Confirm before creating anything

Hard stop. `AskUserQuestion` with the plan path, the research path, the branch, and the worktree path. The slug is what usually needs a tweak. Wait for the answer.

## 6. Cut the worktree

1. Ensure `.worktrees/` is gitignored; add the line if missing, on whatever branch the root is on.
2. Branch from the integration base, not from wherever the root happens to be:

   ```bash
   git worktree add -b feat/<n>-<slug> .worktrees/<n>-<slug> origin/main
   ```

   Fall back to `main` if `origin/main` is unavailable.

## 7. Stub both files

Inside the worktree, with OKF frontmatter (`type: Plan` and `type: Research`, a `title`, a one-line `description`) so they are valid knowledge-base documents from birth. Body: a title line and the user's one-sentence description. Nothing else — `back-and-forth` writes the content, and a stub that pretends to have structure invites an agent to fill in headings it hasn't earned.

Add both to their types' `index.md`.

## 8. Hand over

Make the worktree the working directory, then invoke `back-and-forth`, telling it the plan path, the research path, and that both are stubs. It takes over from the rough idea and runs the whole flow from there.

Tell the user the worktree path and that the root checkout was left alone.

## Notes

- Never switch the root checkout's branch. If the root is dirty in a way that blocks `git worktree add`, surface it rather than working around it.
- The number is allocated from what exists at creation time; it is not a reservation. Running `feature` twice before either lands is safe because the worktree creates the branch immediately, so the second run sees the first.
