import assert from 'node:assert/strict'
import { execFileSync, spawnSync } from 'node:child_process'
import { chmodSync, existsSync, mkdirSync, mkdtempSync, readFileSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'node:test'

const git = (cwd: string, ...args: string[]) => execFileSync('git', args, { cwd, encoding: 'utf8' }).trim()
const commit = (cwd: string, msg: string) => git(cwd, '-c', 'user.name=t', '-c', 'user.email=t@t', 'commit', '-qam', msg)

const finding = (id: string, severity: string) =>
  ({ id, category: 'bug', severity, file: 'app.txt', line: 1, title: 'the title', scenario: 's', fix: 'f' })

// A worktree one commit ahead of main, with .build/ ignored, and stubs for claude and codex on a
// PATH holding only them and the tools the script needs. Each stub records its arguments and
// prompt and answers with its result; `sideEffect` runs in the worktree during the review.
function setup({ sonnet = 'P3', codex = 'P1' as string | null, sideEffect = '' } = {}) {
  const dir = mkdtempSync(join(tmpdir(), 'review-'))
  const wt = join(dir, 'wt'), bin = join(dir, 'bin')
  mkdirSync(wt); mkdirSync(bin)
  git(wt, 'init', '-q', '-b', 'main')
  writeFileSync(join(wt, '.gitignore'), '.build/\n')
  writeFileSync(join(wt, 'app.txt'), 'v1\n')
  git(wt, 'add', '.')
  commit(wt, 'base')
  git(wt, 'switch', '-q', '-c', 'feat')
  writeFileSync(join(wt, 'app.txt'), 'v2\n')
  commit(wt, 'feat')
  writeFileSync(join(dir, 'brief.md'), 'brief\n')
  writeFileSync(join(dir, 'sonnet.json'), JSON.stringify({ summary: 'sonnet summary', findings: [finding('S-1', sonnet)] }))
  writeFileSync(join(bin, 'claude'), `#!/usr/bin/env bash
echo "$@" > "${join(dir, 'claude-args.txt')}"
cat > "${join(dir, 'claude-prompt.txt')}"
${sideEffect}
python3 -c 'import json,sys; print(json.dumps({"is_error": False, "structured_output": json.load(open(sys.argv[1]))}))' "${join(dir, 'sonnet.json')}"
`)
  chmodSync(join(bin, 'claude'), 0o755)
  if (codex) {
    writeFileSync(join(dir, 'codex.json'), JSON.stringify({ summary: 'codex summary', findings: [finding('C-1', codex)] }))
    writeFileSync(join(bin, 'codex'), `#!/usr/bin/env bash
echo "$@" > "${join(dir, 'codex-args.txt')}"
cat > "${join(dir, 'codex-prompt.txt')}"
while [ $# -gt 0 ]; do [ "$1" = -o ] && cp "${join(dir, 'codex.json')}" "$2"; shift; done
`)
    chmodSync(join(bin, 'codex'), 0o755)
  }
  for (const tool of ['git', 'python3', 'timeout', 'bash', 'cat', 'sed', 'head', 'mkdir', 'rm', 'mv', 'tail', 'dirname', 'cp']) {
    const path = execFileSync('bash', ['-c', `command -v ${tool}`], { encoding: 'utf8' }).trim()
    if (!existsSync(join(bin, tool))) symlinkSync(path, join(bin, tool))
  }
  return { dir, wt, bin, brief: join(dir, 'brief.md'), out: join(wt, '.build', 'review') }
}

function run(s: ReturnType<typeof setup>, ...base: string[]) {
  return spawnSync(join(s.bin, 'bash'), [join(import.meta.dirname, 'review.sh'), s.wt, s.brief, s.out, ...base], {
    cwd: s.wt, encoding: 'utf8', env: { HOME: process.env.HOME, PATH: s.bin },
  })
}

test('review.sh: Sonnet and Codex review the same commit at medium effort, on review.md and the brief', () => {
  const s = setup()
  const r = run(s)
  assert.equal(r.status, 0, r.stderr + r.stdout)
  assert.match(readFileSync(join(s.dir, 'claude-args.txt'), 'utf8'), /--model claude-sonnet-5-5 --effort medium /)
  assert.match(readFileSync(join(s.dir, 'codex-args.txt'), 'utf8'), /-m gpt-6\.1-sol -c model_reasoning_effort=medium /)
  for (const [who, ids] of [['claude', 'S'], ['codex', 'C']]) {
    const sent = readFileSync(join(s.dir, `${who}-prompt.txt`), 'utf8')
    assert.ok(sent.startsWith('# Review'), `${who} gets review.md first`)
    assert.ok(sent.includes('brief\n'))
    assert.match(sent, new RegExp(`ids are \`${ids}-<n>\``))
  }
  assert.equal(JSON.parse(readFileSync(join(s.out, 'sonnet.json'), 'utf8')).findings[0].id, 'S-1')
  assert.equal(JSON.parse(readFileSync(join(s.out, 'codex.json'), 'utf8')).findings[0].id, 'C-1')
  assert.equal(readFileSync(join(s.out, 'review.sha'), 'utf8').trim(), git(s.wt, 'rev-parse', 'HEAD'))
  assert.equal(readFileSync(join(s.out, 'review.base'), 'utf8').trim(), git(s.wt, 'rev-parse', 'main'))
})

test('review.sh: prints every finding and counts only P1 and P2 as blockers', () => {
  const r = run(setup({ sonnet: 'P3', codex: 'P1' }))
  assert.equal(r.status, 0, r.stderr)
  assert.match(r.stdout, /^S-1 P3 bug app.txt:1 - the title$/m)
  assert.match(r.stdout, /^C-1 P1 bug app.txt:1 - the title$/m)
  assert.match(r.stdout, /^blockers=1$/m)
})

test('review.sh: without codex, Sonnet reviews alone', () => {
  const s = setup({ codex: null })
  const r = run(s)
  assert.equal(r.status, 0, r.stderr + r.stdout)
  assert.ok(existsSync(join(s.out, 'sonnet.json')))
  assert.ok(!existsSync(join(s.out, 'codex.json')))
  assert.match(r.stdout, /^blockers=0$/m)
})

test('review.sh: a slice is reviewed once', () => {
  const s = setup()
  assert.equal(run(s).status, 0)
  const again = run(s)
  assert.notEqual(again.status, 0)
  assert.match(again.stderr, /already reviewed/)
})

test('review.sh: a dirty worktree is refused', () => {
  const s = setup()
  writeFileSync(join(s.wt, 'app.txt'), 'uncommitted\n')
  const r = run(s)
  assert.notEqual(r.status, 0)
  assert.match(r.stderr, /commit or discard/)
})

test('review.sh: a review during which the worktree changed is not published', () => {
  const s = setup({ sideEffect: 'echo edited > app.txt' })
  const r = run(s)
  assert.notEqual(r.status, 0)
  assert.match(r.stderr, /worktree changed/)
  assert.ok(!existsSync(join(s.out, 'review.sha')))
})

test('review.sh: a slice is reviewed against the feature branch it folds into', () => {
  const s = setup()
  git(s.wt, 'switch', '-q', '-c', 'slice')
  writeFileSync(join(s.wt, 'app.txt'), 'v3\n')
  commit(s.wt, 'slice')
  const r = run(s, 'feat')
  assert.equal(r.status, 0, r.stderr + r.stdout)
  assert.equal(readFileSync(join(s.out, 'review.base'), 'utf8').trim(), git(s.wt, 'rev-parse', 'feat'))
})
