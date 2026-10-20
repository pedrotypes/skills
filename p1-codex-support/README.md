# P1 Codex support: proof

Head: 4aa2beaa397aa1eaecf12f86a68441c3222589c2. Captured on Linux with Codex CLI 0.163.0.

- **P1-S1 Install:** Real CLI installation and same-version update through an isolated localhost Git marketplace; all four packaged skills discovered. [Package QA](package-summary.md).
- **P1-S2 Build:** Build permits implicit invocation. Host mapping resolves helpers and selects Codex workers and reviewers. Stub CLI tests verify review failures and changed HEAD/tree cannot publish completed evidence. [Tests](verify.log).
- **P1-S3 Inspect:** Retro and architecture review disable implicit invocation. Shared host instructions use Codex tools; retro reports inaccessible session evidence. [Package QA](package-summary.md).
- **P1-S4 Both hosts:** 41 tests pass, including Claude absent, Claude present but uncalled under Codex, original Claude review mode, schema errors, CLI failures, dirty trees and changed commits. [Tests](verify.log).

Live model selection from a conversational prompt and complete model-driven runs of all four skills were not exercised. Package discovery and invocation policy were checked with the real Codex app-server; review execution and failure handling were checked with CLI stubs.

[QA report](qa.md) · [Review report](review.md) · [Plan](plan.md) · [Code map](research.md)
