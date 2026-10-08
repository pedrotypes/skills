---
name: setup
description: Write or update this repo's project manifest, `.agents/project.md`, which tells the other skills where plans, standards and docs live, which commands verify and run the app, and how work ships. Use when a skill reports the manifest is missing or incomplete, when the user sets up a new repo for these skills, or asks to change the manifest.
---

# Setup

The manifest is how one set of skills works across many repos. Its contract is in [manifest.md](manifest.md). Read it first.

## 1. Read the repo

Infer every line you can before asking anything:

- **Paths**: `AGENTS.md` or `CLAUDE.md`, any docs index, and the directories under `docs/`. A directory of numbered plans, a standards or conventions folder, reference or architecture docs.
- **Tracker**: ticket keys in `git log` and branch names, and links in docs and PR bodies (`gh pr list --state all --limit 20 --json body`).
- **Commands**: `package.json` scripts, `Makefile`, `justfile`, `pyproject.toml`, and `.github/workflows/`. Verify is whatever CI runs before merge.
- **Isolated stack**: the README, local-development docs, `docker-compose.yml`, and how the app's entrypoints take a port and a database.
- **Workflow**: the default branch, an existing worktree directory (`git worktree list`), and recent PR bodies for a footer.
- **Design**: a tokens or theme CSS file, and a design-language doc.

If `.agents/project.md` already exists, keep every line that's still true and change only what's wrong or missing.

## 2. Ask once

Put what you couldn't infer to the user in one batch, each question with your best guess first. Don't ask about lines the repo plainly doesn't need (no UI means no Design section). Write a line the user declines as missing, not as a placeholder.

## 3. Write it

- Write `.agents/project.md` from the template, filled in.
- Add `.build/` to `$(git rev-parse --git-common-dir)/info/exclude` if it isn't there. The skills keep scratch files in it.
- If the repo's `.claude/settings.json` doesn't register these skills, offer to add the snippet from the plugin's README, so teammates who open the repo are told to install them.
- Show the user the manifest, and commit it only when they agree, through the repo's normal flow.
