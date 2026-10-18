import assert from 'node:assert/strict'
import { execFileSync, spawnSync } from 'node:child_process'
import { chmodSync, existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'node:test'

const git = (cwd: string, ...args: string[]) => execFileSync('git', args, { cwd, encoding: 'utf8' }).trim()

// A worktree one commit ahead of main, with .build/ ignored, and a claude stub first on PATH that
// records its arguments and prompt, runs `sideEffect` in the worktree and answers with `result`.
function setup(result: unknown, sideEffect = '') {
  const dir = mkdtempSync(join(tmpdir(), 'pass-'))
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
  writeFileSync(join(bin, 'claude'), `#!/usr/bin/env bash
echo "$@" > "${join(dir, 'args.txt')}"
cat > "${join(dir, 'prompt.txt')}"
${sideEffect}
python3 -c 'import json,sys; print(json.dumps({"is_error": False, "total_cost_usd": 0, "structured_output": json.load(open(sys.argv[1]))}))' "${join(dir, 'result.json')}"
`)
  chmodSync(join(bin, 'claude'), 0o755)
  return { dir, wt, bin, brief: join(dir, 'brief.md'), out: join(wt, '.build', 'review') }
}

function run(s: ReturnType<typeof setup>, ...args: string[]) {
  const [kind, ...rest] = args
  return spawnSync('bash', [join(import.meta.dirname, 'pass.sh'), kind, s.wt, s.brief, s.out, ...rest], {
    cwd: s.wt, encoding: 'utf8', env: { ...process.env, PATH: `${s.bin}:${process.env.PATH}` },
  })
}

const result = (id: string, round = 0) => ({
  round, summary: 'summary', previous: [],
  findings: [{ id, category: 'bug', severity: 'P2', file: 'app.txt', line: 1, title: 'the title', scenario: 's', fix: 'f' }],
})

test('pass.sh cuts: Sonnet at medium effort on the cuts prompt writes cuts.json', () => {
  const s = setup(result('C-1'))
  const r = run(s, 'cuts')
  assert.equal(r.status, 0, r.stderr + r.stdout)
  assert.match(readFileSync(join(s.dir, 'args.txt'), 'utf8'), /--model claude-sonnet-5-5 --effort medium /)
  const sent = readFileSync(join(s.dir, 'prompt.txt'), 'utf8')
  assert.ok(sent.startsWith('# Code review'), 'review-rules.md comes first')
  assert.ok(sent.includes('## Cut it down'))
  assert.ok(sent.includes('brief\n'))
  assert.match(sent, /the cuts pass; ids are `C-<n>`/)
  assert.match(r.stdout, /^C-1 P2 bug app.txt:1 - the title$/m)
  assert.equal(JSON.parse(readFileSync(join(s.out, 'cuts.json'), 'utf8')).findings[0].id, 'C-1')
})

test('pass.sh review: Sonnet at high effort on the code review prompt writes the round beside Codex', () => {
  const s = setup(result('S2-1', 2))
  const r = run(s, 'review', '2')
  assert.equal(r.status, 0, r.stderr + r.stdout)
  assert.match(readFileSync(join(s.dir, 'args.txt'), 'utf8'), /--model claude-sonnet-5-5 --effort high /)
  const sent = readFileSync(join(s.dir, 'prompt.txt'), 'utf8')
  assert.ok(sent.includes('## Find what\'s wrong'))
  assert.match(sent, /Sonnet's review, round 2; ids are `S2-<n>`/)
  assert.equal(JSON.parse(readFileSync(join(s.out, 'round-2.sonnet.json'), 'utf8')).findings[0].id, 'S2-1')
  assert.match(r.stdout, /^round 2: blockers=1 .*; open: S2-1$/m)
})

test('pass.sh review: a round outside 1 to 6, or one already done, is refused', () => {
  const s = setup(result('S7-1', 7))
  const seven = run(s, 'review', '7')
  assert.notEqual(seven.status, 0)
  assert.match(seven.stderr, /six rounds/)
  const t = setup(result('S1-1', 1))
  assert.equal(run(t, 'review', '1').status, 0)
  const again = run(t, 'review', '1')
  assert.notEqual(again.status, 0)
  assert.match(again.stderr, /already done/)
})

test('pass.sh: an unknown pass is refused', () => {
  const s = setup(result('X-1'))
  const r = run(s, 'design')
  assert.notEqual(r.status, 0)
  assert.match(r.stderr, /cuts or review/)
})

test('pass.sh: a dirty worktree is refused', () => {
  const s = setup(result('X-1'))
  writeFileSync(join(s.wt, 'app.txt'), 'uncommitted\n')
  const r = run(s, 'cuts')
  assert.notEqual(r.status, 0)
  assert.match(r.stderr, /commit or discard/)
})

test('pass.sh: a pass that changed the worktree is not published', () => {
  const s = setup(result('S1-1', 1), 'echo edited > app.txt')
  const r = run(s, 'review', '1')
  assert.notEqual(r.status, 0)
  assert.match(r.stderr, /worktree changed/)
  assert.ok(!existsSync(join(s.out, 'round-1.sonnet.json')))
})

test('pass.sh review: records the commit it reviewed, for a repo without Codex', () => {
  const s = setup(result('S1-1', 1))
  assert.equal(run(s, 'review', '1').status, 0)
  assert.equal(readFileSync(join(s.out, 'round-1.sonnet.sha'), 'utf8').trim(), execFileSync('git', ['rev-parse', 'HEAD'], { cwd: s.wt, encoding: 'utf8' }).trim())
})
