import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { chmodSync, existsSync, mkdirSync, mkdtempSync, readFileSync, utimesSync, writeFileSync } from 'node:fs'
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
  writeFileSync(join(bin, 'curl'), `#!/bin/sh\nprintf '%s\\n' "$*" >> "${dir}/calls"\n${fails ? 'exit 7' : `printf %s '${answer}'`}\n`)
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

test('a semantic install compares the published manifest version', () => {
  const c = check({ version: '3.0.0', answer: JSON.stringify({ version: '3.1.0' }) })
  const result = c.run()
  assert.equal(result.status, 0)
  assert.match(result.stdout, /installed 3\.0\.0, latest 3\.1\.0/)
  assert.match(result.stdout, /compare\/v3\.0\.0\.\.\.v3\.1\.0/)
  assert.match(readFileSync(join(c.dir, 'calls'), 'utf8'), /raw\.githubusercontent\.com\/pedrotypes\/skills\/main\/\.claude-plugin\/plugin\.json/)
  assert.equal(c.run().stdout, '')
})

for (const version of ['3.0.0', '2.9.9']) {
  test(`a semantic install is silent for published version ${version}`, () => {
    const result = check({ version: '3.0.0', answer: JSON.stringify({ version }) }).run()
    assert.equal(result.status, 0)
    assert.equal(result.stdout, '')
  })
}

for (const [installed, published] of [['3.9.0', '3.10.0'], ['3.0.9', '3.0.10'], ['9.0.0', '10.0.0']]) {
  test(`semantic versions compare numerically: ${installed} to ${published}`, () => {
    assert.match(check({ version: installed, answer: JSON.stringify({ version: published }) }).run().stdout, /update/)
    assert.equal(check({ version: published, answer: JSON.stringify({ version: installed }) }).run().stdout, '')
  })
}

for (const answer of ['invalid json', '{}', 'null', '{"version":3}', '{"version":"03.1.0"}', '{"version":"3.1.0-beta"}', '{"version":"v3.1.0"}']) {
  test(`a malformed published manifest is silent: ${answer}`, () => {
    const result = check({ version: '3.0.0', answer }).run()
    assert.equal(result.status, 0)
    assert.equal(result.stdout, '')
  })
}

test('a failed semantic manifest request is silent', () => {
  const result = check({ version: '3.0.0', fails: true }).run()
  assert.equal(result.status, 0)
  assert.equal(result.stdout, '')
})

for (const version of ['03.0.0', '3.0', '3.0.0-beta']) {
  test(`an unsupported installed version is never checked: ${version}`, () => {
    const c = check({ version })
    assert.equal(c.run().stdout, '')
    assert.equal(c.calls(), false)
  })
}
