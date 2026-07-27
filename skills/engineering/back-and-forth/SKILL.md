---
name: back-and-forth
description: Pressure-test a feature idea through dialogue until 92% confident, design the program shape, then write an implementation plan a coding agent can execute from cold. Use when the user says "let's go back and forth", wants to go back and forth on an idea, or asks to pressure-test or think through a feature before it gets planned or built.
---

# back-and-forth

The user has an idea for a feature and wants to think it through with you
*before* any code is written. Your job is to be a sharp, skeptical thinking
partner — not a stenographer — and to end with a plan a coding agent could
implement with **no other context**.

## The loop

1. **Listen.** Let the user describe the idea. Ask for the parts they left
   implicit before you critique anything — you cannot poke holes in an idea you
   have only half-heard.

2. **Understand it in context.** This is a real codebase with hard rules. Read
   what the idea touches before reacting.

   **Start with the research doc.** If a matched `docs/plans/R<n>-<slug>.md`
   exists (the `feature` skill writes one before handing off), read it *first* —
   it is the map of the ground this feature is built on: the change sites, the
   add sites, the reusable pieces, the invariants/standards/data-flows in scope,
   and the open technical questions. It is descriptive, not decisive, so verify
   its claims against the actual code as you go — but do not re-derive the lay of
   the land from scratch when it has already been surveyed. Then read the rest of
   what the idea touches: the active plan in `docs/plans/`, the relevant
   `docs/standards/*.md`, the relevant `docs/data-flows/` diagram, and the actual
   code at the specific sites the R-doc names. The invariants in `CLAUDE.md`
   (hexagonal boundaries, no secrets in config, static binary, TDD, no AI
   attribution) are non-negotiable — an idea that violates one is a hole, name
   it.

3. **Poke holes — grounded in the code, not just the concept.** One or two of
   the sharpest objections at a time, not a scattershot list. The goal is to
   catch at *design* time every technical problem that would otherwise surface
   in code review — so do not stop at conceptual objections. Walk the concrete
   change sites the R-doc names and pressure-test each: the exact signatures and
   callers that shift, the failure/error path at *that* call site, concurrency
   and ordering where the new code actually runs, schema/migration and
   backward-compat, where state lives and who else reads it, the architecture
   boundary the change crosses. Also chase what the R-doc flagged as open
   technical questions — those are unresolved by construction and must not
   survive into the plan. And — channelling the house style — whether the
   feature (or a piece of it) needs to exist at all, plus what the user is
   assuming that may not be true. Prefer the objection that, if unanswered,
   sinks the design; but a plan that "works" and still leaks a dozen small
   technical corrections into review has failed this step.

4. **Go back and forth.** Converge. When the user resolves an objection, move
   to the next real one. When you're wrong, say so and drop it. Track the open
   questions so nothing quietly gets dropped.

5. **Call it.** When you judge the design is **~92% confident** — the shape is
   right, the failure modes are handled, the open questions are down to
   reversible details — stop and confirm with `AskUserQuestion`: are we there,
   or is there something still nagging? Do not skip this step and do not write
   the plan until the user confirms.

6. **Design the program.** The design being right is not the same as the code
   shape being right. Once the user confirms step 5, invoke the
   `program-design` skill before writing anything: it draws the call-stack tree
   (production and tests), the file-tree diff, and the key signatures, and
   argues them out with the user. This is the level where agents quietly go
   wrong, and every one of these is a decision that otherwise surfaces at code
   review — the most expensive moment to change your mind. Its artifacts come
   back to you and go into the plan as its `## Program design` section.

7. **Write the plan** (below), then tell the user the path.

8. **Hand off to eng review.** The plan is written to be reviewed — invoke the
   `plan-eng-review` skill on it as the last thing you do. That is always the
   user's next step, so make it yours: don't stop and ask whether to run it,
   run it. With the R-doc feeding step 2 and the code-grounded pass in step 3,
   this review should find *few* things — a long findings list means the design
   pass above let technical problems slip, not that the review is thorough.

## Judgement, not theatre

92% is a feel, not a checklist you pad to hit a number. If the idea is sound in
three exchanges, call it in three. If it's still soft after ten, keep going.
Don't invent objections to look rigorous, and don't wave through a real gap to
seem agreeable. The bar is: could a competent coding agent build this from the
plan alone and get it right?

## Writing the plan

Plans live in `docs/plans/` as `P<n>-<slug>.md`. Find the next number:
`ls docs/plans/` and increment the highest `P<n>`. Match the structure and
voice of the existing plans (read the current one first) — they open with a
prose summary, note what already exists and is reused, then break the work into
numbered sections with a `§N` scheme that code and tests can reference.

The plan must stand alone. A coding agent with only this file and the repo must
be able to implement it. So it names concrete files, ports, and adapters; spells
out the failure and edge-case handling you argued through; respects the
architecture invariants and the TDD rule (say what tests come first); and
records the decisions and their *why* so the agent doesn't relitigate them. Fold
the resolved objections into the design — the plan is the conclusion of the
back-and-forth, not a transcript of it.

Carry the step-6 artifacts in verbatim as a `## Program design` section, sitting
between the prose design and the numbered work sections. The implementing agent
inherits that shape rather than inventing its own; the test call-stack tree also
names the failing tests that come first, so keep the two consistent.

Every open technical question the R-doc raised must be *answered* in the plan,
not carried forward — an R-doc gap that reaches a coding agent unresolved is
exactly the review-stage finding this flow exists to prevent. The R-doc is the
descriptive input; the plan is where each of its unknowns becomes a decision.

Keep the current-plan pointer in `CLAUDE.md` accurate if this plan becomes the
active one — confirm with the user before repointing it.

Then run `plan-eng-review` on the finished plan (loop step 8) — that hand-off is
part of writing the plan, not an optional extra.
