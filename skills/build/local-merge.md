# Landing by local merge

For a repo whose manifest says `Landing: local merge`. There is no remote and there are no pull requests. Work lands by merging the feature branch into the local base branch, after the same evidence a PR would have needed. Never add a remote, push, or run `gh`. This replaces §7's PR steps. "Nothing ships red" still applies.

## The merge rules

You merge it yourself only when all of these hold. Otherwise it waits for the user.

- The suite (*Verify* and the *Extra checks* that apply) is green at the branch head, after merging the base branch in.
- The last Codex round covers the branch head (`round-<n>.sha` equals `git rev-parse HEAD`) and left no open blocker. Nothing changed after it.
- The plan says `Plan review: before build`, or the change took the short path.
- It touches nothing on the manifest's *Always waits for the user* list. Those changes alter the rules the next change is judged by, or the boundary that keeps the system safe.

If in doubt, it waits for the user. Your judgement can only send a branch to the user, never clear one.

## Merging it

From the main checkout: `git merge --no-ff <branch>`. Write the merge commit message for someone who didn't watch:

- the subject in the repository's commit style, with the ticket ID when there is one;
- **what and why**, from the plan's summary;
- **plan vs. built**: each scenario ✅ or ❌, plus every `Changed during implementation` line;
- **review**: rounds run, cuts taken and skipped (with why), blockers fixed (with commits), findings dismissed and why, open P3s;
- **not done**, stated plainly;
- the last line: the *PR footer*, when the manifest has one.

Then run *Verify* on the base branch. If it's red, that's a bug (§4): fix it there straight away, with a regression test.

## Handing it to the user

When the rules say the user must look, stop and send them, in the session (and as a push notification if they may be away): the branch, the plan's path, the proof (scenarios with what you observed, and the screenshots or GIFs), the review result, why it's waiting, and anything not done. Pick it up again when they reply. If they approve, merge as above. The base branch moving on while it waits doesn't count, unless they ask you to bring it up to date.

## After the merge

- Kill everything in `.build/pids`, and run the *Isolated stack*'s *Cleanup*.
- `git worktree remove` the worktree, then delete the branch with `git branch -d` (it's merged, so `-d` succeeds).
- Keep proof media out of git. If the user asked to keep it, move it under the manifest's *Proof archive*.
