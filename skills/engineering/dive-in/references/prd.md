# The PRD

`FEAT<n>-<slug>.md`. Written from the opening interview, revisited at every close. Detailed enough that a session with no context reads it and starts building.

## Shape

```markdown
---
type: Feature
title: <name>
description: <one line>
status: todo|doing|done
---

# FEAT<n> — <name>

## Build protocol

Red/green TDD, one acceptance criterion at a time. Write the check first, watch it
fail for the reason it names — an import error or a typo is not a red — then make it
pass. Never weaken or delete a check to get green: a check that has to change means
the criterion behind it is wrong, which is a conversation, not an edit. The feature is
done when every criterion below passes, including the manual ones.

## Problem

What is broken or missing today, and who is hurt by it.

## Success

How we would know afterwards that this was worth building. `Not measured` is a valid
answer and better than an invented metric.

## Design commitments

Technology, framework, approach, code design and architecture we mean to stay true to,
one line each with its reason. Only decisions worth holding across sessions.

## Acceptance criteria

| # | Criterion | How it is checked |
| --- | --- | --- |
| AC1 | <what must be true, in English> | `<command>` → <what proves it> |
| AC2 | <...> | manual: <steps> |
```

## Success is not acceptance

`Success` asks whether the feature helped; `Acceptance criteria` ask whether it works. Keep them apart — conflating them produces a PRD that cannot be checked off.

A metric implying instrumentation makes that instrumentation work, so it earns its own criterion. Otherwise it never gets built and nobody notices.

## Acceptance criteria

Numbered and stable, `AC1` upward. Numbers are how a slice says what it covers and how "what is left" stays a fact rather than a recollection. Never renumber; a dropped criterion is struck through, not removed.

Exhaustive means every way we would know the feature is done, including the failure paths, the empty case, and whatever the user would poke at first. It does not mean design detail — that belongs in the slice.

Each criterion carries one way of checking it, and **mechanically** is the bar: a command to run and the output that proves it. "Verify the user can log in" is not a criterion; "`POST /login` with a valid password returns 200 and a session cookie" is.

**An automated check where one is possible, a manual procedure only where none is.** Writing both for the same behavior gives one behavior two specs, which drift, and it teaches the agent that procedures are decoration — so the ones that matter get faked too.

What earns a manual procedure is what a test genuinely cannot reach: how output reads to a person, whether the parts compose in the real application, a migration against real data, anything visual. Those are written as steps a QA specialist would follow, and the agent executes them itself before saying the feature is done.

Mark any check that costs money or minutes to run, and keep those to the few that earn it. A suite too slow to run every slice stops being run.
