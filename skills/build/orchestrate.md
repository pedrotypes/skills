# Orchestrate

On the full workflow you run the build and subagents do the work. Your context holds the PRD, the plan, the user's decisions, what's done and what's next. Code, diffs, test output, logs and review JSON stay in subagents and files.

## Host compatibility

Use the host running this skill, regardless of which CLIs are installed:

| Instruction | Claude Code | Codex |
|---|---|---|
| Skill invocation | `/build`, `/setup`, `/retro` | Invoke the named skill with `$build`, `$setup`, `$retro` or its installed name |
| Skill directory (`S`) | `${CLAUDE_SKILL_DIR}` | The directory containing the active skill's `SKILL.md`, from its installed location; resolve symlinks |
| `Explore`, `general-purpose`, `Agent`, `SendMessage` | Named Claude tools and agent types | Available delegation and messaging tools; fresh context, read-only for exploration and review |
| Opus/Sonnet roles | Named Claude models | Codex agents; use gpt-6.1-sol at medium effort for coding, or the host's available model |
| Second opinion | `consult.sh`, or a fresh subagent without Codex | Deliberately critique the brief, alternatives and draft questions yourself; write `.build/consult-answer.md` and identify it as a current-session critique |
| Review host (`REVIEW_HOST`) | `claude` | `codex` |

Set `S` to the active skill's absolute directory before running its helpers. Resolve sibling skills from that directory. In Codex, `${CLAUDE_SKILL_DIR}` in a brief means this resolved path; replace it with the absolute path before delegating. Never depend on that environment variable in Codex. Read a referenced skill's `SKILL.md` before invoking it.

Under Codex, use Codex for every role and never invoke Claude helpers. Always pass `codex` as `review.sh`'s fifth argument, even when Claude is installed; use an empty fourth argument when no base ref is supplied. Do not call `codex.sh review` to review yourself. If delegation or a required reviewer is unavailable, perform its prompt yourself and name the substitution; never claim independent review or mark unavailable evidence as passed. Keep every evidence and landing gate.

## What you do yourself

- Talk to the user, write the PRD, the plan and the briefs, and decide.
- Read the PRD, the plan, the code map, subagent reports, `git log --oneline` and the summaries the scripts print.
- Run `consult.sh` (Claude host only) and `review.sh` in the background. They print short summaries; the detail stays in their files for the subagent that handles it.

If you're about to read a source file, a diff or a log longer than a screen, send a subagent instead.

## What you hand off

Use the host mapping above. In Claude Code, each of these goes to a subagent: `subagent_type: general-purpose` with `model: "opus"`, except the code map, which is `model: "sonnet"`. Never a fork, since a fork inherits your whole context.

- **The code map** (§2): one subagent, with [`research.md`](research.md) as its prompt.
- **Each slice** (§3): one builder, step after step.
- **Rerunning the evidence** (§3): one subagent starts the stack, reruns the proof scripts and reports which pass.
- **The round of fixes** (§4): one subagent, which returns each dismissal with its citation for the review report.
- **Each CI failure or review comment that needs a fix** (§5).

Read-only work (the passes, `Explore` searches) can run in parallel with anything.

## Builders

**A worktree per slice.** Start a slice once every slice it depends on has folded in: `git worktree add <Worktrees>/p<n>-<slug>-<k> -b feat/p<n>-<slug>-<k> feat/p<n>-<slug>`, then *Install* there. Slices with no dependency between them run at the same time, each with its own builder. Don't use the Agent tool's worktree isolation: it branches from your checkout and cleans up on its own.

**One report per step.** A builder stops after each step and reports. Use its reported token count when available; otherwise start fresh when context becomes crowded. Under about 350k tokens, continue it with the host's messaging tool and its next step. Past that, start a fresh builder for the rest of the slice, briefed in full. Before a handover, the worktree is clean at a commit: a half-done merge finished or aborted, uncommitted work saved as a patch in `.build/`.

## The brief

The builder saw nothing, so the brief is complete on its own:

- Its worktree and branch head, and the paths of the PRD, the plan and the code map (`.build/` in the feature worktree).
- Its scope: the slice and its steps, by number and name, and that it stops after each to report.
- The rules it follows: §3 of `${CLAUDE_SKILL_DIR}/SKILL.md`.
- Start from the code map: `.build/research.md` and the earlier builders' additions in `.build/research/`. Search beyond them only for what they don't cover, and write what you found to `.build/research/step-<k>.md` in the feature worktree, so the next builder doesn't search again.
- To prove a scenario (§3): the manifest's *Isolated stack*, *Ready when* and *QA notes*, the `N` and port to use, and the feature worktree's absolute path for `.build/proof/`.
- While working, and before reporting a step, run *Test changed* (without it, the test files the step touched). After the slice's last step, run *Verify* over the whole suite, once.

## The report

Ask for at most ten lines, and nothing else:

- each commit, as short sha and subject
- the *Test changed* result, and after the slice's last step the *Verify* result
- per scenario: the test that failed first (and its failure line), the proof script, and what it captured in `.build/proof/out/`
- any line added under `Changed during implementation`
- what it found and left unfixed, for the backlog (§3)
- whether the step still makes sense against the PRD, and any question it couldn't settle

Don't ask for the diff or test output. When a report says a `Done when` scenario or a directive would have to change, bring it to the user. Otherwise decide, and send the next step.
