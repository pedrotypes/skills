# QA

Final head: 4aa2beaa397aa1eaecf12f86a68441c3222589c2.

A Codex worker performed three CLI QA rounds in temporary source snapshots and isolated Codex homes outside the repository. No user configuration was changed and no Claude helpers ran.

Round 1 found Q1-1: Codex discovered Claude's update hook. Round 2 showed an empty array did not disable hook discovery. Round 3 repeated the full installation, discovery, resource, invocation-policy and same-version update campaign with an inline empty hook definition; Q1-1 is fixed and blockers are zero.

The Git source was an isolated localhost HTTP fixture. app-server skills/list discovered the four enabled plugin skills and plugin/read returned no hooks. A model-free thread initialized successfully. See [package summary](package-summary.md) and [reproducible proof](package-cli.py).

No model turns, desktop UI interaction, public GitHub delivery after merge, or live Claude execution were performed. Conversational model selection and complete model-driven execution of all four workflows remain unverified. CLI stubs cover both review hosts and failure paths; the repository suite passes all 41 tests.
