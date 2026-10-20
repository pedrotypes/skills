# Orchestrate

On the full workflow you run the build and subagents do the work. Your context holds the PRD, the plan, the user's decisions, what's done and what's next. Code, diffs, test output, logs and review JSON stay in subagents and files.

## What you do yourself

- Talk to the user, write the PRD, the plan and the briefs, and decide.
- Read the PRD, the plan, the code map, subagent reports, `git log --oneline` and the summaries the scripts print.
- Run `codex.sh` and `pass.sh` in the background. They print short summaries; the detail stays in their files for the subagent that handles it.

If you're about to read a source file, a diff or a log longer than a screen, send a subagent instead.

## What you hand off

Each of these goes to a subagent: `subagent_type: general-purpose` with `model: "opus"`, except the code map, which is `model: "sonnet"`. Never a fork, since a fork inherits your whole context.

- **The code map** (§3): one subagent, with [`research.md`](research.md) as its prompt.
- **The steps** (§4): one builder per chain of dependent steps.
- **Rerunning the evidence** (§4): one subagent starts the stack, reruns the proof scripts and reports which pass.
- **The round of fixes** (§5): one subagent, which returns each dismissal with its citation for the review report.
- **Each CI failure or review comment that needs a fix** (§6).

Read-only work (the passes, `Explore` searches) can run in parallel with anything.

## Builders

**Serial by default.** One builder works in the feature worktree, step after step in the slice's order.

**Parallel when the plan allows.** Steps that share no dependency and no scope form separate chains, once any step they all depend on has landed. Give each chain its own worktree and builder: `git worktree add <Worktrees>/p<n>-<slug>-<chain> -b feat/p<n>-<slug>-<slice>-<chain> feat/p<n>-<slug>-<slice>`, then *Install* there. Don't use the Agent tool's worktree isolation: it branches from your checkout and cleans up on its own.

**Integrate as work lands.** When a chain's step is done, merge its branch into the feature branch in the feature worktree, then run *Verify* over the whole suite there. A conflict or a red suite goes to a subagent as a bug (§4). The next step of that chain starts from the merged feature branch.

**One report per step.** A builder stops after each step and reports. You see its token count in the completion. Under about 350k tokens, continue it with `SendMessage` and its next step. Past that, start a fresh builder for the rest of the chain, briefed in full. Before a handover, the worktree is clean at a commit: a half-done merge finished or aborted, uncommitted work saved as a patch in `.build/`.

## The brief

The builder saw nothing, so the brief is complete on its own:

- Its worktree and branch head, and the paths of the PRD, the plan and the code map (`.build/` in the feature worktree).
- Its scope: the slice, the steps of its chain by number and name, and that it stops after each to report.
- The rules it follows: §4 of `${CLAUDE_SKILL_DIR}/SKILL.md`.
- Start from the code map: `.build/research.md` and the earlier builders' additions in `.build/research/`. Search beyond them only for what they don't cover, and write what you found to `.build/research/step-<k>.md` in the feature worktree, so the next builder doesn't search again.
- To prove a scenario (§4): the manifest's *Isolated stack*, *Ready when* and *QA notes*, the `N` and port to use, and the feature worktree's absolute path for `.build/proof/`. The last step of a slice proves any scenario that only runs once its chains merge.
- Before reporting, run *Verify* over the whole suite (in a parallel worktree, at least the tests of its scope; the full suite runs after the merge).

## The report

Ask for at most ten lines, and nothing else:

- each commit, as short sha and subject
- the *Verify* result
- per scenario: the test that failed first (and its failure line), the proof script, and what it captured in `.build/proof/out/`
- any line added under `Changed during implementation`
- what it found and left unfixed, for the backlog (§4)
- whether the step still makes sense against the PRD, and any question it couldn't settle

Don't ask for the diff or test output. When a report says a `Done when` scenario or a directive would have to change, bring it to the user. Otherwise decide, and send the next step.
