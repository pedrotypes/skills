# QA

Head: `0787e95a0a6873704ff886fa6d1a911a9370d6f9`.
Base: `98e271714f535bb54599b9240e254ca84ebac262` (`origin/main` merge base).
Result: PASS; no concrete findings.

A separate Codex QA agent read the entire nine-file diff, AGENTS.md, .agents/project.md, the build review.md prompt, the plan and consult, the proof script, changed tests and related packaging files. No tracked files or real user configuration were changed.

- Ran `python3 .build/qa/proof/package-cli.py` successfully with Codex CLI 0.163.0. The source is a committed-head archive served from a temporary Git fixture; every Codex invocation uses a temporary CODEX_HOME.
- Native marketplace add and plugin add report version 3.0.0. The installed Claude manifest and marketplace entry also report 3.0.0; the installed tree excludes scripts/link.sh and contains the required helpers.
- The real app-server lists build, improve-architecture, retro and setup under pedrotypes-skills. Installed invocation-policy YAML matches the intended policy; plugin/read reports no Claude hooks. Starting a thread succeeds without a model turn.
- A changed Git fixture with unchanged package version refreshes through marketplace upgrade and repeated plugin add; the installed marker is present and the manifest remains 3.0.0.
- Read .build/verify.log: all 60 tests pass, including semantic version comparison, malformed responses, request failure, legacy commit checks, host manifest agreement and shared-linker absence. Ran the manifest shell syntax check successfully.
- Searched the repository for shared-linker paths and cross-host skill-directory references. The retained scripts/dev-link.sh is Claude-only development tooling; no active shared-linker instructions remain.
- Checked error exits, release versions, command blocks, references, input boundaries, races, policy/code agreement and proof coverage across the full diff.

Limits: Claude Code native installation and its live GitHub SessionStart hook were not exercised. Hook behavior is covered by the existing successful subprocess tests with stub curl. Codex runtime model selection and explicit skill invocation were not exercised; discovery and installed invocation metadata were verified. Machine-wide cleanup is outside this tracked QA pass. No unavailable check is marked passed.

Raw proof: package-cli/evidence.json, package-cli/skills-list.json and package-cli/app-server.stderr.
