# Diagram-shaped types

For types whose documents are Mermaid diagrams with prose around them — usually called `Data Flow`, sometimes `Sequence`, `State`, or `Wiring`. Read this in step 3 when the type you are updating is diagram-shaped.

## What counts as a change worth documenting

Fire when the conversation shows that **runtime movement** changed, not merely that code changed:

- A step was added to or removed from a sequence — a new call, a new hop across a boundary, a new queue or channel in the path.
- A state machine gained a state, lost one, or changed a transition rule or a cap.
- Startup, shutdown, or wiring changed — something new is constructed, injected, or torn down in a different order.
- An ordering, retry, timeout, or failure path changed.
- A described flow contradicts what a diagram currently shows. That is drift, and it counts even with no new change.

Do **not** fire for test-only changes, formatting, config additions with no runtime effect, or a refactor that preserved the flow exactly.

One change often touches several diagrams: wiring a component usually appears in both the startup diagram and the flow that uses it. Check the type's `index.md` for scope lines rather than guessing from filenames.

## Drafting the change

Read each affected file in full first — a diff against a half-remembered diagram is worthless.

Then work out precisely what moves, by diagram type:

- **Sequence** — which participant, message, or note changes. Watch for a new participant needing to be declared, and for the message *order* being the thing that changed.
- **State** — which state or transition changes, and whether an existing transition's guard or cap moved.
- **Flowchart** — which node, edge, or note changes.

Update the prose notes below the diagram too. A diagram whose notes describe the old behavior is a document that lies in half of itself.

**The notes are for what the diagram cannot show** — an ordering constraint, a cap, a failure path, a non-obvious reason a step sits where it does. A few short ones, not an essay: the diagram is the document, and notes that restate it in prose are the commonest way one of these doubles in size without gaining anything.

Be surgical. Do not rewrite a whole diagram unless the structure itself changed — a rewritten diagram is unreviewable, and the reader cannot tell what actually moved.

## New diagrams

When a flow appears that no existing diagram covers: confirm the filename and the scope with the user before creating anything, then follow the structure of the diagrams already there. Typically a title, a one-sentence scope line, the diagram, then a handful of short notes.

The new file needs its entry in the type's `index.md`, with its scope, or nothing will ever find it.

## Verify before you finish

Mermaid fails silently in most renderers: a broken diagram shows as an error box or as nothing at all, and nobody notices for weeks. After writing, confirm the fences are closed, the diagram type declaration is intact on the first line, every participant referenced is declared, and no arrow points at a node that no longer exists.
