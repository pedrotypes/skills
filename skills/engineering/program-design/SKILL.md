---
name: program-design
description: Draw the shape of the code — call maps, interfaces and key signatures, the file-tree diff, and the libraries and tools in play — for a change that is planned, already coded, or merely described. Use when the user asks for the program design, the shape of the code, a call graph or call map, which files a change will touch, or what a change is actually going to do.
---

# program-design

This is where the design gets decided: the types, signatures, file layout, call stacks, and dependencies. Spend the tokens here — the shape is cheap now and expensive later. Light pseudocode, never Mermaid.

Output the artifacts and the findings, then stop. Invoked by another skill, that skill decides what to do with them.

## 1. Get the change request

Nothing to design without one. Take a PRD and research doc if handed them, a plan or a description otherwise, and **if given nothing, ask what is being built** before drawing anything. State in one line which you are working from and whether you are *proposing* a shape (not yet coded) or *deriving* one from code that exists — in the latter case draw what the code does, not what it was meant to do.

## 2. Ground truth

Never draw from imagination, never re-derive what exists. Handed a research doc, it is ground truth — read it, then the code only at the sites it names; the survey already happened.

**Without one, invoke `code-research`** and design from what it reports. It writes nothing; its findings are yours to use here and are not a document. From a diff, trace outward from each entrypoint as well; from a bare description, anchor to the nearest existing code.

Every node must be a name that exists today or one you are explicitly proposing. Mark an edge you could not verify `?` and say what you would need to read.

Read the project's standards — `AGENTS.md`, the knowledge base, and the surrounding code itself. **The shape must look like it was always there:** its naming, layering, error handling, test style, and file placement follow local convention, and it reuses what exists instead of adding a parallel way to do the same thing. A design a reviewer can date by its style is wrong. Where local convention is genuinely bad for this change, say so and justify the departure — do not silently diverge.

## 3. Draft the artifacts

In this order. Examples are illustrative; follow the project's own conventions.

### 1. File-tree diff

Where everything lives, first, so the reader is oriented before anything else. `+` new, `~` modified, `-` deleted. One trailing comment per line.

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

### 2. Call map

Diff syntax when the interesting part is what changes. Annotate boundary hops.

```diff
 daemon.Run
   queue.Worker.tick
     agent.Task.Advance
+      agent.buildRequest
+        ports.Directory.List           # boundary hop → localdir adapter
       ports.LLM.CompleteWithTools
-      agent.legacyPromptAssembly
```

### 3. Interfaces and key signatures

Real code, elided bodies, only the *key* new or changed declarations — not a header dump. Call out signature changes to *existing* functions separately; that is where callers break.

### 4. Libraries and tools

Only if the change brings something new in or leans harder on something existing. Per entry: purpose, why it beats what the project already has, and its cost — dependency, build step, version floor, license, platform. Nothing new, no section.

### 5. Tests

Prose, one line each: the name, and what it is for — the behavior it pins down, not the mechanics of it. Cover every `+` node in the call map; a production node no test covers is a gap, so name it as one. Say which boundary each test substitutes at, since a seam nothing can substitute at is not a seam. Where the project is test-first, this list is the work order and its order is the order they get written.

> `TestAdvance_IncludesPeers` — a task advancing mid-run picks up peers that appeared since it started, rather than the snapshot it booted with. Substitutes `ports.Directory` and `ports.LLM`.

## 4. Read the shape back for violations

Report a hit as a finding, not a footnote. Project docs decide which invariants apply; these generalize:

- **Boundary crossed the wrong way** — an edge between two things that must not know about each other.
- **Leaky interface** — a boundary signature naming a concrete type, a config type, or anything the boundary hides.
- **Construction out of place** — wiring outside the composition root.
- **Untested production node** — a `+` node in the call map that no test in the list covers.
- **Secrets** — none in a signature, return, `String()`, or log line on any path drawn.
- **Depth and fan-out** — a map much deeper than the flow it replaces, or one function calling nine others.
- **Off-convention** — a name, layer, error path, or file placement that no existing code in the project would have chosen.
- **Stale documentation** — the shape contradicts a diagram or reference doc in the knowledge base.

In **coded** mode, a deviation from what the plan said is the headline, ahead of everything else.

## 5. Report

The artifacts, the findings, and the two or three shape decisions you are least sure about with their alternatives. Nothing written to a file unless the caller asked for it.

Terse throughout. Do not restate a map in sentences underneath it.
