# The project manifest

Each repo tells the skills what it has, and where, in `.agents/project.md`. Skills read it when they need a path or a command, and never guess one. A repo without it gets `/setup` first.

The format is Markdown: the headings below, in this order, with `- Name: value` lines. Paths are relative to the repo root. Leave out a line the repo doesn't have. A skill that needs a missing line asks the user, then offers to add it.

## Template

````markdown
# Project manifest

Read by the pedrotypes skills. See the setup skill's manifest.md for what each line means.

## Paths

- Plans: docs/plans/
- Plans index: docs/plans/index.md
- Standards: docs/standards/
- Reference docs: docs/reference/
- Data flows: docs/data-flows/
- Routing: AGENTS.md

## Tracker

- Kind: jira
- Ticket URL: https://example.atlassian.net/browse/<ID>
- Key pattern: PROJ-\d+

## Commands

- Install: pnpm install
- Verify: pnpm verify
- Extra checks:
  - when <area> changed: <command>

## Isolated stack

```bash
<commands that start this worktree's own copy of the app, on its own database and port $PORT,
 appending every PID they start to .build/pids>
```

- Ready when: <a command that succeeds once the stack is up>
- Cleanup: <commands that remove what the stack created, such as its database>
- QA notes: <a file telling a QA agent how to drive this stack: the browser, signing in, test credentials by where they live, restarting processes>
- ffmpeg: <the command that runs ffmpeg, when it isn't `ffmpeg` on the PATH>

## Workflow

- Base branch: main
- Worktrees: .worktrees/
- Landing: pull request
- PR footer: <last line of every PR body>
- Proof media branch: pr-media

## Design

- Tokens: <a CSS file whose first :root block defines the product's colour variables>
- Standard: <the design-language doc>
````

## What each line means

**Paths**
- **Plans**: where `build` writes `P<n>-<slug>.md`, its research notes `R<n>-<slug>.md`, and the rendered picture `P<n>-<slug>.html`. A plan number is one above the highest on any branch.
- **Plans index**: the list `build` adds each new plan to.
- **Standards**: team decisions that code must follow. `build` follows them and reviewers enforce them. `retro` adds reviewer rules here.
- **Reference docs**: describe the code as it is now. `build` keeps them true. `improve-architecture` records rejected candidates in a `Considered and rejected` list at the end of the doc for that area.
- **Data flows**: step-by-step flows through the system. Treated like reference docs.
- **Routing**: the file that says which docs to read for which area. Skills read it before changing anything.

**Tracker**: `jira`, `github` or `none`. With a ticket URL, `<ID>` stands for the ticket key. The key pattern finds ticket keys in requests and branch names.

**Commands**
- **Install**: run once in each new worktree.
- **Verify**: the whole local suite. Nothing ships unless it's green.
- **Extra checks**: suites that run only when certain areas change, each with its condition.

**Isolated stack**: how `build` runs the change for proof without touching the user's own processes, data or queues. `$N` is the plan number and `$PORT` a free port, both set by the skill. The skill kills everything in `.build/pids` when it's done, then runs the cleanup after the PR merges. *QA notes* go into every QA brief, so the QA agent doesn't rediscover how to drive the stack. *ffmpeg* turns proof videos into GIFs.

**Workflow**
- **Base branch**: what features branch from and land on.
- **Worktrees**: where each feature's worktree goes.
- **Landing**: `pull request` (the default) or `local merge`, for a repo with no remote, where `build` merges into the base branch itself under strict rules. With `local merge`, two more lines apply:
  - **Always waits for the user**: paths and areas whose changes the agent never merges on its own, however green. Name the ones that change the rules (agent instructions, standards, dependencies, migrations) or a security boundary.
  - **Proof archive**: where proof media goes when the user asks to keep it. It's never committed.
- **PR footer**: the last line of every PR body, above the tool's attribution, or of every merge commit message with `local merge`.
- **Proof media branch**: the orphan branch that `build` publishes screenshots and GIFs to. Pull requests only.

**Design**
- **Tokens**: the plan picture takes its colours from this file, so it looks like the product. Without it, the picture uses its own neutral palette.
- **Standard**: the doc that UI work and mockups follow.
