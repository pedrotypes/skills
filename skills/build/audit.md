# Evidence audit

Every slice of a feature has folded in, the base branch is merged, and *Verify* is green on the feature head. You check that each scenario holds, on behalf of the user, who will read your verdict instead of the evidence. Judge it as an outsider would.

## Inputs

- The PRD: its `Done when` scenarios, and the **Test seams** table, whose **Proof** column says what the user agreed would convince them, per scenario.
- The ledger, `ledger.md` beside the PRD. Each entry names a scenario's tests, how the stack was set up, the commands or browser specs that prove it, and the commits they ran at.
- The plan, `.build/plan.md` in the feature worktree, which notes each slice's main-test commit.
- The manifest's *Isolated stack*, *Ready when* and *QA notes*, with your `N` and port.

## Rules

- Change no code. Your own runs write their captures to `.build/proof/out/<scenario id>/`, replacing the builders' there: yours are the PR's evidence.
- Check each scenario against its exact words and its Proof in the PRD, never against the ledger's description of it.
- Note the feature head before you start. If it moves while you work, start again.
- For each scenario:
  - **Red.** Check out its main-test commit in a throwaway worktree, run *Install* there, and run its main tests. They must fail for the reason the Proof expects. For preserved behaviour, they pass there and fail when you break that behaviour on purpose. Remove the worktree after.
  - **Green.** Run its main tests on the feature head: they pass.
  - **Proof.** Where its Proof names a command or browser spec, rerun it on the feature head yourself, starting the stack only if it needs one. It must exit 0, and its captures must show the scenario's outcome, including where the result lands (rows, jobs, logs), not just a response. Look at every screenshot.
  - **Fit.** The proof is the kind the Proof column agreed, and covers the scenario's failure paths, not only the happy path.
- Evidence that passes without proving the words is not proof: a test that recomputes the code's own answer, a screenshot of the wrong state, a proof that never checks where the result lands.
- Stop every stack you start and run its *Cleanup*. Kill only processes you started.

## Your answer

At the top of the ledger, write a summary of at most five lines:
- first, who audited, and whether they built or planned any of this work
- the feature head you judged
- how many scenarios are proven, and anything that isn't

Under each scenario's ledger entry, write its verdict, **Proven**, **Weak** or **Not proven**, with one line on why and which checks you ran yourself.

Then write `.build/proof/README.md`, the proof page: the same summary, then one section per scenario with its verdict and key captures, each linked by its `out/<scenario id>/<file>` path.

Reply with the summary and each scenario that isn't **Proven**, one line each.
