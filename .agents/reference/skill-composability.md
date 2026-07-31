---
type: Reference
title: Skill composability
description: Leaf skills compute and report; the caller decides what gets persisted, argued, or gated. How skills in this bundle are split and how they call each other.
tags: [design, authoring]
---

# Skill composability

Skills are either a **spine** that runs a conversation and owns outcomes — `back-and-forth`, and `feature`, `land`, `kb-maintain` over narrower stretches — or a **leaf** that computes something and reports it, like `code-research` and `program-design`. A leaf writes no files, runs no approval loop, and decides nothing about what happens next; the caller does all three, and the leaf says so at the top of its own file so the next author does not assume a document appeared somewhere. That purity is what lets one skill serve a direct user invocation and an orchestrated one without branching: `code-research` reports the same findings whether `back-and-forth` is about to write them into a research doc or `program-design` is about to design straight from them.

The contract has a caller side, and forgetting it fails silently — nothing errors, a step simply never happens. A spine states what it does with a leaf's result in the same sentence that invokes it, and changing a leaf's output contract means grepping its callers in the same edit.

Two signals say where the split belongs. **A procedure duplicated across two skills is a skill** — a second caller is the threshold, not length. **When caller and callee both describe the same step, the callee is wrong**, because two sources of truth for one behavior drift. What stays in a leaf is content it produces rather than process around it: `program-design` reports the shape decisions it is least sure about, and the spine decides whether to argue them.
