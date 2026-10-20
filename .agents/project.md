# Project manifest

## Paths

- Plans: docs/plans/
- Plans index: docs/plans/index.md
- Standards: AGENTS.md
- Reference docs: README.md
- Routing: AGENTS.md

## Tracker

- Kind: none

## Commands

- Install: true
- Verify: node --test 'skills/**/*.test.mts' 'hooks/*.test.mts'
- Extra checks:
  - when shell scripts change: bash -n scripts/*.sh skills/build/*.sh hooks/*.sh
  - when Codex packaging changes: install and discover the plugin with an isolated Codex home

## Workflow

- Base branch: main
- Worktrees: .worktrees/
- Landing: pull request
- Proof media branch: pr-media
