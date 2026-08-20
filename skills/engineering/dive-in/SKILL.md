---
name: dive-in
description: Build a feature in small fast slices with the user at the keyboard — interview, propose one slice as goals plus English acceptance tests plus a file diff plus pseudocode, take an accept or a refine, build it to green, review it, repeat. Use when the user says "dive in", wants to build in quick iterations, or wants to keep steering every step.
---

# dive-in

One loop, small slices, everything the user needs in the message they are reading. Never point at a file and expect them to go read it.

Not `back-and-forth`: no full design up front, no research doc, no plan. A feature folder and one slice at a time.

## Paths

The `Feature` row in the `## Knowledge base` table of `AGENTS.md`, and `## Workflow` for base branch, merge style and adversarial review. No table → invoke `kb-init` and stop. Never guess a path.

`<feature-dir>/BACKLOG.md` holds features we are not building yet. A feature we are building is `<feature-dir>/FEAT<n>-<slug>/`:

| Path | Holds |
| --- | --- |
| `FEAT<n>-<slug>.md` | The PRD, not a plan: goals, the high-level design choices we mean to stay true to, acceptance criteria. OKF frontmatter with `status: todo\|doing\|done`. Evolves as we learn. |
| `iterations/ITER<n>-<step>-<slug>.md` | One file per slice, `<step>` counting from 1. The newest is the slice in hand; the rest are the history of what was built. |
| `TODO.md` | Work this feature still owes, waiting for a later slice. Nothing else. |

Only the PRD is an OKF document; the iteration files and `TODO.md` carry no frontmatter.

## Every turn starts by orienting

Read the PRD, `TODO.md` and the newest iteration file, and skim the earlier iterations' goals for what already shipped. Say in two or three lines what the feature is for, what is done, what is left, and what `TODO.md` is holding.

The newest iteration's `Status` says where the last session stopped: `refining` shows it back as the four blocks and keeps interviewing from there, `accepted` builds it, `done` opens the next slice. Then into the loop.

New feature: check `BACKLOG.md` for it first. A match gets folded into the conversation as the opening material — read it out rather than starting from nothing — and its entry is deleted once the feature folder exists, because every detail now lives there. Then allocate `<n>` unique across every branch, so two in flight never collide.

```bash
git fetch --all --quiet
{ git for-each-ref --format='%(refname)' refs/heads refs/remotes \
    | while read -r r; do git ls-tree -r --name-only "$r" -- <feature-dir> 2>/dev/null; done
  ls <feature-dir> 2>/dev/null; } | grep -oE 'FEAT[0-9]+' | grep -oE '[0-9]+' | sort -n | tail -1
```

Nothing printed means `1`, otherwise that `+ 1`. Confirm number and slug, cut `git worktree add -b feat/<n>-<slug> .worktrees/<n>-<slug> origin/main`, work from inside it, and leave the root checkout alone. Write the PRD from the opening interview and add the feature to the type's `index.md`.

## How the dialogue runs

`AskUserQuestion` carries almost all of it. Typing costs the user more than clicking, and the point of this skill is that they never have to look away.

Every question arrives with your own answer already in it: the recommended option first, marked `(Recommended)`, and the rest as the alternatives you actually considered. A recommendation you would defend, not a hedge — the user's cheapest move should be agreeing with you, and `Other` is always there when your options miss.

One or two questions per dialog, never four. A four-question dialog is a form, and a form is the interview you did not do.

Prose is for what cannot be optioned: hearing out a new feature, showing findings, reporting what a slice did. Everything with a decision in it — a criterion to settle, a tradeoff to pick, the accept-or-refine gate — is a dialog.

## The loop

1. **Interview.** Sharpest question first, as a dialog. Read the code as you go, documentarian only — where the change lands, which patterns already exist to follow. Cheap greps by default; invoke `code-research` only where the area is genuinely unmapped.
2. **Propose one slice**, in one message, as the four blocks below and nothing else.
3. **Gate.** `AskUserQuestion`: accept, or refine. Refine goes back to 1. Accept flips the iteration file to `Status: accepted` and drains from `TODO.md` whatever this slice carries, leaving the rest.
4. **Build.** Turn the accepted criteria into real tests, then code until they pass. Implementation choices are yours. Anything that changes agreed behavior stops and asks.
5. **Review**, as below.
6. **Close.** Iteration file to `Status: done`, triage `TODO.md` as below, update the PRD's `status`. One line to the user, then loop or land.

A slice is what you can build and show green in one pass. If you are unsure it fits, cut it smaller.

Propose only when you are about 92% sure the slice is covered — the doubt left is the kind only writing the code settles. Below that, say the number and the one thing holding it down, and take another interview lap instead of proposing.

## Walk the criteria before committing to them

The interview's real work is the acceptance criteria, one at a time, out loud with the user. For each: what makes it fail, what happens at the edges, what it says about the criteria either side of it. Name every hole, inconsistency and gap you find rather than quietly patching it — the user wants to see the problem, not a corrected list. Each one you find becomes a dialog with your fix as the recommended option.

A simple feature earns this pass too. Simple is where the unexamined assumption hides, and a criterion nobody argued with is usually one nobody read.

## The four blocks

1. **Goals** — the feature's, in your words, two or three lines. It confirms we are still aimed at the same thing.
2. **Acceptance criteria** — English tests for this slice only, each one implementable as a single check. Mark any that costs money or minutes to run and keep those to the few that earn it.
3. **File tree diff** — added, changed, deleted.
4. **Pseudocode** — the actual changes, in enough detail to argue with.

### The iteration file is those same four blocks

Written down, under a `Status: refining|accepted|done` line, and rewritten as answers move the slice — silently, without narrating it. What the user reads in the message and what the file holds are the same content.

It is the one file that has to stand alone. A session that dies mid-interview is picked up from it, and an agent handed nothing else builds the slice from it: real paths, real function and test names, the existing patterns the code follows, never "as discussed" or a pointer at the conversation.

By the time the slice closes, it also holds what the build actually did where that differed, and every review finding with the fix that answered it — enough for someone to reimplement the slice from the file alone.

## Review

Honor the `Adversarial review` setting in the `## Workflow` table without asking; an absent table earns one question. When one runs, invoke `adversarial-review` on the diff.

**Report what came back before touching anything** — the findings as the reviewer wrote them, with their severities. A silent review is worse than none, because the user has no idea what was weighed. Then fix without asking further, unless a finding changes agreed behavior, which stops and asks.

Re-run the review after fixing and keep going until a round comes back with no P1. Say each round's tally in one line.

## TODO is triaged at every close, never just appended to

One test decides where a surfaced item lives: **does it serve an acceptance criterion in the PRD?** Yes, and it is this feature's work — `TODO.md`. No, and it is a future feature — `BACKLOG.md`, whatever it feels adjacent to. An item nobody can place under either is dead, and saying so is better than parking it.

Run that test over every `TODO.md` item at each close, not only over the new ones. A slice changes what the feature is for, so an item that was feature work two slices ago may not be any more. Report the outcome in the close line — `TODO: 3 kept, 1 to backlog, 1 dropped` — and put anything you are unsure about in a dialog with your call as the recommended option.

Each item records the step it arrived at — `- (from 3) refresh tokens rotate on reuse` — so its age is a fact rather than a memory. An item that survives two closes without being picked up is telling you something. Raise it: usually it belongs in the backlog, sometimes it is the next slice, never is it a third close.

## The backlog

`BACKLOG.md` holds future features, appended at the end. Anything out of scope for the feature in hand lands here, whether it surfaced in conversation or was triaged out of `TODO.md`.

Name it back to the user when you spot one, and ask whether they want to say a few words so the project remembers. A few words are worth more than a heading; take a no and write the heading anyway.

Every entry carries the date it first appeared. `Updated` joins it the first time the idea comes up again and moves every time after. Both dates come from `date +%F`, never from memory.

```markdown
## <name>

Added 2026-01-31 · Updated 2026-02-14

<the user's few words, or nothing>
```

## Goals and principles

Derive the project's goals and principles from its knowledge base — read the registry, then the documents covering what the feature touches: functionality, architecture, code design, usability. Say plainly where the feature complies and where it violates.

When the work says a principle should change, or that one is missing, surface it and ask. Never edit a knowledge base document silently and never let a violation pass unmentioned; with permission, invoke `kb-maintain`. These documents sharpen as a byproduct of the loop, which only holds if every change is the user's call.

## Changing the feature itself

A slice teaching us the PRD's goals or acceptance criteria are wrong is normal and expected. Say so, propose the edit, and wait for an explicit yes. Slice-level changes are yours to propose freely; feature-level ones are never silent.

## Done

`status: done` → invoke `land`, naming the feature.
