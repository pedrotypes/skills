---
type: Reference
title: Skill composability
description: Leaf skills compute and report; the caller decides what gets persisted, argued, or gated. How skills in this bundle are split and how they call each other.
tags: [design, authoring]
---

# Skill composability

Skills in this bundle are either a **spine** — a skill that runs a conversation and owns outcomes — or a **leaf** — a skill that computes something and reports it. `back-and-forth` is the spine. `code-research` and `program-design` are leaves. `feature`, `land` and `kb-maintain` are spines over narrower stretches.

## Leaves are pure

A leaf reads, thinks, and reports its findings. It does not write files, does not run an approval loop, and does not decide what happens next. The caller does all three.

This is what lets one skill serve both a direct user invocation and an orchestrated one without branching on which it is. `code-research` reports the same findings whether `back-and-forth` is about to write them into a research doc or `program-design` is about to design straight from them. Neither the leaf nor its output changes.

The corollary is that leaves state their purity out loud, at the top: *output the findings, the caller decides where they go*. Otherwise the next author assumes a document appeared somewhere.

## Spines restate the contract

Purity at the leaf is only half a contract — the caller has to know about it. When `program-design` stopped writing its own `## Program design` section, `back-and-forth` still read as though the section wrote itself. Nothing errored; the step simply would not have happened.

**When a leaf's output contract changes, grep for its callers in the same edit.** A spine that invokes a leaf says what it does with the result, in the same sentence that invokes it.

## Two extraction signals

**A procedure duplicated across two skills is a skill.** Research lived inline in `back-and-forth` and was about to be copy-pasted into `program-design`; that is the moment it became `code-research`. Length is not the signal — a second caller is.

**When caller and callee both describe the same step, the callee is wrong.** `program-design` used to argue its design out and decide where to file it, while `back-and-forth` also described arguing and filing. Deleting both sections from the leaf lost nothing, because the spine already owned them. Duplication here is not just waste; it is two sources of truth for one behavior, and they drift.

## What stays in a leaf

Not everything caller-shaped belongs to the caller. A leaf keeps whatever is *content it produces* rather than *process around it*: `program-design` still reports the two or three shape decisions it is least sure about, because those are findings. The spine may argue them, ignore them, or file them — its call.
