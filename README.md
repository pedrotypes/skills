# Skills

A distributable set of LLM skills for engineering, management and productivity.

## Install (Claude Code)

```bash
claude plugin marketplace add pedrotypes/skills
claude plugin install pedrotypes-skills@pedrotypes
```

Update on any machine:

```bash
claude plugin marketplace update pedrotypes && claude plugin update pedrotypes-skills
```

No `version` is set in the manifest, so the plugin is versioned by git commit SHA — every push to `main` is picked up by `plugin update`. Pin releases later by adding `version` to `.claude-plugin/plugin.json`.

Skills appear namespaced, e.g. `/pedrotypes-skills:feature`.

## Install (opencode and other harnesses)

opencode has no plugin equivalent, so link the skills into a directory it scans:

```bash
git clone https://github.com/pedrotypes/skills ~/src/skills
~/src/skills/scripts/link.sh
```

That symlinks each skill into `~/.agents/skills/<name>`, which opencode reads alongside `~/.claude/skills`. Afterwards `git pull` is enough to update; re-run `link.sh` only when a skill is added or renamed.

Codex CLI has no skills mechanism (it has its own separate plugin marketplace), so these are not wired into it yet.

## Layout

```
.claude-plugin/
  plugin.json        # plugin manifest — `skills` points at each category dir
  marketplace.json   # makes this repo its own single-plugin marketplace
skills/
  engineering/<skill>/SKILL.md
scripts/link.sh
```

Adding a new category directory under `skills/` means adding it to `skills` in `plugin.json`. Skills inside an already-listed category are picked up automatically.

## Development

```bash
claude plugin validate .          # checks both manifests and skill frontmatter
claude plugin marketplace add "$PWD" && claude plugin install pedrotypes-skills@pedrotypes
```

Installing from a local path lets you test edits without pushing. Switch back to the GitHub source with `claude plugin marketplace remove pedrotypes` and re-adding `pedrotypes/skills`.
