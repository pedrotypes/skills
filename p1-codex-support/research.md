# Code map

- .claude-plugin/plugin.json and marketplace.json: Claude distribution.
- scripts/link.sh: shared ~/.agents/skills symlinks.
- skills/build/review.sh and review.test.mts: mandatory Claude runner and review evidence checks.
- skills/build/orchestrate.md: worker roles, currently Claude tool names.
- skills/*/SKILL.md: triggers and workflows; retro reads Claude session JSONL.
- .github/workflows/test.yml: Node 24 suite skills/**/*.test.mts and hooks/*.test.mts.

Mapped by the current session and the read-only Codex compatibility worker.
