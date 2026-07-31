---
type: Reference
title: Skill configuration
description: Skills take their per-project behavior from the two tables in AGENTS.md, resolve paths and defaults from nowhere else, and honor a recorded setting without asking.
tags: [design, authoring]
---

# Skill configuration

Two tables in `AGENTS.md` configure every skill in this bundle. `## Knowledge base` maps each document type to its directory, index and filename pattern, and carries an `<!-- okf-declined: ... -->` marker listing types the user turned down. `## Workflow` holds the behavioral settings: base branch, whether to open a PR, merge style, worktrees, whether an adversarial review runs once implementation completes, and which reviewer runs it. A skill needing any of these reads the table and takes it from there — never a guessed path, never a hardcoded default, and an absent table means invoke `kb-init` and stop.

A setting present in a table is an answer already given, so honor it silently: `back-and-forth` runs, offers or skips the review according to the row, and `adversarial-review` uses the named reviewer without deliberating. Only a missing table earns a question. `kb-init` is the sole writer of both tables and is additive — it adds the missing row, creates the missing directory, and leaves correct entries untouched, so a second run over a current repo writes nothing. The declined marker is what makes that possible for document types, separating one the user rejected from one the skill had not yet learned to offer.
