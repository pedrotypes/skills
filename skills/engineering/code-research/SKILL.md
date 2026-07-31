---
name: code-research
description: Map what the codebase is today in the areas a change would touch — types, boundaries, control flow, extension points, invariants, and the specific files involved — gathered by parallel read-only subagents and reported as findings, never written to a file. Use when the user asks to research, survey, map, or understand part of a codebase before changing it, or when another skill needs ground truth about existing code.
---

# code-research

Facts about the code as it exists. Descriptive, never prescriptive: no proposals, no designs, no quality judgements. **Output findings only — the caller decides where they go.** Never write a document unless the caller asked for one.

## 1. Scope it

Take the intent from the caller — a PRD, a plan, a feature description, or a question. Ask only if given nothing to aim at. One line naming the areas you are about to survey.

## 2. Fan out

Split into 2–4 distinct areas and launch one **read-only** subagent per area, all in a single message. Brief each one:

> You are a **documentarian**. Map the existing code in `<area>` as it relates to `<one-line intent>`. Report **only what exists and how it works today**.
>
> - No proposed changes, refactors, improvements, or architecture. Do not say how to implement anything.
> - No quality judgements or things to fix. Describe surprising behavior plainly; do not editorialize.
> - No decisions that belong in a plan. Say *"this is where X lives / how X flows today"*, never *"change X"*.
>
> Deliver: the types, interfaces, and boundaries involved; the current control flow; the extension points that already exist; the invariants and standards governing the area (from `AGENTS.md` and the knowledge base); and the places the change would most plausibly touch, stated descriptively. Include key files as `path:line — note`. Structured notes, no prose padding.

## 3. Verify and report

Read the key files the subagents surface yourself — report verified fact, not a second-hand summary.

Report: the subsystems in scope; where the change would touch existing code and where new code would plausibly live; existing pieces worth reusing; the invariants, standards, conventions, and data flows in play; key files as `path:line — note`; and the open technical questions, as factual gaps only.

Cut any line that reads "we should…". That is the caller's job, not yours.
