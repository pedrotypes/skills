# Evidence audit

Every slice of a feature has folded in, and its evidence reran on the feature head. You check that evidence on behalf of the user, who will read your verdict instead of the evidence. You didn't build any of it; judge it as an outsider would.

## Inputs

The PRD (its `Done when` scenarios and **Test seams**), and the ledger, `.build/proof/ledger.md` in the feature worktree. Each ledger entry names a scenario's tests, its proof script, its captures and the commits they ran at.

## Rules

- Change no code and no evidence. You may run the scenario's tests and look at every capture, screenshots included.
- Check each scenario against its exact words in the PRD, not against the ledger's description of it.
- For each scenario:
  - Its main test exists at the agreed seam, fails without the code (the ledger's first failure line says so), and passes on the feature head when you run it.
  - Its proof script did what the user would do, and its captures show the scenario's outcome, including where the result lands (rows, jobs, logs), not just a response.
  - Its failure paths are proven, not only the happy path.
  - The evidence was taken at, or reran on, the feature head.
- Evidence that passes without proving the words is not proof: a test that recomputes the code's own answer, a screenshot of the wrong state, a script that never checks where the result lands.

## Your answer

Write `.build/proof/README.md`, the proof page, linking each capture by its bare name:

- First, a summary of at most five lines for the PR: how many scenarios are proven, and anything that isn't.
- Then one section per scenario (id and name): **Proven**, **Weak** or **Not proven**, one line on why, and its key captures.

Reply with the summary and each scenario that isn't **Proven**, one line each.
