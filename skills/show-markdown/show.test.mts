import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { chmodSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { test } from 'node:test'

const script = resolve(import.meta.dirname, 'show.sh')

// A bin directory with a stub herdr that logs its calls and answers `pane list` from PANES.
function stubs({ glow = true as boolean | 'broken', mise = false, panes = [] as object[] } = {}) {
  const dir = mkdtempSync(join(tmpdir(), 'show-'))
  const log = join(dir, 'calls.log')
  writeFileSync(join(dir, 'panes.json'), JSON.stringify({ result: { panes } }))
  const herdr = `#!/bin/sh
echo "$*" >> "${log}"
case "$1 $2" in
  "pane list") cat "${dir}/panes.json" ;;
  "pane split") echo '{"result":{"pane":{"pane_id":"w1:p9"}}}' ;;
esac
`
  writeFileSync(join(dir, 'herdr'), herdr)
  chmodSync(join(dir, 'herdr'), 0o755)
  if (glow) {
    writeFileSync(join(dir, 'glow'), glow === 'broken' ? '#!/bin/sh\nexit 1\n' : '#!/bin/sh\n')
    chmodSync(join(dir, 'glow'), 0o755)
  }
  if (mise) {
    writeFileSync(join(dir, 'mise'), '#!/bin/sh\n')
    chmodSync(join(dir, 'mise'), 0o755)
  }
  const doc = join(dir, 'doc.md')
  writeFileSync(doc, '# Doc\n')
  return { dir, log, doc }
}

function run(args: string[], dir: string, env: Record<string, string> = {}) {
  return spawnSync('bash', [script, ...args], {
    encoding: 'utf8',
    env: { PATH: `${dir}:/usr/bin:/bin`, HERDR_ENV: '1', HERDR_PANE_ID: 'w1:p1', HERDR_TAB_ID: 'w1:t1', ...env },
  })
}

const calls = (log: string) => readFileSync(log, 'utf8').trim().split('\n')

test('opens a new glow pane to the right without taking focus', () => {
  const { dir, log, doc } = stubs()
  const result = run([doc], dir)
  assert.equal(result.status, 0, result.stderr)
  const lines = calls(log)
  assert.ok(lines.includes('pane split w1:p1 --direction right --no-focus --cwd ' + dir), lines.join('\n'))
  assert.ok(lines.includes('pane rename w1:p9 glow'))
  const runLine = lines.find((l) => l.startsWith('pane run w1:p9 '))
  assert.ok(runLine, lines.join('\n'))
  assert.match(runLine, /glow -p -w/)
  assert.ok(runLine.includes(`'${doc}'`))
})

test('reuses the glow pane already in this tab', () => {
  const { dir, log, doc } = stubs({ panes: [
    { pane_id: 'w1:p1', tab_id: 'w1:t1' },
    { pane_id: 'w1:p4', tab_id: 'w1:t2', label: 'glow' },
    { pane_id: 'w1:p5', tab_id: 'w1:t1', label: 'glow' },
  ] })
  const result = run([doc], dir)
  assert.equal(result.status, 0, result.stderr)
  const lines = calls(log)
  assert.ok(!lines.some((l) => l.startsWith('pane split')), lines.join('\n'))
  assert.ok(lines.includes('pane send-keys w1:p5 q ctrl+u'))
  assert.ok(lines.some((l) => l.startsWith('pane run w1:p5 ')))
})

test('resolves a relative path against the caller directory', () => {
  const { dir, log } = stubs()
  const result = spawnSync('bash', [script, 'doc.md'], {
    cwd: dir,
    encoding: 'utf8',
    env: { PATH: `${dir}:/usr/bin:/bin`, HERDR_ENV: '1', HERDR_PANE_ID: 'w1:p1', HERDR_TAB_ID: 'w1:t1' },
  })
  assert.equal(result.status, 0, result.stderr)
  assert.ok(calls(log).some((l) => l.includes(`'${join(dir, 'doc.md')}'`)))
})

test('falls back to mise when glow on PATH does not run (an unset mise shim)', () => {
  const { dir, log, doc } = stubs({ glow: 'broken', mise: true })
  const result = run([doc], dir)
  assert.equal(result.status, 0, result.stderr)
  assert.ok(calls(log).some((l) => l.startsWith('pane run w1:p9 ') && l.includes('mise x glow@latest -- glow -p')))
})

test('refuses outside Herdr', () => {
  const { dir, doc } = stubs()
  const result = run([doc], dir, { HERDR_ENV: '' })
  assert.equal(result.status, 1)
  assert.match(result.stderr, /not inside Herdr/)
})

test('refuses a missing file', () => {
  const { dir } = stubs()
  const result = run([join(dir, 'nope.md')], dir)
  assert.equal(result.status, 1)
  assert.match(result.stderr, /no such file/)
})

test('says how to install glow when neither glow nor mise is there', () => {
  const { dir, doc } = stubs({ glow: false })
  const result = run([doc], dir)
  assert.equal(result.status, 1)
  assert.match(result.stderr, /glow is not installed/)
})
