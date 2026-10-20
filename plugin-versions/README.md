# Plugin versions and independent installation

Head: 0787e95a0a6873704ff886fa6d1a911a9370d6f9. Tested on Linux with Codex CLI 0.163.0.

Both plugin manifests and the Claude marketplace entry identify release 3.0.0. Real Codex installation and discovery return 3.0.0, preserve all four skills, exclude the shared linker and register no Claude hooks. An isolated Git marketplace update refreshes the cache successfully.

The global Codex working agreements use the independently installed Codex plugin. No pedrotypes skill symlinks remain in the inspected agent directories; no related shell, cron or user-service automation was found. This machine-only configuration change is outside the repository diff.

All 60 tests pass, including matching semantic versions and the updater's stable version comparisons, equal/older releases, malformed responses, request failures, throttling and legacy hash installs. All remaining shell scripts pass syntax checks.

[QA](qa.md) · [Cuts](cuts.md) · [Review](review.md) · [Test output](verify.log) · [Proof script](package-cli.py) · [Plan](plan.md) · [Code map](research.md)

Save the proof script as .build/qa/proof/package-cli.py in this checkout to rerun it. Claude CLI execution, public delivery after merge and model-driven workflows were not exercised. Release publication requires merging the PR and creating the matching v3.0.0 tag; existing tags stay immutable.
