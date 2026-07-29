---
name: program-design
description: Draw the shape of the code — call maps, interfaces and key signatures, the file-tree diff, and the libraries and tools in play — for a change that is planned, already coded, or merely described, then argue it out before the shape gets expensive to change. Use when the user asks for the program design, the shape of the code, a call graph or call map, which files a change will touch, or what a change is actually going to do.
---

# program-design

Architecture says how the big pieces talk to each other. Program design is one level down: **the shape of the code** — the types, the signatures, the file layout, the call stacks, the dependencies. It is the level where agents quietly go wrong, and where a human can catch it by reading half a page instead of a thousand-line diff.

Every artifact below is a decision that would otherwise be made implicitly and discovered at code review — the most expensive moment to change your mind. None of it takes long: **you draft it, the user argues with it.**

Light pseudocode, not Mermaid. Mermaid is for runtime data flows; it is overkill for code shape and lures everyone into a false sense of alignment.

## 1. Pick the mode

Take the subject from the argument; infer it from the conversation if there is none; ask only when genuinely ambiguous. Say which mode you are in, in one line, before drawing anything.

- **planned** — a plan, a PRD, or a design agreed in conversation but not yet coded. You are *proposing* the shape.
- **coded** — a branch, a diff, a worktree, or "what did you just do". You are *deriving* the shape from code that exists, so the user can see what was actually built without reading every line.
- **described** — loose prose, no plan and no code. You are *drafting* a shape to argue about; it may go nowhere, and that is fine.

## 2. Get ground truth — without redoing work

Never draw from imagination. But do not re-derive context that already exists:

**Invoked from `back-and-forth`** — the PRD and the research doc are the ground truth, and they were written for exactly this. Read them, then read the actual code only at the specific sites they name. Do not re-survey the codebase; that pass already happened.

**Invoked standalone** — read the plan and its matched research doc if they exist (paths come from the `## Knowledge base` table in `AGENTS.md`), then the code at the change sites. In **coded** mode, read the diff (`git diff main...HEAD`, or the working tree) and trace outward from each entrypoint it creates or moves. In **described** mode, locate the nearest existing code the description would attach to and anchor there.

A call map invented on top of prose is worthless — every node must be a name that exists today, or a name you are explicitly proposing. Where you cannot verify an edge by reading, mark it `?` and say what you would need to read.

Also read the project's own invariants — `AGENTS.md` and the standards in the knowledge base — because step 4 checks the shape against them, and they differ per project.

## 3. Draft the artifacts

Produce these. Skip one only when the change genuinely has nothing to say there, and say so rather than silently omitting it. The examples are illustrative — use the language and layout conventions of the project in front of you.

### Call map — production

For any orchestration or control-flow change. Diff syntax when the interesting part is what is *changing*: `+` added, `-` removed, unmarked lines are existing code that stays. Annotate boundary hops, since that is where substitution happens.

```diff
 daemon.Run
   queue.Worker.tick
     agent.Task.Advance
+      agent.buildRequest
+        ports.Directory.List           # boundary hop → localdir adapter
       ports.LLM.CompleteWithTools
-      agent.legacyPromptAssembly
```

### Call map — tests

Not decoration: this is where you see whether the seams are real. If the test map cannot substitute at the boundary, the seam does not exist.

```
agent_test.TestAdvance_IncludesPeers
  agent.Task.Advance
    ports.Directory.List        → fakedirectory.Fake    # substituted at the boundary
    ports.LLM.CompleteWithTools → fakellm.Scripted
```

Where the project is test-first, this map is also the work order: the test named here is the failing test that comes first.

### File-tree diff

So the user stays in touch with where things live. `+` new, `~` modified, `-` deleted. One trailing comment per line, no essays.

```diff
 internal
 ├── ports
+│   └── directory.go                  # NEW — Directory port (List/Get)
 └── adapters
     └── directory
+        ├── localdir/localdir.go      # NEW — config-backed implementation
+        └── fakedirectory/fake.go     # NEW — test double
~ cmd/daemon/main.go                   # MODIFIED — constructs and injects the port
```

### Interfaces and key signatures

The stuff too internal for an architecture doc that an agent still gets wrong. Real code, elided bodies, only the *key* new or changed declarations — not a header dump. Call out signature changes to *existing* functions separately; those are where callers break.

### Libraries and tools

Anything new the change drags in, and anything existing it leans on harder. Per entry: what it is for, why it beats the alternative already in the project, and what it costs — a new dependency, a build-step change, a version floor, a license, a platform constraint. **"None"** is a valid and welcome answer; say it explicitly rather than omitting the section, because silence reads as "not considered".

## 4. Read the shape back for violations

The maps make invariants visible as structure, so check them before the user does. Report a hit as a finding, not a footnote. Which invariants apply comes from the project's own docs, but these generalize:

- **A boundary crossed the wrong way** — an edge between two things the project's architecture says must not know about each other. It is a line in the map; find it.
- **A leaky interface** — a boundary signature naming a concrete implementation type, a config type, or anything the boundary is supposed to hide.
- **Construction out of place** — wiring and construction appearing outside wherever the project puts its composition root.
- **Untested production node** — a `+` node in the production map that no test map reaches is either missing a test or is the next test to write. Name which.
- **Secrets** — no secret value in a signature, a return, a `String()`, or a log line on any path drawn here.
- **Depth and fan-out** — a map suddenly several levels deeper than the flow it replaces, or one function calling nine others, is worth raising even when nothing formal is violated.

In **coded** mode add: does the derived shape match what the plan said? A deviation is the headline of your report, ahead of everything else.

## 5. Argue

Present the artifacts, then your own read: the two or three shape decisions you are least sure about, and the alternative for each. Ask with `AskUserQuestion` — accept as-is, or reshape.

Then loop: revise against the objection and show only the changed lines, not the whole set again. Keep poking holes rather than waiting to be asked — the user's approval at the end should be earned, not assumed. Stop when they are satisfied or when what remains are reversible details a code review can settle. Do not pad the loop; a change whose shape is obvious deserves one pass.

## 6. Land it

Confirm before writing to a file. Where it goes depends on the mode:

- **planned** — into the plan as `## Program design`, between the PRD and the numbered work sections, so the implementing agent inherits the shape instead of inventing one. Invoked from `back-and-forth`, hand the artifacts back and let it write.
- **coded** — usually an understanding aid. Report in conversation; write nothing unless asked, or unless a step-4 violation warrants a note in the plan or a standards doc.
- **described** — keep it in conversation. If the user wants it kept, the home is a plan, which means `feature` or `back-and-forth`, not a stray file.

If the shape contradicts anything the knowledge base claims — a diagram, a reference doc — say so and invoke `kb-maintain` to fix it. Do not quietly leave a document wrong.

## Tone

Terse. The artifacts carry the content; prose around them is overhead. Do not restate a map in sentences underneath it. Do not draw an edge you have not verified. In **coded** mode especially, draw what the code *does*, not what it was supposed to do — the gap between those two is the entire reason this skill exists.
