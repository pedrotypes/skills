// Renders a plan's Markdown as the picture: the page the user reads to confirm we picture the same thing.
// Usage: node render-picture.mjs [--tokens theme.css] <Plans>/P<n>-<slug>.md > <Plans>/P<n>-<slug>.html
//        node render-picture.mjs [--tokens theme.css] --check <Plans>    exits 1 naming each stale picture
// UI mockups, if any, are read from P<n>-<slug>.mockups.html beside the plan. --tokens takes the
// product's colours from the custom properties in the first :root block of a CSS file.
// It understands only what plans use: headings, paragraphs, lists, tables, quotes, fences.
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const css = readFileSync(join(import.meta.dirname, 'picture.css'), 'utf8')

const escape = text => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

// Plans quote other people's text verbatim, so a link may only go to the web, mail, or a relative path.
const safeHref = href => !/^[a-z][a-z0-9+.-]*:/i.test(href) || /^(https?|mailto):/i.test(href)

function inline(text) {
  const codes = []
  let out = escape(text).replace(/`([^`]+)`/g, (_, code) => `\u0000${codes.push(code) - 1}\u0000`)
  out = out
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, label, href) => safeHref(href) ? `<a href="${href}">${label}</a>` : label)
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[^*\w])\*([^*]+)\*(?!\*)/g, '$1<em>$2</em>')
  return out.replace(/\u0000(\d+)\u0000/g, (_, i) => `<code>${codes[i]}</code>`)
}

// A list item starts with a dash, a star or a number. Its continuation lines are joined on.
const marker = /^\s*([-*]|\d+\.)\s+/
const items = markdown => (markdown ?? '').split('\n')
  .reduce((list, line) => {
    if (marker.test(line)) list.push(line.replace(marker, ''))
    else if (line.trim() && list.length) list[list.length - 1] += ' ' + line.trim()
    return list
  }, [])

// Block-level Markdown, for the parts of a plan rendered as prose.
function blocks(markdown) {
  const lines = markdown.split('\n')
  const out = []
  for (let i = 0; i < lines.length;) {
    const line = lines[i]
    if (!line.trim()) { i++; continue }
    const fence = line.match(/^```(\w*)/)
    if (fence) {
      const body = []
      for (i++; i < lines.length && !lines[i].startsWith('```'); i++) body.push(lines[i])
      i++
      const cls = fence[1] === 'mermaid' ? ' class="mermaid"' : ''
      const pre = `<pre${cls}>${escape(body.join('\n'))}</pre>`
      out.push(fence[1] === 'mermaid' ? `<div class="figure">${pre}</div>` : pre)
      continue
    }
    const heading = line.match(/^#{3,6}\s+(.*)/)
    if (heading) { out.push(`<h3>${inline(heading[1])}</h3>`); i++; continue }
    if (marker.test(line)) {
      const list = []
      for (; i < lines.length && (marker.test(lines[i]) || /^\s{2,}\S/.test(lines[i])); i++) list.push(lines[i])
      const tag = /^\s*\d+\./.test(list[0]) ? 'ol' : 'ul'
      out.push(`<${tag}>${items(list.join('\n')).map(item => `<li>${inline(item)}</li>`).join('')}</${tag}>`)
      continue
    }
    if (line.startsWith('|')) {
      const rows = []
      for (; i < lines.length && lines[i].startsWith('|'); i++) rows.push(lines[i])
      const cells = row => row.replace(/^\||\|$/g, '').split('|').map(cell => cell.trim())
      const [head, , ...body] = rows
      out.push(`<div class="table"><table><thead><tr>${cells(head).map(c => `<th>${inline(c)}</th>`).join('')}</tr></thead><tbody>${
        body.map(row => `<tr>${cells(row).map(c => `<td>${inline(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`)
      continue
    }
    if (line.startsWith('>')) {
      const quote = []
      for (; i < lines.length && lines[i].startsWith('>'); i++) quote.push(lines[i].replace(/^>\s?/, ''))
      out.push(`<blockquote>${inline(quote.join(' '))}</blockquote>`)
      continue
    }
    const para = []
    for (; i < lines.length && lines[i].trim() && !/^(```|#|\||>)/.test(lines[i]) && !marker.test(lines[i]); i++) para.push(lines[i].trim())
    out.push(`<p>${inline(para.join(' '))}</p>`)
  }
  return out.join('\n')
}

// Renders one plan. tokens is a `:root { ... }` rule appended to the picture's own stylesheet, or ''.
function render(planPath, tokens) {
  const source = readFileSync(planPath, 'utf8')
  const mockupsPath = planPath.replace(/\.md$/, '.mockups.html')
  const mockups = existsSync(mockupsPath) ? readFileSync(mockupsPath, 'utf8').trim() : ''

  // Split the plan into its front matter, the lines above the first section, and its sections.
  const front = Object.fromEntries((source.match(/^---\n([\s\S]*?)\n---/)?.[1] ?? '').split('\n')
    .map(line => line.match(/^(\w+):\s*(.*)$/)).filter(Boolean).map(([, k, v]) => [k, v]))
  const body = source.replace(/^---\n[\s\S]*?\n---\n/, '')
  // Splits at headings of one level, skipping lines inside fences: [the text before the first, [name, text] per heading].
  function splitAt(markdown, hashes) {
    const parts = [['', []]]
    let fenced = false
    for (const line of markdown.split('\n')) {
      if (line.startsWith('```')) fenced = !fenced
      if (!fenced && line.startsWith(`${hashes} `)) parts.push([line.slice(hashes.length + 1).trim(), []])
      else parts[parts.length - 1][1].push(line)
    }
    const [[, lead], ...rest] = parts
    return [lead.join('\n'), rest.map(([name, text]) => [name, text.join('\n').trim()])]
  }
  const [top, rest] = splitAt(body, '##')
  const sections = Object.fromEntries(rest)
  const heading = top.match(/^# (.*)$/m)?.[1] ?? front.title ?? 'Plan'
  const number = heading.match(/^(P\d+)/)?.[1] ?? ''
  const title = front.title ?? heading.replace(/^P\d+\s*[—-]\s*/, '')
  const field = name => top.match(new RegExp(`^${name}:\\s*(.*)$`, 'm'))?.[1]

  // The Solution's directives and decisions belong to the record, not the picture.
  const [solutionLead, solutionSubs] = splitAt(sections.Solution ?? '', '###')
  const empty = text => !text.trim() || /^none\.?$/i.test(text.trim())

  let step = 0
  const section = (name, inner) => inner ? `<section><h2><span class="n">${++step}</span> ${name}</h2>\n${inner}\n</section>` : ''

  const said = items(sections['What you said']).map(item => {
    const [quote, took = ''] = item.split(/\s+→\s+/)
    return `<div class="said-row"><blockquote>${inline(quote)}</blockquote>\n<span class="arrow" aria-hidden="true">→</span>\n<p class="took">${inline(took)}</p></div>`
  }).join('\n')

  const assumptions = items(sections['Where I might be wrong']).map(item => {
    const [claim, ifNot] = item.split(/\s*\*\*If not:\*\*\s*/i)
    const titled = claim.match(/^\*\*(.+?)\*\*\s*(.*)$/)
    const head = titled ? `<h3>${inline(titled[1])}</h3>` : ''
    const text = titled ? titled[2] : claim
    return `<article>${head}${text ? `<p>${inline(text)}</p>` : ''}${ifNot ? `<p class="if"><strong>If not:</strong> ${inline(ifNot)}</p>` : ''}</article>`
  }).join('\n')

  const scenarios = items(sections['Done when']).map(item => {
    const m = item.match(/^\*\*P\d+-(Scenario\d+)\*\*:?\s*(.*)$/)
    return m ? `<div><span class="id">${m[1]}</span><span>${inline(m[2])}</span></div>` : `<div><span></span><span>${inline(item)}</span></div>`
  }).join('\n')

  const record = [...solutionSubs, ...['Standards changes', 'Out of scope', 'Open questions', 'Changed during implementation']
    .map(name => [name, sections[name] ?? ''])]
    .filter(([, text]) => !empty(text))
    .map(([name, text]) => `<details><summary>${inline(name)}</summary><div class="prose">${blocks(text)}</div></details>`)
    .join('\n')

  const ticket = field('Ticket')
  const lede = sections.Summary ? blocks(sections.Summary) : ''

  return `<!doctype html>
<html lang="en">
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escape(`${number} ${title}`.trim())}</title>
<style>
${css}${tokens}</style>
<main>
<header class="mast">
<div class="meta"><span class="micro">Plan ${escape(number)}</span>${ticket ? `<span class="micro">${inline(ticket)}</span>` : ''}<span class="chip ask">Waiting for your nod</span></div>
<h1>${inline(title)}</h1>
<div class="lede">${lede}</div>
</header>
${section('What you said, and what I took from it', said && `<div class="said">${said}</div>`)}
${section('Where my picture might differ from yours', assumptions && `<p class="soft">Each changes what gets built. Comment on the one that's wrong.</p>\n<div class="assume">${assumptions}</div>`)}
${section('What you\'ll see', mockups)}
${section('How it works', !empty(solutionLead) && `<div class="prose">${blocks(solutionLead)}</div>`)}
${section('Done when', scenarios && `<div class="done">${scenarios}</div>`)}
${section('The record', record && `<div>${record}</div>`)}
<script src="https://cdn.jsdelivr.net/npm/mermaid@11.4.1/dist/mermaid.min.js"></script>
<script>window.mermaid?.initialize({ startOnLoad: true, theme: matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'neutral' })</script>
<section class="answer"><p>If this matches what you meant, say so. If something's off, comment on the line.</p></section>
</main>
`
}

const args = process.argv.slice(2)
const option = name => {
  const at = args.indexOf(name)
  return at < 0 ? undefined : args.splice(at, 2)[1]
}
const tokensPath = option('--tokens')
const checkDir = option('--check')
const declarations = tokensPath
  ? (readFileSync(tokensPath, 'utf8').match(/:root\s*\{([^}]*)\}/)?.[1] ?? '').match(/--[\w-]+\s*:[^;]+;/g) ?? []
  : []
const tokens = declarations.length ? `:root { ${declarations.join(' ')} }\n` : ''

if (checkDir) {
  const stale = readdirSync(checkDir)
    .filter(name => /^P\d+-.*\.html$/.test(name) && !name.endsWith('.mockups.html'))
    .filter(name => readFileSync(join(checkDir, name), 'utf8') !== render(join(checkDir, name.replace(/\.html$/, '.md')), tokens))
  for (const name of stale) console.error(`${name} is stale: render it again from its plan`)
  process.exit(stale.length ? 1 : 0)
}
process.stdout.write(render(args[0], tokens))
