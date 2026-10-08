---
name: improve-architecture
description: Survey the codebase for deepening opportunities — shallow modules whose complexity could sit behind a smaller interface — and present them as a visual HTML report, then explore the one the user picks. Periodic upkeep against code rot, or "how can we make this next change easy?" before a big build. Never changes code. User-invoked only.
disable-model-invocation: true
---

# Improve architecture

Agents copy the code they find. A shallow module, a leaky seam or a concept spread across five files becomes the pattern the next change imitates. This skill finds those places while they're still cheap to fix, and queues the fix as ordinary work. It never edits code. Its output is a report, a conversation, and at most one decision that goes into `/build`.

The words are fixed. Read [vocabulary.md](vocabulary.md) before you start and use its terms exactly: module, interface, implementation, depth, seam, adapter, leverage, locality. For the domain, use the nouns the *Reference docs* already use, never invented class names.

## 1. Scope before you scan

A deepening pays back only when the code changes again. Decide where to look before you look:

- **The user named an area or a pain point.** Take it.
- **The user named a plan, ticket or upcoming change.** Ask "how could the code make this change easy?" and scan the modules it will touch. This is the most useful way to run the skill.
- **Neither.** Find the hot spots: `git log --since="6 weeks ago" --name-only --format= | sort | uniq -c | sort -rn | head -30`, and the `feat`/`fix` commits that keep coming back to the same area. If changes are scattered, widen the window.

## 2. Read what's already decided

Read `.agents/project.md` (if it's missing, run `/setup` first). Then read its *Routing* file and every doc that names for the area, always including any architecture doc among the *Reference docs*, and the *Standards*. The architecture decisions, the standards and the plans under *Plans* record choices you don't re-argue. Each reference doc may have a `Considered and rejected` list: a candidate on it comes back only if the friction has clearly changed since, and the card says so.

Some things look like mistakes and are deliberate (the *Routing* file may name examples). A candidate that "fixes" one is a defect in the report.

## 3. Explore

Send one `Explore` subagent per hot area, in parallel, with the vocabulary and the questions below. Read the code a finding depends on yourself before it becomes a card.

- Where does understanding one concept mean bouncing between many small modules?
- Where is the interface nearly as complex as the implementation?
- Where were pure functions extracted only for testability, while the bugs live in how callers combine them (no locality)?
- Where does a module leak across its seam: callers that know its SQL, its retry rules, its ordering?
- Where is behaviour untested, or testable only past the interface?
- Which seams have one adapter? A single-adapter seam is indirection, unless a fake in the tests is the second.

Only a suspect that passes the **deletion test** gets a card, with its dependency category. Both are in [vocabulary.md](vocabulary.md).

## 4. The report

Write one self-contained HTML file to the session scratchpad, `architecture-review-<YYYY-MM-DD>.html`, never into the repo. Follow [html-format.md](html-format.md): the build skill's `picture.css` for styling and Mermaid for diagrams, so you write content, not CSS. If the Artifact tool is available, publish it as a private artifact and give the user the link. Otherwise give them the absolute path.

One card per candidate, strongest first, ending with a top recommendation, as html-format.md specifies. If every candidate is Speculative, the code is in good shape here: say so, and don't invent friction to fill the page.

Don't propose interfaces yet.

## 5. Stop and ask

After the report, stop. Ask which candidate the user wants to explore, with your top recommendation first. Do nothing else until they answer.

## 6. Explore one candidate

One candidate per session. Work through the shape with the user: what goes behind the seam, what the interface becomes, which dependency category applies, which tests survive and which get replaced. Ask in batches, at most one batch per turn, each question with your recommended answer first. Anything the code, the docs or a quick spike can settle, settle yourself. When the shape is clear, stop asking.

The outcome is a decision, never a diff:

- **Accepted**: write it up as a short brief (problem, the deepened interface, the tests that move, what's out of scope) and hand it to `/build`. Offer to file it in the manifest's *Tracker* instead if the user wants it later. Turn the other Strong candidates into tickets only if the user asks.
- **Rejected for a lasting reason**: offer to add one line to the `Considered and rejected` list of the reference doc for that area (create the heading if it's missing): the candidate, the reason, the date. Skip reasons that won't hold next month ("not now") and self-evident ones. The next run reads this list, so it won't suggest the same thing again.

Never edit code from this skill, not even an "obvious" small cleanup. That goes through `/build`, with its tests and review.
