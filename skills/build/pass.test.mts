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

function run(s: ReturnType<typeof setup>) {
  return spawnSync('bash', [join(import.meta.dirname, 'pass.sh'), s.wt, s.brief, s.out], {
    cwd: s.wt, encoding: 'utf8', env: { ...process.env, PATH: `${s.bin}:${process.env.PATH}` },
  })
}

const result = (id: string, severity = 'P2') => ({
  summary: 'summary',
  findings: [{ id, category: 'bug', severity, file: 'app.txt', line: 1, title: 'the title', scenario: 's', fix: 'f' }],
})

test('pass.sh: Sonnet at medium effort on the review prompt writes sonnet.json and the commit it read', () => {
  const s = setup(result('S-1'))
  const r = run(s)
  assert.equal(r.status, 0, r.stderr + r.stdout)
  assert.match(readFileSync(join(s.dir, 'args.txt'), 'utf8'), /--model claude-sonnet-5-5 --effort medium /)
  const sent = readFileSync(join(s.dir, 'prompt.txt'), 'utf8')
  assert.ok(sent.startsWith('# Review'), 'review.md is the prompt')
  assert.ok(sent.includes('brief\n'))
  assert.match(sent, /Sonnet's review; ids are `S-<n>`/)
  assert.match(r.stdout, /^S-1 P2 bug app.txt:1 - the title$/m)
  assert.match(r.stdout, /^sonnet: blockers=1$/m)
  assert.equal(JSON.parse(readFileSync(join(s.out, 'sonnet.json'), 'utf8')).findings[0].id, 'S-1')
  assert.equal(readFileSync(join(s.out, 'sonnet.sha'), 'utf8').trim(), git(s.wt, 'rev-parse', 'HEAD'))
})

test('pass.sh: only P1 and P2 count as blockers', () => {
  const r = run(setup(result('S-1', 'P3')))
  assert.equal(r.status, 0, r.stderr)
  assert.match(r.stdout, /^sonnet: blockers=0$/m)
})

test('pass.sh: a slice is reviewed once', () => {
  const s = setup(result('S-1'))
  assert.equal(run(s).status, 0)
  const again = run(s)
  assert.notEqual(again.status, 0)
  assert.match(again.stderr, /already reviewed/)
})

test('pass.sh: a dirty worktree is refused', () => {
  const s = setup(result('S-1'))
  writeFileSync(join(s.wt, 'app.txt'), 'uncommitted\n')
  const r = run(s)
  assert.notEqual(r.status, 0)
  assert.match(r.stderr, /commit or discard/)
})

test('pass.sh: a pass that changed the worktree is not published', () => {
  const s = setup(result('S-1'), 'echo edited > app.txt')
  const r = run(s)
  assert.notEqual(r.status, 0)
  assert.match(r.stderr, /worktree changed/)
  assert.ok(!existsSync(join(s.out, 'sonnet.json')))
})
