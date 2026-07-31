---
name: kb-init
description: Make sure this project has an agent-maintained knowledge base in Open Knowledge Format — find one if it exists, adapt to whatever conventions are already there, or start one where the user wants it, and record the paths in AGENTS.md so every later skill reads them from one place. Use when the user asks to set up, initialize, or check the knowledge base, docs, or KB for a project, or when another skill needs documentation paths and no registry exists yet.
---

# kb-init

Ensures a project has a knowledge base the agent can maintain: a set of directories in [Open Knowledge Format](references/okf.md), and a table in `AGENTS.md` that tells every later skill where they are. Run it in any repository — yours or someone else's.

Two rules govern everything below. **Adapt to what exists**: if the project already has a place for a type of document, that place wins over any convention of ours. **OKF is not negotiable**: documents this or any later skill authors carry OKF frontmatter, and reserved filenames mean what the spec says they mean. Everything else — directory names, filename patterns, which document types exist — is the user's call.

Never write anything before step 4.

## 1. Probe

Establish what is already here before forming an opinion. Read, don't write.

```bash
# An existing OKF bundle announces itself.
grep -rl "okf_version" --include="*.md" . 2>/dev/null | head

# A registry we or another session already wrote.
grep -n "okf-registry\|## Knowledge base" AGENTS.md CLAUDE.md 2>/dev/null

# What documentation directories exist at all.
ls -d docs doc documentation architecture adr rfcs .agents 2>/dev/null
find docs doc documentation -maxdepth 2 -type d 2>/dev/null | head -30

# Instruction-file state — this decides the symlink question in step 4.
ls -la AGENTS.md CLAUDE.md 2>/dev/null

# Review agents on this machine — these become the options in step 3.
for c in codex opencode pi antigravity gemini aider cursor-agent crush goose; do
  command -v "$c" >/dev/null 2>&1 && echo "$c"
done
```

Then read enough to know the conventions rather than guess them: any `index.md` that declared `okf_version`, a few filenames from each candidate directory (numbering scheme, kebab or not), and the frontmatter of two or three existing documents. If `AGENTS.md` exists, read it — it may already describe where documentation lives in prose.

## 2. Classify

The probe lands in one of four cases. Say plainly which one, and what you found.

**Already registered** — a `## Knowledge base` table is in `AGENTS.md`. Verify each path still exists and each type still has an `index.md`, and report any drift. Then continue into step 3 treating the two tables as the answers already given: a re-run closes gaps and nothing else. Where everything is present and this skill has no question the tables do not already answer, say so and stop.

**An OKF bundle exists, unregistered** — something declares `okf_version`. Adopt its directories as they are. Infer one document type per distinct `type` value already in use. Propose the table; do not invent new directories alongside it.

**Documentation exists, not OKF** — `docs/adr/`, `architecture/`, `docs/flows/`, a `doc/` tree, anything. Map each of our document types onto the closest existing directory, and carry that directory's own filename convention into the table: a project that numbers decisions `0007-thing.md` gets `<NNNN>-<slug>.md`, not our pattern. Where no directory fits a type, mark it as needing a new one.

**Nothing** — a greenfield knowledge base. Default to `.agents/`, which says agent-maintained rather than human handbook and stays out of the way of whatever the project does with `docs/`. The user can override.

## 3. Decide, with the user

Use `AskUserQuestion`. This is a hard stop — the point of the skill is that the user sees the mapping before anything is written into their repository.

Present the proposed table: for each type, the directory, its `index.md`, and the filename pattern. Ask about exactly what is genuinely open:

**A settled answer is not open.** Anything the existing tables already state is kept, and anything the declined marker lists stays declined — state both in one line as being kept, and do not put either to a vote. Ask only where a path has drifted, or this skill has learned to ask something the tables were written before. Where an answer exists but a related question is new, carry the existing value in as the recommended option so the cheapest response is to keep it.

- **The root folder name**, when nothing exists. Recommend `.agents/`; offer `docs/` where that is already the local idiom, and let them type their own.
- **Which document types to set up now.** Default to all three in [Document types](#document-types). A project with no plans workflow may not want `Plan`. Whatever is turned down goes in the declined marker and is never offered again — offer it only if the user brings it up.
- **Any mapping you are unsure of**, one question each, with the existing directory as the recommended option.
- **Whether an adversarial review runs automatically once implementation completes**, and if so **which reviewer** — one option per agent the probe found, plus a subagent of the current harness. An outside agent is the stronger review because it shares no context with the session that wrote the code; a subagent is the fallback when nothing else is installed. Ask both even when the first answer is no — the reviewer still decides who runs a review the user invokes by hand.

If a type maps onto a directory full of documents that predate OKF, say so and confirm the plan: new documents get frontmatter, existing ones are left alone. Converting someone's existing docs is a separate job and needs its own ask.

## 4. Write

Only what was approved, and nothing more. Every write below is additive: add the missing row, create the missing directory, leave what is already correct exactly as it is. A second run over a current repo writes nothing.

1. **Create each type's directory** if it does not exist.
2. **Write each type's `index.md`** — the OKF listing file. Frontmatter `type: Index`, a `title`, a one-line `description`. Body: one line per document, a relative link and a short gloss. An empty type gets an index that says so; an index that already exists is extended, never rewritten.
3. **Write the root `index.md`** of the bundle with `okf_version: "0.2"` in its frontmatter. This is the marker that makes the bundle self-describing, so a future session — or a different agent entirely — finds it without a registry.
4. **Write the registry block into `AGENTS.md`** exactly as in [The registry block](#the-registry-block), followed by the [workflow block](#the-workflow-block). Create `AGENTS.md` if it is absent. If it exists, append the sections and leave everything else untouched. Where a block is already there, add the missing rows to it in place — never replace the block, and never reorder or reword rows the user already has. Write or extend the `<!-- okf-declined: ... -->` marker with anything turned down in this run.
5. **Handle `CLAUDE.md`.** Claude Code reads `CLAUDE.md`, not `AGENTS.md`, so it needs to resolve to the same file: `ln -s AGENTS.md CLAUDE.md`. If a `CLAUDE.md` already exists, **stop and ask** — never overwrite it; the usual fix is an `@AGENTS.md` import at its top instead. In a repository that is not the user's, keep the symlink out of the project's history with `.git/info/exclude`, not their `.gitignore`.

## 5. Report

State the paths written, the `CLAUDE.md` decision, and that later skills will now resolve paths from the table. Do not commit unless asked.

## The registry block

```markdown
## Knowledge base

<!-- okf-registry -->

Agent-maintained documentation, in Open Knowledge Format. These are the paths the skills read and write — keep the table accurate if documents move.

| Type | Directory | Index | Files |
| --- | --- | --- | --- |
| Reference | `.agents/reference/` | `.agents/reference/index.md` | `<slug>.md` |
| Data Flow | `.agents/data-flows/` | `.agents/data-flows/index.md` | `<slug>.md` |
| Plan | `.agents/plans/` | `.agents/plans/index.md` | `P<n>-<slug>.md`, research `R<n>-<slug>.md` |

<!-- okf-declined: Data Flow -->
```

The columns: **Type** is the OKF `type` written into each document's frontmatter. **Directory** is repo-relative. **Index** is that type's OKF listing file. **Files** is the filename pattern — `<slug>` is kebab-case, `<n>` is an integer allocated one above the highest already in use *counted across all branches*, `<NNNN>` is the same zero-padded to four digits. A type may list more than one pattern when its documents come in pairs.

Paths are plain backticked text, never `@` imports — an import loads the whole file into context at session start, which defeats the purpose. The table is the only part always in context; a type's `index.md` is read when an agent needs to know what exists, and a document only when it needs the content. That is the progressive disclosure, and it works in any harness that can read a file.

The `<!-- okf-registry -->` marker is the machine anchor. Claude Code strips block-level HTML comments before instruction files enter context but the Read tool still sees them, so it costs nothing.

`<!-- okf-declined: ... -->` is the other marker: a comma-separated list of document types the user turned down, omitted entirely when there are none. It exists so a re-run can tell a type the user rejected from one this skill had not yet learned to offer — without it the two are indistinguishable and every run re-litigates the same decision. Add to the list, never remove from it; a type the user later adopts moves into the table and out of the marker.

## The workflow block

A handful of choices the development skills would otherwise ask about every single time. Ask for them in step 3, alongside the mapping, and write them next to the registry:

```markdown
## Workflow

How the development skills should behave in this project.

| Setting | Value |
| --- | --- |
| Base branch | `main` |
| Open a PR when implementation completes | ask |
| Merge style | squash |
| Worktrees | yes — under `.worktrees/` |
| Adversarial review after implementation | auto |
| Reviewer | `codex` |
```

**Base branch** — what features branch from and land into; read it from the repository rather than assuming `main`. **Open a PR** — `yes`, `no`, or `ask`; `ask` is the safe default and means one question at the end of implementation, not a debate. **Merge style** — match the project's existing history (`git log --oneline -20` tells you whether it squashes). **Worktrees** — whether feature work gets its own worktree, or happens on a plain branch. **Adversarial review** — `auto`, `ask`, or `no`; `auto` means it runs at the end of implementation with no question asked. **Reviewer** — the command that runs it, or `subagent` for one inside the current harness; it governs every review, including ones the user invokes by hand, so it belongs in the table even when review is `no`.

Defaults are fine when the repository makes the answer obvious; ask only where it genuinely does not. Every setting is one the user can change later by editing the table.

## Document types

| Type | Holds |
| --- | --- |
| `Reference` | Design and architecture reference — the durable shape of the system. |
| `Data Flow` | Mermaid diagrams of how data moves at runtime. |
| `Plan` | Implementation plans and their paired research notes. |

The list grows over time. A new type is a new row and a new `type` string — OKF does not centrally register type values, so nothing else has to change.

`log.md` is the other reserved OKF filename: a chronological change history, and where a retrospective belongs rather than in a document of its own.

## Resolution, for every later skill

A skill that needs a documentation path reads the `AGENTS.md` table and takes it from there. It does not guess, and it does not fall back to a hardcoded default — hardcoded paths are the thing this registry exists to remove. **If the block is absent, the project is not set up: invoke this skill and stop.**
