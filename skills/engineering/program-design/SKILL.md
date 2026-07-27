---
name: program-design
description: Draw the shape of the code — call-stack trees, a file-tree diff, and the key signatures — for a change that is planned, already coded, or merely described, then argue it out before the shape gets expensive to change. Use when the user asks for the program design, the shape of the code, a call graph or call-stack tree, which files a change will touch, or what a change is actually going to do.
---

# program-design

Architecture says how services, ports, stores, and messages talk to each other.
Program design is one level down: **the shape of the code** — the types, the
method signatures, the file layout, and the call stacks. It is the level where
agents quietly go wrong, and where a human can catch it by reading half a page
instead of a thousand-line diff.

Every artifact below is a decision that would otherwise be made implicitly and
discovered during code review — the most expensive possible moment to change
your mind. None of it takes long: **you draft it, the user argues with it.**

Visualizations here are light pseudocode, not Mermaid. Mermaid belongs in
`docs/data-flows/` for runtime flows; it is overkill for code shape and lures
everyone into a false sense of alignment.

## 1. Pick the mode

The skill runs against whatever exists right now. Take the subject from the
argument; if there is none, infer it from the conversation, and only ask when
genuinely ambiguous.

- **planned** — a plan (`docs/plans/P<n>-<slug>.md`), an R-doc, or a design
  agreed in this conversation but not yet coded. You are *proposing* the shape.
- **coded** — a branch, a diff, a worktree, or "what did you just do". You are
  *deriving* the shape from code that exists, so the user can see what the agent
  actually built without reading every line.
- **described** — loose prose, no plan and no code. You are *drafting* a shape
  to argue about; it may end up nowhere, and that is fine.

Say which mode you are in, in one line, before you draw anything.

## 2. Get ground truth first

Never draw from imagination. What you read depends on the mode:

- **planned** — the plan and its matched `R<n>-<slug>.md`, then the actual code
  at the change sites the R-doc names. A call graph invented on top of a plan's
  prose is worthless; the tree must attach to real function names that exist
  today.
- **coded** — the diff (`git diff main...HEAD`, or the working tree), then read
  the touched files. Trace outward from each entrypoint the diff creates or
  moves. Where you cannot verify an edge by reading, mark it `?` rather than
  guessing.
- **described** — locate the nearest existing code the description would attach
  to (Grep/Glob for the entrypoint, the port, the handler), and anchor there.

## 3. Draft the artifacts

Produce these four. Skip one only when the change genuinely has nothing to say
there — and say so explicitly rather than silently omitting it.

### Call-stack tree — production

For any orchestration or control-flow change. Use diff syntax when the
interesting part is what is *changing*: `+` added, `-` removed, unmarked lines
are existing code that stays. Annotate port hops, because in this codebase the
port boundary is where the interesting substitutions happen.

```diff
 daemon.Run
   queue.Worker.tick
     agent.Task.Advance
+      agent.buildRequest
+        ports.Directory.List           # port hop → localdir adapter
       ports.LLM.CompleteWithTools
-      agent.legacyPromptAssembly
```

### Call-stack tree — tests

The second graph is not decoration: it is where you see which seams are real.
If the test tree cannot substitute at the port, the seam does not exist.

```
agent_test.TestAdvance_IncludesPeers
  agent.Task.Advance
    ports.Directory.List      → fakedirectory.Fake      # substituted at the port
    ports.LLM.CompleteWithTools → fakellm.Scripted
```

Under the TDD invariant this tree is also the work order: the test node named
here is the failing test that comes first.

### File-tree diff

So the user stays in touch with where things live.

```diff
 internal
 ├── ports
+│   └── directory.go                  # NEW — Directory port (List/Get)
 └── adapters
     └── directory
+        ├── localdir/localdir.go      # NEW — config-backed implementation
+        └── fakedirectory/fake.go     # NEW — test double
~ cmd/logos/daemon.go                  # MODIFIED — constructs and injects the port
```

`+` new, `~` modified, `-` deleted. One trailing comment per line, no essays.

### Types and key signatures

The stuff too internal for an architecture doc but that an agent still gets
wrong. Real Go, elided bodies, only the *key* new or changed declarations —
this is not a header dump.

```go
// internal/ports/directory.go
type Agent struct {
    ID      string
    Summary string
}

type Directory interface {
    List(ctx context.Context) ([]Agent, error)
    Get(ctx context.Context, id string) (Agent, bool, error)
}
```

Call out signature changes to *existing* functions separately — those are where
callers break.

## 4. Read the shape back for violations

The trees make several project invariants visible as structure, so check them
before the user does. Report a hit as a finding, not as a footnote:

- **Adapter-to-adapter edge.** Any edge from `internal/adapters/x` into
  `internal/adapters/y` violates the hexagonal invariant. It is a line in the
  tree; find it.
- **Port purity.** A port signature naming a config type, an adapter type, or
  anything outside stdlib+context breaks `internal/ports`.
- **Composition root.** Construction and wiring appear only under `cmd/logos`.
  A `New…` call anywhere else in the tree is a smell.
- **Untested production node.** A `+` node in the production tree that no test
  tree reaches is either missing a test or is the next red test to write. Name
  which.
- **Secrets.** No secret value in a signature, a return, a `String()`, or a log
  line on any path drawn here.
- **Depth and fan-out.** A tree that is suddenly six levels deeper than the flow
  it replaces, or one function calling nine others, is a design smell worth
  raising even when nothing formal is violated.

In **coded** mode add one more: does the derived shape match what the plan said?
If the agent deviated, that deviation is the headline of your report, ahead of
everything else.

## 5. Argue

Present the artifacts, then your own read: the two or three shape decisions you
are least sure about, and the alternative for each. Ask with
`AskUserQuestion` — accept as-is, or reshape.

Then loop: revise the trees against the user's objection and show the changed
lines only, not the whole set again. Stop when the user is satisfied or when the
remaining disagreements are reversible details a code review can settle. Do not
pad the loop to look rigorous; a change whose shape is obvious deserves one
pass.

## 6. Land it

Where the output goes depends on the mode — confirm before writing to a file.

- **planned** — fold it into the plan as a `## Program design` section, between
  the architecture/design sections and the numbered work sections, so the
  implementing agent inherits the shape instead of inventing one. If invoked
  from `back-and-forth`, hand the artifacts back and let that skill write the
  plan.
- **coded** — this is usually an understanding aid, not a document. Report in
  the conversation and write nothing unless the user asks, or unless a violation
  from step 4 warrants a note in the plan or a standards doc.
- **described** — keep it in the conversation. If the user wants it kept, the
  right home is a plan, which means running `feature` or `back-and-forth`, not
  writing a stray file.

If the shape turned out to contradict a `docs/data-flows/` diagram, invoke
`data-flow-aura` — do not quietly leave the diagram wrong.

## Tone

Terse. The artifacts carry the content; prose around them is overhead. Do not
restate a tree in sentences underneath it. Do not draw an edge you have not
verified — mark it `?` and say what you would need to read to confirm it. In
**coded** mode especially, draw what the code *does*, not what it was supposed
to do; the gap between those two is the entire reason this skill exists.
