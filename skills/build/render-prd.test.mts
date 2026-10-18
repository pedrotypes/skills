import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'node:test'

// Runs render-prd.mjs the way the skill does. A PRD lives in its plan folder as prd.md, with its mockups, when it has any, beside it as mockups.html.
const script = join(import.meta.dirname, 'render-prd.mjs')
const run = (...args: string[]) => spawnSync('node', [script, ...args], { encoding: 'utf8' })

function renderFile(planPath: string, ...options: string[]) {
  const result = run(...options, planPath)
  assert.equal(result.status, 0, result.stderr)
  return result.stdout
}

// Writes the PRD, and its mockups if given, to a fresh plan folder first.
function render(plan: string, mockups?: string) {
  const dir = mkdtempSync(join(tmpdir(), 'prd-'))
  writeFileSync(join(dir, 'prd.md'), plan)
  if (mockups !== undefined) writeFileSync(join(dir, 'mockups.html'), mockups)
  return renderFile(join(dir, 'prd.md'))
}

// Writes a plan folder <Plans>/<name>/ holding prd.md.
function folder(plans: string, name: string, prd: string) {
  mkdirSync(join(plans, name), { recursive: true })
  writeFileSync(join(plans, name, 'prd.md'), prd)
  return join(plans, name, 'prd.md')
}

const plan = `---
type: PRD
title: Answer export
description: Export an answer as Markdown.
---

# P9 — Answer export

Ticket: [PROJ-12](https://example.atlassian.net/browse/PROJ-12)

## Summary

People copy answers into tickets by hand. They get an **Export** button.

## What you said

- “Copying answers loses the citations.” (ticket) → The export keeps every citation as a link.

## Where I might be wrong

- **Markdown only.** No PDF. **If not:** we need a renderer.

## Done when

- **P9-S1 Download**: the button downloads \`answer.md\`.
- **P9-S2 Failure**: a failed export says why.

## Solution

\`\`\`mermaid
flowchart LR
  A --> B
\`\`\`

Export runs in the browser.

### Your directives

- “No server round trip.” (chat)

## Out of scope

- PDF.

## Open questions
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

test('scenarios become rows keyed by their short id, each with its name', () => {
  const html = render(plan)
  assert.match(html, /<span class="id">S1<\/span><span><strong>Download<\/strong>: the button downloads <code>answer.md<\/code>.<\/span>/)
})

test('mermaid stays mermaid, so the viewer draws it', () => {
  const html = render(plan)
  assert.match(html, /<pre class="mermaid">flowchart LR\n  A --&gt; B<\/pre>/)
})

test('directives and out of scope fold into the record, and empty sections vanish', () => {
  const html = render(plan)
  assert.match(html, /<summary>Your directives<\/summary>/)
  assert.match(html, /<summary>Out of scope<\/summary>/)
  assert.doesNotMatch(html, /Open questions/)
})

test('the page is labelled a PRD', () => {
  assert.match(render(plan), /<span class="micro">PRD P9<\/span>/)
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
  const html = render(plan.replace('- **P9-S1', '1. **P9-S1').replace('- **P9-S2', '2. **P9-S2'))
  assert.match(html, /<span class="id">S1<\/span>/)
  assert.match(html, /<span class="id">S2<\/span>/)
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
  writeFileSync(join(dir, 'prd.md'), plan)
  writeFileSync(join(dir, 'theme.css'), ':root {\n  color-scheme: light dark;\n  --accent: #f60439;\n  --ink: light-dark(#111, #eee);\n}\nbutton { color: red; }\n')
  const html = renderFile(join(dir, 'prd.md'), '--tokens', join(dir, 'theme.css'))
  assert.match(html, /:root \{ --accent: #f60439; --ink: light-dark\(#111, #eee\); \}\n<\/style>/)
  assert.doesNotMatch(html, /color: red/)
})

test('--check passes when every PRD page matches its PRD, and names the stale ones', () => {
  const dir = mkdtempSync(join(tmpdir(), 'check-'))
  const prd = folder(dir, 'p9-export', plan)
  writeFileSync(join(dir, 'p9-export', 'prd.html'), renderFile(prd))
  folder(dir, 'p8-old', plan)
  writeFileSync(join(dir, 'P7-flat.md'), plan)
  writeFileSync(join(dir, 'P7-flat.html'), 'an older layout, left alone')
  assert.equal(run('--check', dir).status, 0)

  writeFileSync(prd, plan.replace('Answer export', 'Answer export v2'))
  const stale = run('--check', dir)
  assert.equal(stale.status, 1)
  assert.match(stale.stderr, /p9-export\/prd\.html is stale/)
})

test('--check renders with the tokens the PRD pages were made with', () => {
  const dir = mkdtempSync(join(tmpdir(), 'check-tokens-'))
  writeFileSync(join(dir, 'theme.css'), ':root { --accent: #123456; }')
  const prd = folder(dir, 'p9-export', plan)
  writeFileSync(join(dir, 'p9-export', 'prd.html'), renderFile(prd, '--tokens', join(dir, 'theme.css')))
  assert.equal(run('--check', dir).status, 1)
  assert.equal(run('--tokens', join(dir, 'theme.css'), '--check', dir).status, 0)
})

test('a link with an unsafe scheme renders as text', () => {
  const html = render(plan.replace('Export runs in the browser.', "See [review](javascript:alert(1)) and [docs](https://example.com/a), [plan](./plan.md), [mail](mailto:a@b.c)."))
  assert.doesNotMatch(html, /href="javascript:/i)
  assert.match(html, />review<\/a>|review/)
  assert.match(html, /<a href="https:\/\/example.com\/a">docs<\/a>/)
  assert.match(html, /<a href="\.\/plan.md">plan<\/a>/)
  assert.match(html, /<a href="mailto:a@b.c">mail<\/a>/)
})

test('a long unbroken word wraps instead of widening the page', () => {
  assert.match(render(plan), /body \{[^}]*overflow-wrap: anywhere/)
})

test('a numbered list keeps its numbers', () => {
  const html = render(plan.replace('Export runs in the browser.', '1. First step.\n2. Second step.'))
  assert.match(html, /<ol><li>First step.<\/li><li>Second step.<\/li><\/ol>/)
})

test('a PRD titled `# P<n> <Name>` with no front matter shows the name alone', () => {
  const bare = plan.replace(/^---[\s\S]*?---\n\n/, '').replace('# P9 — Answer export', '# P9 Answer export')
  const html = render(bare)
  assert.match(html, /<title>P9 Answer export<\/title>/)
  assert.match(html, /<h1>Answer export<\/h1>/)
})

test('a signed-off PRD says so instead of waiting for a nod', () => {
  assert.match(render(plan), /Waiting for your nod/)
  const html = render(plan.replace('\n## Summary', 'Signed off: 2026-10-18\n\n## Summary'))
  assert.match(html, /<span class="chip[^"]*">Signed off 2026-10-18<\/span>/)
  assert.doesNotMatch(html, /Waiting for your nod/)
})
