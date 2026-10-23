import assert from 'node:assert/strict'
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { test } from 'node:test'

const root = resolve(import.meta.dirname, '../..')
const json = (path: string) => JSON.parse(readFileSync(resolve(root, path), 'utf8'))

test('P1-S1 Install: Codex marketplace packages the shared skills', () => {
  const marketplace = json('.agents/plugins/marketplace.json')
  const plugin = json('.codex-plugin/plugin.json')
  assert.equal(marketplace.name, 'pedrotypes')
  const entry = marketplace.plugins.find((p: {name: string}) => p.name === plugin.name)
  assert.deepEqual(entry.source, { source: 'local', path: './' })
  assert.equal(entry.policy.installation, 'AVAILABLE')
  assert.equal(plugin.skills, './skills/')
  assert.deepEqual(readdirSync(resolve(root, plugin.skills)).sort(), ['build', 'improve-architecture', 'retro', 'setup', 'show-markdown'])
  for (const name of ['build', 'improve-architecture', 'retro', 'setup', 'show-markdown']) {
    assert.ok(existsSync(resolve(root, plugin.skills, name, 'SKILL.md')))
  }
  assert.ok(existsSync(resolve(root, plugin.skills, 'build/review.md')))
})

test('P1-S1 Install: Codex disables inherited Claude update hooks', () => {
  assert.deepEqual(json('.codex-plugin/plugin.json').hooks, { hooks: {} })
})

test('Published plugins share a semantic release version', () => {
  const claude = json('.claude-plugin/plugin.json')
  const codex = json('.codex-plugin/plugin.json')
  const marketplace = json('.claude-plugin/marketplace.json')
  assert.match(claude.version ?? '', /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/)
  assert.equal(codex.version, claude.version)
  assert.equal(marketplace.plugins.find((p: {name: string}) => p.name === 'skills').version, claude.version)
})

test('Host installations do not use a shared skill linker', () => {
  assert.equal(existsSync(resolve(root, 'scripts/link.sh')), false)
})
