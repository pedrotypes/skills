# P1 Codex support: plan

## Decisions

Use shared skills with native Codex packaging and explicit host selection for review. Retain the default Claude execution path. Keep new tests under the existing test glob.

## Slice 1: Host compatibility

- Depends on: none
- Serves: P1-S2 Build, P1-S3 Inspect, P1-S4 Both hosts
- Scope: review helper/tests; skill instructions and Codex metadata, separate workers.
- Proof: CLI stubs demonstrate Codex-only execution and failure handling; inspect all host paths.

## Slice 2: Distribution

- Depends on: Slice 1
- Serves: P1-S1 Install
- Scope: Codex plugin and marketplace, README, package tests.
- Proof: real Codex install and refresh in an isolated home, inspect installed skill files.

## Feasibility

Installed CLI 0.163.0 supports plugin marketplace add/upgrade and plugin add. Official packaging docs support compatibility manifests and local marketplace source.path. Native directory discovery uses ~/.agents/skills. Existing review tests provide executable CLI stubs.

## Changed during implementation
