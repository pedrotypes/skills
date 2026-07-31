# Skills

A distributable set of agent skills for engineering, management and productivity.

## Install (Claude Code)

```bash
claude plugin marketplace add pedrotypes/skills
claude plugin install skills@pedrotypes
```

Update on any machine:

```bash
claude plugin marketplace update pedrotypes && claude plugin update skills@pedrotypes
```

No `version` is set in the manifest, so the plugin is versioned by git commit SHA — every push to `main` is picked up by `plugin update`. Pin releases later by adding `version` to `.claude-plugin/plugin.json`.

Skills appear namespaced, e.g. `/pedrotypes-skills:feature` — the prefix comes from `name` in `plugin.json`, while the install id (`skills@pedrotypes`) comes from the marketplace entry, so the two intentionally differ.

## Install (opencode and other harnesses)

opencode has no plugin equivalent, so link the skills into a directory it scans:

```bash
git clone https://github.com/pedrotypes/skills ~/src/skills
~/src/skills/scripts/link.sh
```

That symlinks each skill into `~/.agents/skills/<name>`, which opencode reads alongside `~/.claude/skills`. Afterwards `git pull` is enough to update; re-run `link.sh` only when a skill is added or renamed.

Codex CLI has no skills mechanism (it has its own separate plugin marketplace), so these are not wired into it yet.

## Skills list

| Skill | Purpose |
| --- | --- |
| `feature` | Bootstrap a new feature: name it, allocate its number, cut an isolated worktree, stub its research and plan files, hand over to `back-and-forth`. |
| `back-and-forth` | The conversational spine — rough idea to landed code: research, pressure-test into a PRD, design, implement, land. Resumes work in progress at whatever stage it reached. |
| `land` | Finish the work: identify the feature, rebase onto the base branch and work conflicts through with the user, capture the change into the knowledge base, retrospective, one confirmation gate, then merge and remove the worktree. |
| `code-research` | Map what the codebase is today in the areas a change touches, via parallel read-only subagents. Reports findings; the caller decides where they land. |
| `program-design` | Draw the shape of the code — file-tree diff, call map, interfaces and key signatures, libraries, tests. Reports the design; the caller decides what to do with it. |
| `adversarial-review` | Independent second opinion on a PRD, design, plan or branch diff, run context-free in a Codex (or Opus) subagent and fed back as findings. |
| `kb-init` | Make sure the project has an agent-maintained knowledge base in Open Knowledge Format, and record its paths in `AGENTS.md` for every later skill to read. |
| `kb-maintain` | Keep that knowledge base true: work out which document types a change affects, learn each type's local conventions, then draft, confirm and apply the updates. |

## Layout

```
.claude-plugin/
  plugin.json        # plugin manifest — `name` sets the skill namespace prefix
  marketplace.json   # makes this repo its own single-plugin marketplace
skills/
  engineering/<skill>/SKILL.md
scripts/link.sh      # symlink skills for opencode and other harnesses
scripts/dev-link.sh  # load the working tree as a live Claude Code plugin
```

Adding a new category directory under `skills/` means adding it to `skills` in `plugin.json`. Skills inside an already-listed category are picked up automatically.

## Development

```bash
scripts/dev-link.sh               # load the working tree as a live plugin
claude plugin validate .          # checks both manifests and skill frontmatter
```

`dev-link.sh` symlinks the repo to `~/.claude/skills/pedrotypes-skills`. Claude Code loads any directory there containing `.claude-plugin/plugin.json` as a plugin (`pedrotypes-skills@skills-dir`), read straight off disk — so edits are live and skills resolve under the same `/pedrotypes-skills:<skill>` namespace they will have once published. Start a new session to pick up changes to a skill's name or description; `scripts/dev-link.sh --unlink` undoes it.

Uninstall the marketplace copy while developing — an installed plugin claims the name and the linked copy then silently does not load:

```bash
claude plugin uninstall skills@pedrotypes
```

Don't develop against an install. It copies the repo into `~/.claude/plugins/cache/` keyed by HEAD's commit SHA, and `plugin update` is a no-op until that SHA changes, so uncommitted edits never reach it. To sanity-check the real install path before publishing, install from the local marketplace (`claude plugin marketplace add "$PWD" && claude plugin install skills@pedrotypes`) after committing, then switch back to the GitHub source with `claude plugin marketplace remove pedrotypes` and re-adding `pedrotypes/skills`.

For a one-off check without touching global state: `claude --plugin-dir "$PWD"`.
