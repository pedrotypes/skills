# Skills

Pedro's skills for coding agents. They take a feature from idea to a merge-ready PR, and keep the codebase and the agent's environment from rotting along the way.

## Skills

| Skill | Purpose |
| --- | --- |
| `build` | Idea to merge-ready PR. Size the change, agree on a plan the user can read at a glance (the picture), build it test-first, QA it running until it passes, prove it, cut it down, run Codex review until nothing blocks the merge, then babysit the PR until it's ready to merge. |
| `improve-architecture` | Periodic survey of the most-changed code for deepening opportunities: shallow modules whose complexity could sit behind a smaller interface. Writes a visual report and never changes code. User-invoked. |
| `retro` | After a hard session, propose changes to the environment (a check, a reviewer rule, a pointer, a deletion) so the next session doesn't repeat it. User-invoked. |
| `setup` | Write the repo's project manifest, which the other skills read. |

## Install (Claude Code)

```bash
claude plugin marketplace add pedrotypes/skills
claude plugin install skills@pedrotypes
```

Skills appear as `/pedrotypes-skills:<name>`.

**Updates.** Every push to `main` is a new version. At most once a day, a SessionStart hook checks GitHub. When there's a newer commit than the one installed, Claude offers to update and links to what changed. To update by hand:

```bash
claude plugin marketplace update pedrotypes && claude plugin update skills@pedrotypes
```

Then run `/reload-plugins`.

**For a team repo**, register the plugin in its `.claude/settings.json`. Teammates get the marketplace once they trust the folder, then install with `claude plugin install skills@pedrotypes --scope project`:

```json
{
  "extraKnownMarketplaces": {
    "pedrotypes": { "source": { "source": "github", "repo": "pedrotypes/skills" } }
  },
  "enabledPlugins": { "skills@pedrotypes": true }
}
```

## Each repo describes itself

The skills work across repos because each repo keeps a **project manifest** at `.agents/project.md`. It lists where plans, standards, reference docs and data flows live, the ticket tracker, the commands that install, verify and run an isolated copy of the app, the workflow (base branch, worktrees, PR footer) and the design tokens. Run `/setup` in a repo to write it. The contract is [skills/setup/manifest.md](skills/setup/manifest.md).

## Install (opencode and other harnesses)

```bash
git clone https://github.com/pedrotypes/skills ~/src/skills
~/src/skills/scripts/link.sh
```

That symlinks each skill into `~/.agents/skills/<name>`. Afterwards, `git pull` updates them. Re-run `link.sh` when a skill is added or renamed. The update hook is Claude Code only.

## Develop

`scripts/dev-link.sh` loads the working tree as a live plugin under the same name, so edits are picked up in new sessions. Uninstall the marketplace copy first. Run the tests with:

```bash
node --test 'skills/**/*.test.mts' 'hooks/*.test.mts'
```

v1 (`feature`, `back-and-forth`, `land` and the rest) is tagged `v1`.

## Credits

`improve-architecture` is built on [Matt Pocock's skills](https://github.com/mattpocock/skills): his `improve-codebase-architecture` survey, and the vocabulary and deletion test from his `codebase-design`. `retro` is adapted from his `retro`. Both are used under the MIT License, Copyright (c) 2026 Matt Pocock.
