# Orchestrate

On the full workflow you run the build and subagents do the work. Your context holds the PRD, the plan, the user's decisions, what's done and what's next. Code, diffs, test output, logs and review JSON stay in subagents and files.

## What you do yourself

- Talk to the user, write the PRD, the plan and the briefs, and decide.
- Read the PRD, the plan, the code map, subagent reports, `git log --oneline` and the summaries the scripts print.
- Run `consult.sh` and `review.sh` in the background. They print short summaries; the detail stays in their files for the subagent that handles it.

If you're about to read a source file, a diff or a log longer than a screen, send a subagent instead.

## What you hand off

Each of these goes to a subagent: `subagent_type: general-purpose` with `model: "opus"`, except the code map, which is `model: "sonnet"`. Never a fork, since a fork inherits your whole context.

- **The code map** (§2): one subagent, with [`research.md`](research.md) as its prompt.
- **Each slice** (§3): one builder, step after step.
- **Rerunning the evidence** (§3): one subagent starts the stack, reruns the proof scripts and reports which pass.
- **The round of fixes** (§4): one subagent, which returns each dismissal with its citation for the review report.
- **Each CI failure or review comment that needs a fix** (§5).

Read-only work (the passes, `Explore` searches) can run in parallel with anything.

## Builders

**A worktree per slice.** Start a slice once every slice it depends on has folded in: `git worktree add <Worktrees>/p<n>-<slug>-<k> -b feat/p<n>-<slug>-<k> feat/p<n>-<slug>`, then *Install* there. Slices with no dependency between them run at the same time, each with its own builder. Don't use the Agent tool's worktree isolation: it branches from your checkout and cleans up on its own.

**One report per step.** A builder stops after each step and reports. You see its token count in the completion. Under about 350k tokens, continue it with `SendMessage` and its next step. Past that, start a fresh builder for the rest of the slice, briefed in full. Before a handover, the worktree is clean at a commit: a half-done merge finished or aborted, uncommitted work saved as a patch in `.build/`.

## The brief

The builder saw nothing, so the brief is complete on its own:

- Its worktree and branch head, and the paths of the PRD, the plan and the code map (`.build/` in the feature worktree).
- Its scope: the slice and its steps, by number and name, and that it stops after each to report.
- The rules it follows: §3 of `${CLAUDE_SKILL_DIR}/SKILL.md`.
- Start from the code map: `.build/research.md` and the earlier builders' additions in `.build/research/`. Search beyond them only for what they don't cover, and write what you found to `.build/research/step-<k>.md` in the feature worktree, so the next builder doesn't search again.
- To prove a scenario (§3): the manifest's *Isolated stack*, *Ready when* and *QA notes*, the `N` and port to use, and the feature worktree's absolute path for `.build/proof/`.
- Before reporting, run *Verify* over the whole suite.

## The report

Ask for at most ten lines, and nothing else:

- each commit, as short sha and subject
- the *Verify* result
- per scenario: the test that failed first (and its failure line), the proof script, and what it captured in `.build/proof/out/`
- any line added under `Changed during implementation`
- what it found and left unfixed, for the backlog (§3)
- whether the step still makes sense against the PRD, and any question it couldn't settle

Don't ask for the diff or test output. When a report says a `Done when` scenario or a directive would have to change, bring it to the user. Otherwise decide, and send the next step.
