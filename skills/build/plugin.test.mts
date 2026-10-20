import assert from 'node:assert/strict'
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { test } from 'node:test'

const root = resolve(import.meta.dirname, '../..')
const json = (path: string) => JSON.parse(readFileSync(resolve(root, path), 'utf8'))

test('P1-S1 Install: Codex marketplace packages the shared skills and helpers', () => {
  const marketplace = json('.agents/plugins/marketplace.json')
  const plugin = json('.codex-plugin/plugin.json')
  assert.equal(marketplace.name, 'pedrotypes')
  const entry = marketplace.plugins.find((p: {name: string}) => p.name === plugin.name)
  assert.deepEqual(entry.source, { source: 'local', path: './' })
  assert.equal(entry.policy.installation, 'AVAILABLE')
  assert.equal(plugin.skills, './skills/')
  assert.deepEqual(readdirSync(resolve(root, plugin.skills)).sort(), ['build', 'improve-architecture', 'retro', 'setup'])
  for (const name of ['build', 'improve-architecture', 'retro', 'setup']) {
    assert.ok(existsSync(resolve(root, plugin.skills, name, 'SKILL.md')))
  }
  assert.ok(existsSync(resolve(root, plugin.skills, 'build/review.sh')))
})

test('P1-S1 Install: Codex disables inherited Claude update hooks', () => {
  assert.deepEqual(json('.codex-plugin/plugin.json').hooks, { hooks: {} })
})
