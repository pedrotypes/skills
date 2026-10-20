import assert from 'node:assert/strict'
import { execFileSync, spawnSync } from 'node:child_process'
import { chmodSync, existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'node:test'

const git = (cwd: string, ...args: string[]) => execFileSync('git', args, { cwd, encoding: 'utf8' }).trim()

// A worktree one commit ahead of main, with .build/ ignored, and a codex stub first on PATH that
// records its arguments, runs `sideEffect` in the worktree and writes `result` to its -o file.
function setup(result: unknown, sideEffect = '') {
  const dir = mkdtempSync(join(tmpdir(), 'codex-'))
  const wt = join(dir, 'wt'), bin = join(dir, 'bin')
  mkdirSync(wt); mkdirSync(bin)
  git(wt, 'init', '-q', '-b', 'main')
  writeFileSync(join(wt, '.gitignore'), '.build/\n')
  writeFileSync(join(wt, 'app.txt'), 'v1\n')
  git(wt, 'add', '.')
  git(wt, '-c', 'user.name=t', '-c', 'user.email=t@t', 'commit', '-q', '-m', 'base')
  git(wt, 'switch', '-q', '-c', 'feat')
  writeFileSync(join(wt, 'app.txt'), 'v2\n')
  git(wt, '-c', 'user.name=t', '-c', 'user.email=t@t', 'commit', '-qam', 'feat')
  writeFileSync(join(dir, 'result.json'), JSON.stringify(result))
  writeFileSync(join(dir, 'brief.md'), 'brief\n')
  writeFileSync(join(bin, 'codex'), `#!/usr/bin/env bash
echo "$@" > "${join(dir, 'args.txt')}"
${sideEffect}
while [ $# -gt 0 ]; do [ "$1" = -o ] && { cp "${join(dir, 'result.json')}" "$2"; }; shift; done
`)
  chmodSync(join(bin, 'codex'), 0o755)
  return { dir, wt, bin, brief: join(dir, 'brief.md'), out: join(wt, '.build', 'review') }
}

function run(s: ReturnType<typeof setup>) {
  return spawnSync('bash', [join(import.meta.dirname, 'codex.sh'), 'review', s.wt, s.brief, s.out], {
    cwd: s.wt, encoding: 'utf8', env: { ...process.env, PATH: `${s.bin}:${process.env.PATH}` },
  })
}

const result = (severity = 'P1') => ({
  summary: 'summary',
  findings: [{ id: 'C-1', category: 'bug', severity, file: 'app.txt', line: 1, title: 'the title', scenario: 's', fix: 'f' }],
})

test('codex.sh review: gpt-6.1-sol at medium effort writes codex.json and the commits it read', () => {
  const s = setup(result())
  const r = run(s)
  assert.equal(r.status, 0, r.stderr + r.stdout)
  assert.match(readFileSync(join(s.dir, 'args.txt'), 'utf8'), /-m gpt-6\.1-sol -c model_reasoning_effort=medium /)
  const sent = readFileSync(join(s.out, 'codex.prompt.md'), 'utf8')
  assert.ok(sent.startsWith('# Review'))
  assert.match(sent, /Codex's review; ids are `C-<n>`/)
  assert.match(r.stdout, /^C-1 P1 bug app.txt:1 - the title$/m)
  assert.match(r.stdout, /^codex: blockers=1$/m)
  assert.equal(JSON.parse(readFileSync(join(s.out, 'codex.json'), 'utf8')).findings[0].id, 'C-1')
  assert.equal(readFileSync(join(s.out, 'codex.sha'), 'utf8').trim(), git(s.wt, 'rev-parse', 'HEAD'))
  assert.equal(readFileSync(join(s.out, 'codex.base'), 'utf8').trim(), git(s.wt, 'rev-parse', 'main'))
})

test('codex.sh review: only P1 and P2 count as blockers', () => {
  const r = run(setup(result('P3')))
  assert.equal(r.status, 0, r.stderr)
  assert.match(r.stdout, /^codex: blockers=0$/m)
})

test('codex.sh review: a slice is reviewed once', () => {
  const s = setup(result())
  assert.equal(run(s).status, 0)
  const again = run(s)
  assert.notEqual(again.status, 0)
  assert.match(again.stderr, /already reviewed/)
})

test('codex.sh review: a dirty worktree is refused', () => {
  const s = setup(result())
  writeFileSync(join(s.wt, 'app.txt'), 'uncommitted\n')
  const r = run(s)
  assert.notEqual(r.status, 0)
  assert.match(r.stderr, /commit or discard/)
})

test('codex.sh review: a review whose HEAD moved is not published', () => {
  const s = setup(result(), 'git -c user.name=t -c user.email=t@t commit -q --allow-empty -m moved')
  const r = run(s)
  assert.notEqual(r.status, 0)
  assert.match(r.stderr, /HEAD moved/)
  assert.ok(!existsSync(join(s.out, 'codex.json')))
})
