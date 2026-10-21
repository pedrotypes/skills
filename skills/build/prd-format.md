# The PRD

The PRD is the what and why, for the user. Its one job: they read it and recognise their own thinking. It's a plain Markdown file a busy CPTO reads in three minutes: what they must check comes first, and every section is as short as it can be. Leave out a section that would be empty.

```markdown
# P<n> <Name>

Ticket: <link, when there is one> · Signed off: <date, once approved>

## Summary
What and why, in two or three sentences.

## What you said
- "<their words>" (<source>) → <your reading>

## Where I might be wrong
- **<Claim>.** <detail>. **If not:** <what changes>

## Done when
- **P<n>-S<k> <short name>**: <observable behaviour>

## Test seams
| Scenario | Seam | Checks |
|---|---|---|
| P<n>-S<k> | <where the test drives the code: a route, a component, the browser on the stack> | <what it asserts, failure paths included> |

## Solution
How it works, and the rejected alternative in one line.

### Your directives
- "<their technical decision>" (<source>)

## Out of scope
## Open questions
```

- **What you said**: quote only what they actually wrote or said. A decision you have secondhand is a paraphrase, labelled as one, without quotation marks.
- **Where I might be wrong**: two to four assumptions, only ones that would change what gets built.
- **Done when**: failure paths included. Always the full id, so one grep finds the PRD row, the test, the proof script and the commit.
- **Test seams**: the highest seam that still runs fast and fails for one reason. These become the main tests you write before the builders start.
- **Solution**: draw a flow, state or sequence with a `mermaid` fence when a drawing is clearer than words. For UI, show each state that matters, the failure included, as an ASCII mockup in a plain fence, with example data labelled as examples. For backend work, show the request and response instead.

```text
┌ Installer handbook ─────────────── confluence · active ┐
│ [Synchronize]  [Edit labels]  [Delete source]          │
│ ✓ Synchronization queued.                              │
└────────────────────────────────────────────────────────┘
```

## Sign-off

Send the user the PRD (the file, or its absolute path) and ask them to approve or correct it. Change it for each correction and commit. Once they approve, add the sign-off date and commit.
