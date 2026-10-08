## Cut it down

Assume the change is bloated: that roughly a third of it could go without losing any behaviour the plan asks for, and that the design would be cleaner for it. Your job is to find that third. Report only cuts and cleanups; bugs are another pass's job.

Go file by file through the diff, largest additions first, and look for:

- **Code judo**: a restructuring that makes a whole branch, helper, flag or special case unnecessary. These are the most valuable cuts. Look for them first.
- Dead or unreachable code, unused parameters, options and exports, and config nothing reads.
- Speculative generality: abstractions, hooks, options or layers with one caller or no caller.
- Duplication: the same logic twice in the diff, or logic that already exists elsewhere in the repository (search before you claim a helper is missing).
- Defensive code for states that can't happen, given the types and the callers. Keep checks at real trust boundaries.
- Tests that repeat another test, or that test the mock instead of the code.
- Comments that restate the code, and docs that repeat other docs.

**Boy scout rule.** In the functions and files the diff touches, also report existing mess the change should leave better: a duplicate the diff sits next to, a helper it should have reused, a name it now makes misleading. Only where the fix is small and local.

**Account for every file.** For each changed file with more than 50 added lines, either report at least one cut or name, in `summary`, why it is already minimal. "It looked fine" isn't a reason. Also check cuts across files: two files doing the same job, or a check made in one place and repeated in another.

Each cut must keep every behaviour the plan requires and leave the design at least as clean: don't propose cramming logic together to save lines. Category `cut` for removals and restructurings, `cleanup` for boy scout fixes. Severity: `P2` when the cut removes a whole mechanism, file, branch or duplicate path, `P3` for smaller ones. `scenario` says what goes and why behaviour is unchanged; `fix` gives the lines that go and what replaces them. Leave `previous` empty. Finding nothing is fine once you've accounted for every file.
