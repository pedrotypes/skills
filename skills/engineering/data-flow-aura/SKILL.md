---
name: data-flow-aura
version: 1.0.0
description: Maintains docs/data-flows/ Mermaid diagrams when data flows change or new ones are needed.
triggers:
  - update data flow diagram
  - add a data flow diagram
  - document this flow
allowed-tools:
  - Read
  - Write
  - Edit
  - AskUserQuestion
  - Bash
---

# data-flow-aura

Maintains the Mermaid diagrams in `docs/data-flows/` whenever a conversation
reveals that a data flow has changed or a new one is needed.

## When to activate proactively

Fire whenever the conversation contains evidence of a flow change or a new
flow. Specific signals:

- A new command, adapter, port, or queue operation was added or removed
- The status transition rules for events changed (new status, new transition,
  cap change, Recover behaviour)
- The daemon wiring changed (new goroutine, new shutdown step, channels map
  now populated, new event source)
- A channel path changed (Ingest, Notify, Subscribe, Send now wired or removed)
- The history rule, thread key, or agent loop tick changed
- The conversation describes a flow and the description contradicts what a
  diagram currently shows
- The user says "update the diagram", "add a flow", or "document this"

Do **not** fire for pure test changes, config schema additions with no runtime
effect, or formatting-only edits.

## Procedure

### 1. Identify affected diagrams

The diagrams and their scope live in `docs/data-flows`.
A single change may touch more than one file (e.g. wiring the channels map
affects both message-processing and daemon-startup).

### 2. Read the current diagram(s)

Read each affected file in full so the proposed diff is accurate.

### 3. Draft the change

Work out exactly what needs to change in the Mermaid source:

- For sequence diagrams: which participant, message, or note changes
- For state diagrams: which state or transition changes
- For flowcharts: which node, edge, or note changes
- For the prose notes below the diagram: update any Note that describes the
  changed behaviour

Be precise — do not rewrite the whole diagram unless the structure itself has
changed.

### 4. Ask for confirmation via AskUserQuestion

Present the proposed change before touching any file. Use this structure:

```
Question: "Update [filename] to reflect [one-sentence summary of what changed]?"

Options:
  - "Yes, apply it" — description: show the specific Mermaid lines that will change (old → new), using the preview field
  - "Adjust first" — description: user will clarify before you write
  - "Skip" — description: leave the diagram as-is for now
```

Use the `preview` field on the "Yes" option to show the exact diff — old lines
struck out or labelled OLD, new lines labelled NEW. Keep it to the changed
lines only, not the whole diagram.

If more than one diagram is affected, present them as separate questions in
the same AskUserQuestion call (up to 4 questions per call).

### 5. Apply confirmed changes

For each confirmed change:

1. Edit the file — prefer `Edit` for targeted changes, `Write` only for a full
   structural rewrite.
2. After writing, verify the Mermaid fences are intact and the file is valid
   markdown (no unclosed code blocks).

### 6. If a new diagram is needed

If the change introduces a flow that none of the three files covers:

1. Ask the user to confirm the new file name and scope before creating it.
2. Create `docs/data-flows/<slug>.md` following the same structure:
   a header, a one-sentence scope line, the Mermaid diagram, and prose notes
   below.
3. Add a bullet to the `data flows` entry in `AGENTS.md` and `CLAUDE.md`
   naming the new file and its scope.

## Tone

Be concise in the AskUserQuestion. The description of the change should be one
sentence; the preview shows the detail. Do not repeat the full diagram.
