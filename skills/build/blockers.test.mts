import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'node:test'

// Runs blockers.py the way codex.sh review does, over round files written to a fresh directory.
function ledger(rounds: Record<number, unknown>, current = Math.max(...Object.keys(rounds).map(Number))) {
  const dir = mkdtempSync(join(tmpdir(), 'blockers-'))
  for (const [n, round] of Object.entries(rounds)) {
    writeFileSync(join(dir, `round-${n}.json`), typeof round === 'string' ? round : JSON.stringify(round))
  }
  return spawnSync('python3', [join(import.meta.dirname, 'blockers.py'), dir, join(dir, `round-${current}.json`)], { encoding: 'utf8' })
}

const round = (n: number, findings: { id: string, severity: string }[], previous: { id: string, status: string }[] = []) =>
  ({ round: n, summary: `round ${n}`, findings, previous })

test('P1 and P2 findings are counted as blockers', () => {
  const result = ledger({ 1: round(1, [{ id: 'R1-1', severity: 'P1' }, { id: 'R1-2', severity: 'P2' }, { id: 'R1-3', severity: 'P3' }]) })
  assert.equal(result.status, 0)
  assert.match(result.stdout, /^round 1: blockers=2 .*; open: R1-1 R1-2$/m)
})

test('only P3 and P4 findings give zero blockers', () => {
  const result = ledger({ 1: round(1, [{ id: 'R1-1', severity: 'P3' }, { id: 'R1-2', severity: 'P4' }]) })
  assert.equal(result.status, 0)
  assert.match(result.stdout, /^round 1: blockers=0 /m)
})

test('an empty findings list gives zero blockers', () => {
  const result = ledger({ 1: round(1, []) })
  assert.equal(result.status, 0)
  assert.match(result.stdout, /^round 1: blockers=0 /m)
})

test('a blocker stays open until a later round marks it fixed or accepted, and partly reopens it', () => {
  const result = ledger({
    1: round(1, [{ id: 'R1-1', severity: 'P1' }, { id: 'R1-2', severity: 'P2' }, { id: 'R1-3', severity: 'P2' }]),
    2: round(2, [{ id: 'R2-1', severity: 'P2' }], [{ id: 'R1-1', status: 'fixed' }, { id: 'R1-2', status: 'partly' }]),
  })
  assert.equal(result.status, 0)
  assert.match(result.stdout, /^round 2: blockers=3 .*; open: R1-2 R1-3 R2-1$/m)
})

test('a malformed round fails instead of counting zero blockers', () => {
  const malformed: [string, unknown][] = [
    ['unknown severity', round(1, [{ id: 'R1-1', severity: 'P0' }])],
    ['findings not a list', { round: 1, summary: 's', findings: {}, previous: [] }],
    ['unknown status', round(1, [], [{ id: 'R0-1', status: 'done' }])],
    ['not JSON', '{'],
  ]
  for (const [name, bad] of malformed) {
    const result = ledger({ 1: bad })
    assert.notEqual(result.status, 0, name)
    assert.doesNotMatch(result.stdout, /blockers=0/, name)
  }
  const earlier = ledger({ 1: round(1, [{ id: 'R1-1', severity: 'P0' }]), 2: round(2, []) })
  assert.notEqual(earlier.status, 0, 'a malformed earlier round')
})

test('a missing round file fails instead of counting zero blockers', () => {
  const result = ledger({ 1: round(1, []) }, 2)
  assert.notEqual(result.status, 0)
  assert.doesNotMatch(result.stdout, /blockers=0/)
})
