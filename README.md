# Skills

Pedro's skills for coding agents. They take a feature from idea to a merge-ready PR, and keep the codebase and the agent's environment from rotting along the way.

## Skills

| Skill | Purpose |
| --- | --- |
| `build` | Idea to one merge-ready PR, built in thin slices. Size the change, agree on a short Markdown PRD the user signs off, map the code and cut the plan into vertical slices. Per slice, in parallel where it can: fresh builders build it test-first and prove each scenario on a running stack, the evidence is rerun, Sonnet and Codex review it once, one round of fixes, then it folds into the feature branch. Then one short what-why-evidence PR, babysat until it's ready to merge. |
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

## Install (Codex)

Paste this into a Codex session:

> Install the pedrotypes skills plugin from https://github.com/pedrotypes/skills for my user account. Run `codex plugin marketplace add pedrotypes/skills`, then `codex plugin add pedrotypes-skills@pedrotypes`. Verify that build, setup, improve-architecture and retro are available. Tell me if I need to start a new session.

Or run in a terminal:

```bash
codex plugin marketplace add pedrotypes/skills
codex plugin add pedrotypes-skills@pedrotypes
```

Use a Codex release with `codex plugin add` (tested with CLI 0.163.0). Start a new session after installation. Claude Code is not required.

Say “let's build…” and Codex can select the build skill from its description. To select it explicitly, use `$pedrotypes-skills:build`; setup, retro and improve-architecture use the same prefix. Retro and architecture review require an explicit request.

**Updates.** Paste this into Codex:

> Update my pedrotypes skills plugin. Run `codex plugin marketplace upgrade pedrotypes`, then `codex plugin add pedrotypes-skills@pedrotypes`. Verify the installed skills and tell me to start a new session.

Or run:

```bash
codex plugin marketplace upgrade pedrotypes
codex plugin add pedrotypes-skills@pedrotypes
```

Start a new session to load the updated skills. Updates are manual. Repeating `plugin add` refreshes the installed files, including when the package version is unchanged.

For a team, put these installation instructions in the repo's onboarding docs. Each teammate installs the plugin for their own account.

Codex installation follows the [official plugin packaging guide](https://developers.openai.com/plugins/build/plugins). Conversational selection and explicit invocation follow the [official skills guide](https://learn.chatgpt.com/docs/build-skills).

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
