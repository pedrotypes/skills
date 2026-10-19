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

// Writes the given files to a fresh review directory and runs the ledger on the current round.
function ledgerFiles(files: Record<string, unknown>, current: string) {
  const dir = mkdtempSync(join(tmpdir(), 'blockers-'))
  for (const [name, content] of Object.entries(files)) writeFileSync(join(dir, name), JSON.stringify(content))
  return spawnSync('python3', [join(import.meta.dirname, 'blockers.py'), dir, join(dir, current)], { encoding: 'utf8' })
}

test("a second reviewer's round-<n>.<who>.json counts with its round until a later round closes its blockers", () => {
  const one = ledgerFiles({
    'round-1.json': round(1, [{ id: 'R1-1', severity: 'P2' }]),
    'round-1.sonnet.json': round(1, [{ id: 'S1-1', severity: 'P1' }, { id: 'S1-2', severity: 'P2' }, { id: 'S1-3', severity: 'P3' }]),
  }, 'round-1.json')
  assert.equal(one.status, 0, one.stderr)
  assert.match(one.stdout, /^round 1: blockers=3 .*; open: R1-1 S1-1 S1-2$/m)
  const two = ledgerFiles({
    'round-1.json': round(1, [{ id: 'R1-1', severity: 'P2' }]),
    'round-1.sonnet.json': round(1, [{ id: 'S1-1', severity: 'P1' }, { id: 'S1-2', severity: 'P2' }]),
    'round-2.json': round(2, [], [{ id: 'S1-1', status: 'fixed' }, { id: 'R1-1', status: 'accepted' }]),
    'round-2.sonnet.json': round(2, [], [{ id: 'S1-2', status: 'not fixed' }]),
  }, 'round-2.sonnet.json')
  assert.equal(two.status, 0, two.stderr)
  assert.match(two.stdout, /^round 2: blockers=1 .*; open: S1-2$/m)
})

test('a blocker marked not fixed or partly in two rounds is reported as stuck', () => {
  const files = {
    'round-1.json': round(1, [{ id: 'R1-1', severity: 'P1' }, { id: 'R1-2', severity: 'P2' }]),
    'round-2.json': round(2, [], [{ id: 'R1-1', status: 'not fixed' }, { id: 'R1-2', status: 'partly' }]),
    'round-3.json': round(3, [], [{ id: 'R1-1', status: 'partly' }, { id: 'R1-2', status: 'fixed' }]),
  }
  const result = ledgerFiles(files, 'round-3.json')
  assert.equal(result.status, 0, result.stderr)
  assert.match(result.stdout, /^round 3: blockers=1 .*; open: R1-1; stuck: R1-1$/m)
  const early = ledgerFiles({ 'round-1.json': files['round-1.json'], 'round-2.json': files['round-2.json'] }, 'round-2.json')
  assert.doesNotMatch(early.stdout, /stuck/)
})

test('two passes marking a blocker not fixed in the same round count as one miss', () => {
  const result = ledgerFiles({
    'round-1.json': round(1, [{ id: 'Q1-1', severity: 'P2' }]),
    'round-2.json': round(2, [], [{ id: 'Q1-1', status: 'not fixed' }]),
    'round-2.ux.json': round(2, [], [{ id: 'Q1-1', status: 'partly' }]),
  }, 'round-2.ux.json')
  assert.equal(result.status, 0, result.stderr)
  assert.match(result.stdout, /^round 2: blockers=1 .*; open: Q1-1$/m)
})

test("a script's raw output and a round still in flight aren't read as reviewers", () => {
  const result = ledgerFiles({
    'round-1.json': round(1, []),
    'round-1.raw.json': { structured_output: {} },
    'round-1.pending.json': { half: 'written' },
  }, 'round-1.json')
  assert.equal(result.status, 0, result.stderr)
  assert.match(result.stdout, /^round 1: blockers=0 /m)
})
