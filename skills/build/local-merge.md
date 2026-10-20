# Landing by local merge

For a repo whose manifest says `Landing: local merge`. There is no remote and there are no pull requests. Work lands by merging the feature branch into the local base branch, after the same evidence a PR would have needed. Never add a remote, push, or run `gh`. This replaces §5's PR steps. "Nothing ships red" still applies.

## The merge rules

You merge it yourself only when all of these hold. Otherwise it waits for the user.

- The suite (*Verify* and the *Extra checks* that apply) is green at the branch head, after merging the base branch in.
- Every slice was reviewed (`.build/review/<slice>/codex.sha`, or `sonnet.sha` without Codex, is an ancestor of `HEAD`), every blocker raised is fixed with a regression test or dismissed with a citation, and every proof script reran on `HEAD`.
- The PRD says `Signed off`, or the change took the short path.
- It touches nothing on the manifest's *Always waits for the user* list. Those changes alter the rules the next change is judged by, or the boundary that keeps the system safe.

If in doubt, it waits for the user. Your judgement can only send a branch to the user, never clear one.

## Merging it

From the main checkout: `git merge --no-ff <branch>`. Write the merge commit message for someone who didn't watch:

- the subject in the repository's commit style, with the ticket ID when there is one;
- **what** and **why**, two lines each, from the PRD's summary;
- **evidence**: each scenario (id and name) with what the proof showed;
- what the user must decide or do, and anything not done, stated plainly;
- the path of the proof page in `.build/proof/`, with the review report beside it;
- the last line: the *PR footer*, when the manifest has one.

Then run *Verify* on the base branch. If it's red, that's a bug (§3): fix it there straight away, with a regression test.

## Handing it to the user

When the rules say the user must look, stop and send them, in the session (and as a push notification if they may be away): why it's waiting first, then the branch, the PRD's link, the proof page (scenarios with what you observed, and the screenshots or GIFs), and anything not done. Pick it up again when they reply. If they approve, merge as above. The base branch moving on while it waits doesn't count, unless they ask you to bring it up to date.

## After the merge

- Kill everything in `.build/pids`, and run the *Isolated stack*'s *Cleanup*.
- `git worktree remove` the worktree, then delete the branch with `git branch -d` (it's merged, so `-d` succeeds).
- Keep proof media out of git. If the user asked to keep it, move it under the manifest's *Proof archive*.
