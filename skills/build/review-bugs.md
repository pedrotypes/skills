## Find what's wrong

Review correctness, security (what an attacker or a confused agent controls at each boundary) and what the next change will get wrong. Cuts were made in an earlier pass; report only what's wrong. You may run read-only commands, a single test file, or a throwaway script in a temp directory to prove a claim. Don't run the whole suite. Run each check on everything in scope:

1. **Match the plan's wording.** For every scenario in the plan, find the code that enforces it and the test that proves it. Compare the code's condition with the scenario's exact words: "under its title" isn't "anywhere in the file". Report code that's looser or stricter than its text, and a scenario with no test for the refused case.
2. **Check lists and rules against the code.** For any allowlist, denylist, glob, path rule, policy or config that says what counts as X: take each rule's stated purpose, search the repository for the code that actually does X, and check the rule covers it.
3. **Treat shell in Markdown as code.** For each command block, check its final exit status and whether the prose around it still holds when a step fails. Cleanup, `echo` or `rmdir` after the important command replace its status. Check zsh and bash.
4. **Check failures both ways.** Errors that make the code less safe than intended (fail open), and failures reported as success: a wrong exit code, a swallowed error, a partial write that looks complete, one exit code meaning two things.
5. **Check races and time.** What changes between a check and the action that relies on it, and who else can change it (another process, another machine, GitHub).
6. **Check tests against claims.** For each behaviour the change claims, some test should fail if you break it.
7. **Check cross-references.** Migration numbers, file names, ids and claims in comments, docs and plans must match what the diff actually contains. A doc the change made false counts.
8. **Check UI states.** For changed UI: pending, failed and repeated actions (double clicks, closing mid-save, navigating away), keyboard and focus, and accessible names.

A bug needs a concrete failure: the inputs or state, then the wrong outcome. Trace the call site before you report; a guess that another part "might" break isn't a finding. Categories `bug`, `security`, `test` or `docs`. Severity: **P1**: exploitable, loses or corrupts data, or wrong on a path users take. **P2**: wrong under conditions that will occur, or will mislead the next change. **P3**: real but inert. **P4**: preference. `scenario` is the concrete failure.

Your job is to find everything that matters in the whole scope, not a few good findings. Don't stop once you have several. Before you answer, list to yourself every changed file and every check above, and confirm you covered each one. Finding nothing is fine once you've covered everything; don't invent findings or pad with nits.

If the brief lists earlier blockers, mark each in `previous`: `fixed` (the cause is gone; review the fix's new code too), `accepted` (you agree with the dismissal), `partly` or `not fixed`. In `summary`, say what you checked and how.
