import assert from 'node:assert/strict'
import { execFileSync, spawnSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'node:test'

const git = (cwd: string, ...args: string[]) => execFileSync('git', args, { cwd, encoding: 'utf8' }).trim()

// A repo with one commit on `base`, then a feature branch one commit ahead.
function repo(base = 'main', manifest?: string) {
  const dir = mkdtempSync(join(tmpdir(), 'merge-base-'))
  git(dir, 'init', '-q', '-b', base)
  git(dir, '-c', 'user.name=t', '-c', 'user.email=t@t', 'commit', '-q', '--allow-empty', '-m', 'base')
  if (manifest !== undefined) {
    mkdirSync(join(dir, '.agents'))
    writeFileSync(join(dir, '.agents/project.md'), manifest)
  }
  const forkPoint = git(dir, 'rev-parse', 'HEAD')
  git(dir, 'switch', '-q', '-c', 'feat')
  git(dir, '-c', 'user.name=t', '-c', 'user.email=t@t', 'commit', '-q', '--allow-empty', '-m', 'feat')
  return { dir, forkPoint }
}

const mergeBase = (cwd: string) => spawnSync('bash', [join(import.meta.dirname, 'merge-base.sh')], { cwd, encoding: 'utf8' })

test('without a remote, the merge base is with the local base branch', () => {
  const { dir, forkPoint } = repo()
  const result = mergeBase(dir)
  assert.equal(result.status, 0, result.stderr)
  assert.equal(result.stdout.trim(), forkPoint)
})

test('the base branch comes from the manifest', () => {
  const { dir, forkPoint } = repo('trunk', '# Project manifest\n\n## Workflow\n\n- Base branch: trunk\n')
  assert.equal(mergeBase(dir).stdout.trim(), forkPoint)
})

test("with an origin, the merge base is with origin's base branch, not a stale local one", () => {
  const upstream = repo()
  const clone = mkdtempSync(join(tmpdir(), 'merge-base-clone-'))
  git(clone, 'clone', '-q', upstream.dir, '.')
  git(upstream.dir, 'switch', '-q', 'main')
  git(upstream.dir, '-c', 'user.name=t', '-c', 'user.email=t@t', 'commit', '-q', '--allow-empty', '-m', 'moved on')
  git(clone, 'fetch', '-q')
  git(clone, 'switch', '-q', '-c', 'mine', 'origin/main')
  git(clone, '-c', 'user.name=t', '-c', 'user.email=t@t', 'commit', '-q', '--allow-empty', '-m', 'mine')
  const result = mergeBase(clone)
  assert.equal(result.status, 0, result.stderr)
  assert.equal(result.stdout.trim(), git(upstream.dir, 'rev-parse', 'main'))
})
