---
name: retro
description: Look back over a coding session and propose changes to the agent's environment — a check, a pointer, a reviewer rule, a skill step, a deletion — so the next session doesn't repeat what went wrong. Use at the end of a session that was harder than it should have been. Proposes only; changes nothing until the user picks. User-invoked only.
disable-model-invocation: true
---

# Retro

You improve the environment the agent works in, not the code it wrote. The bug the agent shipped, the file it took twenty tool calls to find, the rule the reviewer missed: you don't fix those. You ask what in the repo let them happen, and propose what stops it next time. Adapted from Matt Pocock's `retro` skill.

## 1. Read the session

Default to the current session. If the user names another one, find it among this repo's session records, which include the ones run in its worktrees. List them newest first, then `grep -l` for a branch, ticket or phrase they gave:

```bash
ls -t ~/.claude/projects/"$(git rev-parse --path-format=absolute --git-common-dir | sed 's#/\.git$##; s#[/.]#-#g')"*/*.jsonl
```

Read the record itself, not your memory of it. By the end of a long session you'll have forgotten the struggles in the middle, and those are the findings.

Look for the moments that cost something: a long search, a wrong turn that was later undone, a test that went red in CI but not locally, a review finding that a check could have caught, a question to the user that the docs should have answered, a tool call that returned far more than it was worth, a step of a skill that didn't fit.

**Every candidate cites its moment**: what happened, and roughly where in the session. A candidate you can't trace to a moment is generic advice. Drop it. A smooth session has little to teach, so a short list, or none, is a fine result.

## 2. Classify, then pick the destination

| What went wrong | The fix |
|---|---|
| The agent took long to find a file or a fact | A **navigation pointer** from a file it already reads: a row in the manifest's *Routing* file, a link from the Reference doc it did read |
| It made a mistake a tool could catch | An **automated check** (below) |
| The reviewer missed a judgement call | A **reviewer rule** (below) |
| `AGENTS.md` or `CLAUDE.md` carries instructions, not pointers | Move them into a standard, a check or a skill. These load into every session and holds navigation pointers and little else |
| A tool call was expensive for what it returned | Streamline it: a script in the skill, a narrower command, a better default |
| A steering line changes nothing about behaviour | Delete the **no-op** |
| The agent couldn't reach information it needed | Widen access: tee a log to a file, add a read-only command, document where it lives |
| A step of a skill was wrong, missing or ignored | Change the skill. A skill from the pedrotypes plugin changes in the [pedrotypes/skills](https://github.com/pedrotypes/skills) repo, not here |
| The manifest was wrong or missing a line | Fix `.agents/project.md` (`/setup`) |

**Mechanical violations get a check, not a sentence.** A banned construct, an import direction, a file location, a colour literal: a check fails, prose doesn't. Model it on the repo's existing checks: an architecture test, a lint rule, a CI job. Before proposing a new one, read what the manifest's *Verify* runs and the CI workflows. A check that exists but isn't wired in, or is silently skipped, is the finding, not a new check.

**Judgement calls go to the reviewer, not the implementer.** The implementing agent works under the most context pressure. The reviewer reads a diff and has room to apply rules. So a judgement rule about this repo's code goes under the manifest's *Standards*, marked "Reviewer-only, not enforced", which the reviewers read. A rule about reviewing in general goes in the build skill's `review-rules.md`, in the plugin's repo.

**Deletion is a candidate too.** Propose removing a standard, check or steering line when the session shows it fired on good code, when the code now teaches the same thing on its own, or when nothing in it changed behaviour. The environment should get smaller over time as well as sharper.

## 3. Present, then stop

List the candidates most severe first. Severity is what it cost, or would cost on repeat, not how loud it was: a quiet wrong answer outranks a noisy retry. For each:

- **The moment**: what happened, cited.
- **The cause** in the environment.
- **The fix**: the exact destination file, and the check, line or deletion.
- **The kind**: check, pointer, reviewer rule, skill change, deletion, access, tool economy.

Then stop. Change nothing until the user picks. When they do, a check is code: it goes through `/build` (the short path is usually enough) with a test that shows it failing on the bad case and passing on good code. Prose and skill changes take the short path too.
