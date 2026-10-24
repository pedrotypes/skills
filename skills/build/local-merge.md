# Landing by local merge

For a repo whose manifest says `Landing: local merge`. There is no remote and there are no pull requests. Work lands by merging the feature branch into the local base branch, after the same evidence a PR would have needed. Never add a remote, push, or run `gh`. This replaces §5's PR steps. "Nothing ships red" still applies.

## The merge rules

You merge it yourself only when all of these hold. Otherwise it waits for the user.

- The suite (*Verify* and the *Extra checks* that apply) is green at the branch head, after merging the base branch in.
- Every slice was reviewed (`.build/review/<slice>/review.sha` is an ancestor of `HEAD`), every blocker raised is fixed with a regression test or dismissed with a citation, and the audit calls every scenario **Proven** at `HEAD`, up to commits that touch only the ledger. On the short path, the review is settled instead.
- The PRD says `Signed off`, or the change took the short path.
- It touches nothing on the manifest's *Always waits for the user* list. Those changes alter the rules the next change is judged by, or the boundary that keeps the system safe.

If in doubt, it waits for the user. Your judgement can only send a branch to the user, never clear one.

## Merging it

From the main checkout, merge the branch with a merge commit. Write the merge commit message for someone who didn't watch:

- the subject in the repository's commit style, with the ticket ID when there is one;
- **what** and **why**, two lines each, from the PRD's summary;
- **evidence**: the audit's summary, with the commit it judged and who audited, and each scenario (id and name) with its verdict;
- what the user must decide or do, and anything not done, stated plainly;
- the path of the proof page in `.build/proof/`, with the review report beside it;
- the last line: the *PR footer*, when the manifest has one.

Then run *Verify* on the base branch. If it's red, that's a bug (§3): fix it straight away by the short path, with a regression test.

## Handing it to the user

When the rules say the user must look, stop and send them, in the session (and as a push notification if they may be away): why it's waiting first, then the branch, the PRD's link, the proof page (scenarios with what you observed, and the screenshots or GIFs), and anything not done. Pick it up again when they reply. If they approve, merge as above. If the base branch moved on while it waited, merge it in and follow "Nothing ships red" before merging.

## After the merge

- Kill everything in `.build/pids`, and run the *Isolated stack*'s *Cleanup*.
- Remove the worktree and delete the merged branch.
- Keep proof media out of git. If the user asked to keep it, move it under the manifest's *Proof archive*.
