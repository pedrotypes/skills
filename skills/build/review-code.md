## Find what's wrong

Review correctness, security (what an attacker or a confused agent controls at each boundary), design, and what the next change will get wrong. Cuts were made in an earlier pass; report only what's wrong. You may run read-only commands, a single test file, or a throwaway script in a temp directory to prove a claim. Don't run the whole suite. Run each check on everything in scope:

1. **Match the PRD's wording.** For every scenario in the PRD, find the code that enforces it and the test that proves it. Compare the code's condition with the scenario's exact words: "under its title" isn't "anywhere in the file". Report code that's looser or stricter than its text, and a scenario with no test for the refused case.
2. **Check lists and rules against the code.** For any allowlist, denylist, glob, path rule, policy or config that says what counts as X: take each rule's stated purpose, search the repository for the code that actually does X, and check the rule covers it.
3. **Treat shell in Markdown as code.** For each command block, check its final exit status and whether the prose around it still holds when a step fails. Cleanup, `echo` or `rmdir` after the important command replace its status. Check zsh and bash.
4. **Check failures both ways.** Errors that make the code less safe than intended (fail open), and failures reported as success: a wrong exit code, a swallowed error, a partial write that looks complete, one exit code meaning two things.
5. **Check races and time.** What changes between a check and the action that relies on it, and who else can change it (another process, another machine, GitHub).
6. **Check tests against claims.** For each behaviour the change claims, some test should fail if you break it.
7. **Check cross-references.** Migration numbers, file names, ids and claims in comments, docs and plans must match what the diff actually contains. A doc the change made false counts.
8. **Check where scenarios meet.** Each scenario is built and tested on its own. Look for one scenario's code breaking another's: shared state, a helper changed for one caller, an order one relies on and another changes, two implementations of the same rule.
9. **Check UI states.** For changed UI: pending, failed and repeated actions (double clicks, closing mid-save, navigating away), keyboard and focus, and accessible names.
10. **Check the design.** Agents copy the code they find, so the shape this change leaves is the pattern the next change imitates. A module has an interface (everything a caller must know to use it) and an implementation; a seam is where behaviour can vary without editing that place, and an adapter fills it; locality means a change, its bug and its test live in one place. For each module the diff adds or changes:
    - **Depth**: its interface is smaller than its implementation, callers don't need its internals (ordering, retries, queries), and a new module passes the deletion test: delete it, and complexity would reappear in every caller.
    - **Locality**: one concept lives in one place. Report a rule spread over several modules, or one that duplicates a rule the repository already has. Search before you claim something is new.
    - **Seams**: a new seam has two adapters (a fake in the tests counts), and no code reaches past a seam into another module's implementation.
    - **Fit**: it does things the way the codebase already does: layering, error handling, data access, naming.
    - **Names**: the nouns the reference docs use, saying what a thing is, not how one caller uses it.
    - **Tests at the interface**: tests cross the seam callers cross, and don't pin the implementation.
    - **The plan's decisions**: what was built matches the plan's decisions, unless the plan logs the departure.

A bug needs a concrete failure: the inputs or state, then the wrong outcome. Trace the call site before you report; a guess that another part "might" break isn't a finding. A design finding names the concrete next change and what goes wrong for it, and the leverage or locality lost, never "cleaner". Categories `bug`, `security`, `test`, `docs` or `design`. `scenario` is the concrete failure.

**Blockers.** Rounds go on until one reports nothing that should block the merge. So severity is your judgement, as a senior engineer who owns this codebase, of whether this change should merge as it is. **P1** and **P2** should block the merge, P1 when it's exploitable, loses or corrupts data, or is wrong on a path users take. **P3**: real, but you wouldn't block the merge for it. **P4**: preference. A design finding is P1 or P2 only when it breaks a written rule in the *Standards* or the plan, and it quotes that rule. Otherwise it's P3, and its `fix` may propose the rule as a new standard.

Your job is to find everything that matters in the whole scope, not a few good findings. Don't stop once you have several. Before you answer, list to yourself every changed file and every check above, and confirm you covered each one. Finding nothing is fine once you've covered everything; don't invent findings or pad with nits.

If the brief lists earlier blockers, mark each in `previous`: `fixed` (the cause is gone; review the fix's new code too), `accepted` (you agree with the dismissal), `partly` or `not fixed`. In `summary`, say what you checked and how.
