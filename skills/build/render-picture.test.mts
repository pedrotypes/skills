import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdtempSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'node:test'

// Runs render-picture.mjs the way the skill does. A plan's mockups, when it has any, sit beside it as P<n>-<slug>.mockups.html.
const script = join(import.meta.dirname, 'render-picture.mjs')
const run = (...args: string[]) => spawnSync('node', [script, ...args], { encoding: 'utf8' })

function renderFile(planPath: string, ...options: string[]) {
  const result = run(...options, planPath)
  assert.equal(result.status, 0, result.stderr)
  return result.stdout
}

// Writes the plan, and its mockups if given, to a fresh directory first.
function render(plan: string, mockups?: string) {
  const dir = mkdtempSync(join(tmpdir(), 'picture-'))
  writeFileSync(join(dir, 'P9.md'), plan)
  if (mockups !== undefined) writeFileSync(join(dir, 'P9.mockups.html'), mockups)
  return renderFile(join(dir, 'P9.md'))
}

const plan = `---
type: Plan
title: Answer export
description: Export an answer as Markdown.
---

# P9 — Answer export

Ticket: [PROJ-12](https://example.atlassian.net/browse/PROJ-12)

Plan review: with the PR

## Summary

People copy answers into tickets by hand. They get an **Export** button.

## What you said

- “Copying answers loses the citations.” (ticket) → The export keeps every citation as a link.

## Where I might be wrong

- **Markdown only.** No PDF. **If not:** we need a renderer.

## Done when

- **P9-Scenario1**: the button downloads \`answer.md\`.
- **P9-Scenario2**: a failed export says why.

## Solution

\`\`\`mermaid
flowchart LR
  A --> B
\`\`\`

Export runs in the browser.

### Your directives

- “No server round trip.” (chat)

### My decisions

| Choice | Rejected | Why |
| --- | --- | --- |
| Client-side | An endpoint | No new surface |

## Out of scope

- PDF.

## Changed during implementation
`

test('the title, lede and ticket come from the plan', () => {
  const html = render(plan)
  assert.match(html, /<title>P9 Answer export<\/title>/)
  assert.match(html, /<h1>Answer export<\/h1>/)
  assert.match(html, /<strong>Export<\/strong> button/)
  assert.match(html, /href="https:\/\/example.atlassian.net\/browse\/PROJ-12">PROJ-12</)
})

test('what you said pairs each quote with its reading', () => {
  const html = render(plan)
  assert.match(html, /<blockquote>“Copying answers loses the citations.” \(ticket\)<\/blockquote>\s*<span class="arrow"[^>]*>→<\/span>\s*<p class="took">The export keeps every citation as a link.<\/p>/)
})

test('each assumption becomes a card with its consequence apart', () => {
  const html = render(plan)
  assert.match(html, /<article><h3>Markdown only.<\/h3><p>No PDF.<\/p><p class="if"><strong>If not:<\/strong> we need a renderer.<\/p><\/article>/)
})

test('scenarios become rows keyed by their short id', () => {
  const html = render(plan)
  assert.match(html, /<span class="id">Scenario1<\/span><span>the button downloads <code>answer.md<\/code>.<\/span>/)
})

test('mermaid stays mermaid, so the viewer draws it', () => {
  const html = render(plan)
  assert.match(html, /<pre class="mermaid">flowchart LR\n  A --&gt; B<\/pre>/)
})

test('directives, decisions and out of scope fold into the record, and empty sections vanish', () => {
  const html = render(plan)
  assert.match(html, /<summary>Your directives<\/summary>/)
  assert.match(html, /<summary>My decisions<\/summary>[\s\S]*<td>Client-side<\/td>/)
  assert.match(html, /<summary>Out of scope<\/summary>/)
  assert.doesNotMatch(html, /Changed during implementation/)
})

test('mockups are inserted as written, and their section is left out without them', () => {
  assert.match(render(plan, '<div class="frames">X</div>'), /What you'll see<\/h2>\s*<div class="frames">X<\/div>/)
  assert.doesNotMatch(render(plan), /What you'll see/)
})

test('plain text is escaped', () => {
  const html = render(plan.replace('Export runs in the browser.', 'Uses <script> & stuff.'))
  assert.match(html, /Uses &lt;script&gt; &amp; stuff./)
})

test('the page draws its diagrams without the artifact viewer, from a pinned Mermaid', () => {
  assert.match(render(plan), /<script src="https:\/\/cdn\.jsdelivr\.net\/npm\/mermaid@\d+\.\d+\.\d+\/dist\/mermaid\.min\.js"><\/script>/)
})

test('R1-1: numbered scenarios render like bulleted ones', () => {
  const html = render(plan.replace('- **P9-Scenario1**', '1. **P9-Scenario1**').replace('- **P9-Scenario2**', '2. **P9-Scenario2**'))
  assert.match(html, /<span class="id">Scenario1<\/span>/)
  assert.match(html, /<span class="id">Scenario2<\/span>/)
})

test('R1-2: headings inside a fence stay in the fence', () => {
  const fenced = '```md\n## Summary\nfake\n### Not a subsection\n```\n\nExport runs in the browser.'
  const html = render(plan.replace('Export runs in the browser.', fenced))
  assert.match(html, /<strong>Export<\/strong> button/)
  assert.match(html, /<pre>## Summary\nfake\n### Not a subsection<\/pre>/)
  assert.doesNotMatch(html, /<summary>Not a subsection<\/summary>/)
})

test('R1-3: the page is a complete document that lays out for phones', () => {
  const html = render(plan)
  assert.match(html, /^<!doctype html>/)
  assert.match(html, /<meta charset="utf-8">/)
  assert.match(html, /<meta name="viewport" content="width=device-width, initial-scale=1">/)
})

test('R1-5: a Solution that says None draws no How it works', () => {
  const html = render(plan.replace(/## Solution[\s\S]*?### Your directives/, '## Solution\n\nNone.\n\n### Your directives'))
  assert.doesNotMatch(html, /How it works/)
})

test('--tokens takes the product colours from a CSS file, and only its custom properties', () => {
  const dir = mkdtempSync(join(tmpdir(), 'tokens-'))
  writeFileSync(join(dir, 'P9.md'), plan)
  writeFileSync(join(dir, 'theme.css'), ':root {\n  color-scheme: light dark;\n  --accent: #f60439;\n  --ink: light-dark(#111, #eee);\n}\nbutton { color: red; }\n')
  const html = renderFile(join(dir, 'P9.md'), '--tokens', join(dir, 'theme.css'))
  assert.match(html, /:root \{ --accent: #f60439; --ink: light-dark\(#111, #eee\); \}\n<\/style>/)
  assert.doesNotMatch(html, /color: red/)
})

test('--check passes when every picture matches its plan, and names the stale ones', () => {
  const dir = mkdtempSync(join(tmpdir(), 'check-'))
  writeFileSync(join(dir, 'P9-export.md'), plan)
  writeFileSync(join(dir, 'P9-export.html'), renderFile(join(dir, 'P9-export.md')))
  writeFileSync(join(dir, 'P8-old.md'), plan)
  assert.equal(run('--check', dir).status, 0)

  writeFileSync(join(dir, 'P9-export.md'), plan.replace('Answer export', 'Answer export v2'))
  const stale = run('--check', dir)
  assert.equal(stale.status, 1)
  assert.match(stale.stderr, /P9-export\.html is stale/)
})

test('--check renders with the tokens the pictures were made with', () => {
  const dir = mkdtempSync(join(tmpdir(), 'check-tokens-'))
  writeFileSync(join(dir, 'theme.css'), ':root { --accent: #123456; }')
  writeFileSync(join(dir, 'P9-export.md'), plan)
  writeFileSync(join(dir, 'P9-export.html'), renderFile(join(dir, 'P9-export.md'), '--tokens', join(dir, 'theme.css')))
  assert.equal(run('--check', dir).status, 1)
  assert.equal(run('--tokens', join(dir, 'theme.css'), '--check', dir).status, 0)
})
