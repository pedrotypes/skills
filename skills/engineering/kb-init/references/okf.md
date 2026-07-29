# Open Knowledge Format v0.2 — what a document must look like

The spec that matters is [`GoogleCloudPlatform/knowledge-catalog/okf/SPEC.md`](https://github.com/GoogleCloudPlatform/knowledge-catalog/blob/main/okf/SPEC.md). Be careful with `okf.md/spec/`: it publishes v0.1 and is behind. v0.2 renamed `timestamp` to `generated.at` inside a `generated` mapping, and moved body citations into a frontmatter `sources` list.

OKF is deliberately small. A knowledge base is a directory of markdown files, one concept per file, linked with ordinary markdown links. There is no schema registry, no central authority, and no required tooling — if you can read the file, you can read the format.

## Frontmatter

`type` is the **only required field**. It is a short descriptive string naming the concept type, and type values are explicitly *not* centrally registered — a project defines its own.

Recommended alongside it: `title` (human-readable name), `description` (one sentence), `resource` (a URI identifying the underlying asset, where one exists), `tags` (a list), `sources` (citations), and `generated.at` (ISO 8601, when a generator last wrote the file).

Producers may add their own fields, and consumers **must preserve frontmatter keys they do not understand**. Never strip a key just because it is unfamiliar.

```markdown
---
type: Data Flow
title: Checkout payment capture
description: How a cart becomes a captured payment, across the payments port and its Stripe adapter.
tags: [payments, checkout]
---

# Checkout payment capture

...
```

## Reserved filenames

`index.md` — a directory listing. Its job is progressive disclosure: it lets a human or agent see what is available before opening any individual document. Sections group concepts, each with a relative link and a short description.

`log.md` — a chronological change history, entries grouped by date.

Every other `.md` file is a concept document. Only the bundle's root `index.md` may declare `okf_version` in its frontmatter.

## Linking

Two forms. **Absolute, bundle-relative** links begin with `/` and are recommended, since they survive documents moving. **Relative** links are fine for neighbours.

Links carry no type — the prose around a link is what conveys the relationship. Consumers **must tolerate broken links**, because a document may legitimately reference knowledge nobody has written yet.

## What this means in practice

A partially-converted directory is a valid bundle. Add frontmatter to documents you author; leave pre-existing documents alone unless the user asks for a conversion. Reference concepts that do not exist yet if the prose calls for them — a dangling link is a to-do, not an error.
