---
name: kb-maintain
description: Keep the project's knowledge base current — work out which document types a change affects, learn each type's local conventions from the documents already there, then draft, confirm, and apply the updates including indexes and change log. Handles whatever document types a project defines, not a fixed list. Use when a change has altered how the system works, when the user asks to update or document something, or when another skill needs the knowledge base brought up to date.
---

# kb-maintain

The knowledge base only earns its keep if it is true. This skill is what keeps it true: one place that knows how to add to and update every document type a project maintains.

**Every project has a different set of document types.** One has architecture references and data-flow diagrams; another adds runbooks, API references, decision records, or domain glossaries. So this skill holds no fixed list of document types and no fixed shape for any of them. It reads what this project declares, then learns each type's conventions from the documents already sitting in that directory. The registry says *what* exists; the existing documents say *what they look like*.

Two hard rules. **Nothing is written before the user confirms.** And **only what you can evidence** — if you cannot point at the diff hunk, the file, or the conversation turn a claim comes from, it does not go in. Three true load-bearing facts beat ten plausible ones.

## 1. Read the registry

The `## Knowledge base` table in `AGENTS.md` lists this project's document types, their directories, their indexes, and their filename patterns. **No table means invoke `kb-init` and stop.** Never guess a path, never invent a type that is not in the table, and never write outside the declared directories.

## 2. Work out what is affected

Start from evidence, not from a feeling that documentation is owed. The trigger is usually one of: a change just landed and the conversation shows what moved; the user asked for something to be documented or updated; or something read in the code contradicts what a document claims.

Map the change onto types by asking what *sort* of truth moved, then matching that against the types in the table:

- Behavior, an invariant, a failure path, a rule a future reader must know.
- Structure — a new component, a moved responsibility, a boundary that shifted.
- Runtime movement — a sequence, a state machine, wiring, ordering.
- Operational fact — how the thing is built, deployed, configured, recovered.
- Domain meaning — a term, an entity, a rule of the business.

A single change often touches more than one type, and often more than one document within a type. It also often touches **none** — pure test churn, formatting, a config addition with no runtime effect, a refactor that changed no behavior. Saying "nothing here needs documenting" is a correct and frequent answer; manufacturing an update to look diligent is worse than doing nothing.

Read the affected types' `index.md` files first. That is what they are for: seeing what already exists before opening anything. Then read in full each document you intend to change, so the proposed diff is real.

## 3. Learn the type's conventions

Before drafting, know what a document of this type looks like *here*. In order:

1. **A bundled reference.** If `references/` has a file for this type — [data-flow.md](references/data-flow.md) for diagram-shaped types — read it.
2. **The siblings.** Read two or three existing documents in that directory. They are the specification: heading structure, how much prose, whether diagrams appear, how frontmatter is filled in, how they link to each other. Match them. A document that reads like an outsider wrote it is a document nobody trusts.
3. **The index's own note.** A type's `index.md` may carry a short conventions note. Honor it.
4. **Ask, once, then write it down.** If the directory is empty and no reference covers the type, ask the user what a document of this type should contain — then record the answer as a conventions note in that type's `index.md`, so the next run inherits it instead of asking again. This is how a project teaches the skill its own types.

Whatever the shape, OKF is not negotiable: frontmatter with `type` set to the document type from the table, plus `title` and a one-sentence `description`. See [references/okf.md in kb-init](../kb-init/references/okf.md) for the format.

## 4. Draft precisely

Work out the exact edit — the specific lines to add or change, in the voice and structure of the target. Prefer a tight `Edit` over a rewrite; rewrite only when the structure itself changed. Do not restructure a document as a side effect of updating one fact in it.

For a **new** document: the filename follows the type's pattern from the table, and content follows the conventions from step 3.

Apply nothing yet.

## 5. Confirm in one pass

Present everything together in a single `AskUserQuestion` — every document, old → new, so the user validates the permanent record once rather than being interrupted per file.

- One question per affected document, up to the tool's limit of four. More than four means pre-filtering to the highest-value ones and saying in prose what you set aside and why.
- Options: **Apply**, with the changed lines in the `preview` field; **Adjust first**; **Skip**.
- Keep each question to one sentence. The preview carries the detail — never paste a whole document into the question.
- A new document gets its filename and scope confirmed in the same call.

Capture only what the user approves. A skip is a skip; do not re-argue it.

**When another skill invoked you**, draft and hand back instead of running your own gate, so your confirmations fold into that skill's single gate. `back-and-forth`'s landing phase works this way.

## 6. Apply

For each approved item:

1. Edit or create the file.
2. **Update the type's `index.md`** — a new document needs its entry; a document whose scope changed needs its line corrected. An index that has drifted from its directory is worse than no index, because it is believed.
3. **Append to `log.md`** if the bundle keeps one: a dated line saying what changed and why. This is the reserved OKF file for chronological history.
4. Verify the file is valid markdown — fences closed, frontmatter intact, diagram blocks parseable.

Then report: what changed where, and anything deliberately left out.

## Drift, when you find it

If a document contradicts the code, say so plainly and treat the document as wrong until proven otherwise — the code is what runs. Bring it to the user with both sides quoted; do not quietly "fix" a document to match code you have not read, and do not leave a known-false document standing because updating it was not the task you were given.
