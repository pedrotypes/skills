# Code map

- scripts/link.sh: shared skill symlinks; remove.
- scripts/dev-link.sh: single-host Claude development link; retain.
- .claude-plugin/plugin.json and marketplace.json: Claude release identity.
- .codex-plugin/plugin.json: Codex release identity.
- skills/build/plugin.test.mts: existing package regression tests.
- README.md: independent host install/update instructions and release policy.
- AGENTS.md: maintainer rules.

Machine inspection: the eight pedrotypes symlinks are absent; Codex global instructions still referenced the shared linked installation and are corrected locally. No related shell, cron or user-service automation was found in the inspected locations. Other skill installations are unaffected.
