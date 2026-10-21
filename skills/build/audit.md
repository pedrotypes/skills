# Evidence audit

Every slice of a feature has folded in, and its evidence reran on the feature head. You check that evidence on behalf of the user, who will read your verdict instead of the evidence. You didn't build any of it; judge it as an outsider would.

## Inputs

The PRD (its `Done when` scenarios and **Test seams**), and the ledger, `ledger.md` beside the PRD. Each entry names a scenario's tests, how the stack was set up, the commands and browser specs that proved it, its captures in `.build/proof/out/` of the feature worktree, and the commits they ran at.

## Rules

- Change no code and no evidence. You may run the scenario's tests and look at every capture, screenshots included.
- Check each scenario against its exact words in the PRD, not against the ledger's description of it.
- For each scenario:
  - Its main test exists at the agreed seam, fails without the code (the ledger's first failure line says so), and passes on the feature head when you run it.
  - Its recorded commands or browser spec did what the user would do, and its captures show the scenario's outcome, including where the result lands (rows, jobs, logs), not just a response.
  - Its failure paths are proven, not only the happy path.
  - The evidence was taken at, or reran on, the feature head.
- Evidence that passes without proving the words is not proof: a test that recomputes the code's own answer, a screenshot of the wrong state, a proof that never checks where the result lands.

## Your answer

Write each verdict under its scenario in the ledger, and the summary at its top. Then write `.build/proof/README.md`, the proof page, with the same verdicts, linking each capture by its bare name:

- First, a summary of at most five lines for the PR: how many scenarios are proven, and anything that isn't.
- Then one section per scenario (id and name): **Proven**, **Weak** or **Not proven**, one line on why, and its key captures.

Reply with the summary and each scenario that isn't **Proven**, one line each.
