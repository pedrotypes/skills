# Codex package QA

Head: `4aa2beaa397aa1eaecf12f86a68441c3222589c2`. CLI: `0.163.0`.

- **P1-S1 Install:** Passed real Git marketplace add, plugin install, discovery of all four enabled skills, bundled helper checks, and changed Git source upgrade/reinstall at unchanged version `1.0.0`. Fixture uses localhost HTTP and an archived commit outside the repository with isolated `CODEX_HOME`.
- **P1-S2 Build:** Installed build metadata allows implicit invocation; supporting review helpers are present. Thread creation succeeds without model calls. Package QA does not exercise conversational selection, delegation, or review failure gates; controlled helper tests belong to the repository suite.
- **P1-S3 Inspect:** Architecture and retro install and discover successfully. Installed metadata disables implicit invocation. Model-driven architecture/retro execution and missing-session behavior are not exercised here.
- **P1-S4 Both hosts:** Codex installation, discovery and Git update work without invoking Claude. Claude installation/execution is not exercised by this campaign; dual-host helper behavior belongs to the repository suite.

Q1-1 fixed: `plugin/read` exposes no hooks after the explicit empty hook definition. An empty array failed to suppress default hook discovery; the inline definition passed live CLI verification.

No user account credentials, session records or real remote writes were used. Public GitHub delivery and live model execution remain unverified. CLI reported temporary-home PATH alias refusal and fallback to bundled bubblewrap; neither blocked these operations.

Reproduce: `python3 .build/qa/proof/package-cli.py`. Evidence: `.build/proof/package-cli/evidence.json`; filtered skill discovery is also recorded in that file.
