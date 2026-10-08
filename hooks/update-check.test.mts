import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { chmodSync, existsSync, mkdirSync, mkdtempSync, utimesSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'node:test'

const installed = 'abcdef123456'
const latest = '0123456789abcdef0123456789abcdef01234567'

// Runs update-check.sh as Claude Code does, with a stub curl that answers `latest` (or fails) and logs each call.
function check({ answer = latest, version = installed, fails = false } = {}) {
  const dir = mkdtempSync(join(tmpdir(), 'update-check-'))
  const bin = join(dir, 'bin')
  mkdirSync(bin)
  writeFileSync(join(bin, 'curl'), `#!/bin/sh\necho call >> "${dir}/calls"\n${fails ? 'exit 7' : `printf %s '${answer}'`}\n`)
  chmodSync(join(bin, 'curl'), 0o755)
  const root = join(dir, 'cache', 'pedrotypes', 'skills', version)
  const data = join(dir, 'data')
  mkdirSync(root, { recursive: true })
  const run = () => spawnSync('bash', [join(import.meta.dirname, 'update-check.sh')], {
    encoding: 'utf8',
    env: { ...process.env, PATH: `${bin}:${process.env.PATH}`, CLAUDE_PLUGIN_ROOT: root, CLAUDE_PLUGIN_DATA: data },
  })
  return { dir, data, run, calls: () => existsSync(join(dir, 'calls')) }
}

test('a newer commit on GitHub tells the session to offer the update', () => {
  const result = check().run()
  assert.equal(result.status, 0)
  assert.match(result.stdout, /abcdef123456/)
  assert.match(result.stdout, /0123456789ab/)
  assert.match(result.stdout, /compare\/abcdef123456\.\.\.0123456789ab/)
  assert.match(result.stdout, /claude plugin marketplace update pedrotypes && claude plugin update skills@pedrotypes/)
  assert.match(result.stdout, /\/reload-plugins/)
})

test('an up-to-date install says nothing', () => {
  const result = check({ answer: `${installed}7890abcdef0123456789abcdef0123` }).run()
  assert.equal(result.status, 0)
  assert.equal(result.stdout, '')
})

test('it asks GitHub at most once a day', () => {
  const c = check()
  c.run()
  const second = c.run()
  assert.equal(second.stdout, '')
  const day = Date.now() / 1000 - 25 * 3600
  utimesSync(join(c.data, 'last-check'), day, day)
  assert.match(c.run().stdout, /update/)
})

test('a working copy, not a versioned install, is never checked', () => {
  const c = check({ version: 'skills' })
  assert.equal(c.run().stdout, '')
  assert.equal(c.calls(), false)
})

test('a failed request is silent and never blocks the session', () => {
  const result = check({ fails: true }).run()
  assert.equal(result.status, 0)
  assert.equal(result.stdout, '')
})
