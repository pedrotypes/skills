import assert from 'node:assert/strict'
import { execFileSync, spawnSync } from 'node:child_process'
import { chmodSync, existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'node:test'

const git = (cwd: string, ...args: string[]) => execFileSync('git', args, { cwd, encoding: 'utf8' }).trim()

// A worktree one commit ahead of main, with .build/ ignored, and a bin/ of stubs put first on PATH.
// The stubs answer with `result`, and the claude stub also runs `sideEffect` in the worktree.
function setup(result: unknown, sideEffect = '') {
  const dir = mkdtempSync(join(tmpdir(), 'rounds-'))
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
  // codex exec ... -o <file> -: write the result to <file>.
  writeFileSync(join(bin, 'codex'), `#!/usr/bin/env bash
while [ $# -gt 0 ]; do [ "$1" = -o ] && { cp "${join(dir, 'result.json')}" "$2"; }; shift; done
`)
  // claude -p ... --output-format json: print the wrapped structured output.
  writeFileSync(join(bin, 'claude'), `#!/usr/bin/env bash
cat > /dev/null
${sideEffect}
python3 -c 'import json,sys; print(json.dumps({"is_error": False, "total_cost_usd": 0, "structured_output": json.load(open(sys.argv[1]))}))' "${join(dir, 'result.json')}"
`)
  chmodSync(join(bin, 'codex'), 0o755); chmodSync(join(bin, 'claude'), 0o755)
  return { dir, wt, bin, brief: join(dir, 'brief.md'), out: join(wt, '.build', 'out') }
}

function run(script: 'codex.sh' | 'qa.sh', s: ReturnType<typeof setup>, round: number) {
  const args = script === 'codex.sh' ? ['review', s.wt, s.brief, s.out, String(round)] : [s.wt, s.brief, s.out, String(round)]
  return spawnSync('bash', [join(import.meta.dirname, script), ...args], {
    cwd: s.wt, encoding: 'utf8', env: { ...process.env, PATH: `${s.bin}:${process.env.PATH}` },
  })
}

const round = (n: number, findings: { id: string, severity: string }[] = []) => ({
  round: n, summary: `round ${n}`, previous: [],
  findings: findings.map((f) => ({ ...f, category: 'bug', file: 'app.txt', line: 1, title: 't', scenario: 's', fix: 'f' })),
})

for (const script of ['codex.sh', 'qa.sh'] as const) {
  test(`${script}: rounds 1 to 6 run, and round 7 is refused`, () => {
    for (const n of [1, 3, 6]) {
      const s = setup(round(n))
      const result = run(script, s, n)
      assert.equal(result.status, 0, result.stderr + result.stdout)
      assert.match(result.stdout, new RegExp(`^round ${n}: blockers=0 `, 'm'))
      assert.ok(existsSync(join(s.out, `round-${n}.json`)))
    }
    const s = setup(round(7))
    const result = run(script, s, 7)
    assert.notEqual(result.status, 0)
    assert.match(result.stderr, /six rounds/)
    assert.ok(!existsSync(join(s.out, 'round-7.json')))
  })

  test(`${script}: a finished round is never rerun`, () => {
    const s = setup(round(2, [{ id: 'X2-1', severity: 'P2' }]))
    assert.equal(run(script, s, 2).status, 0)
    const again = run(script, s, 2)
    assert.notEqual(again.status, 0)
    assert.match(again.stderr, /already done/)
  })

  test(`${script}: a dirty worktree is refused`, () => {
    const s = setup(round(1))
    writeFileSync(join(s.wt, 'app.txt'), 'uncommitted\n')
    const result = run(script, s, 1)
    assert.notEqual(result.status, 0)
    assert.match(result.stderr, /commit or discard/)
  })

  test(`${script}: P1 and P2 findings are counted as blockers`, () => {
    const s = setup(round(1, [{ id: 'X1-1', severity: 'P1' }, { id: 'X1-2', severity: 'P3' }]))
    const result = run(script, s, 1)
    assert.equal(result.status, 0, result.stderr)
    assert.match(result.stdout, /^round 1: blockers=1 .*; open: X1-1$/m)
  })
}

test('qa.sh: a QA round that changed tracked files is not published', () => {
  const s = setup(round(1), 'echo edited > app.txt')
  const result = run('qa.sh', s, 1)
  assert.notEqual(result.status, 0)
  assert.match(result.stderr, /changed tracked files/)
  assert.ok(!existsSync(join(s.out, 'round-1.json')))
})

test('qa.sh: files the QA writes under .build/ are allowed', () => {
  const s = setup(round(1), 'mkdir -p .build/qa && echo note > .build/qa/notes.txt')
  const result = run('qa.sh', s, 1)
  assert.equal(result.status, 0, result.stderr)
  assert.equal(readFileSync(join(s.wt, '.build/qa/notes.txt'), 'utf8'), 'note\n')
})
