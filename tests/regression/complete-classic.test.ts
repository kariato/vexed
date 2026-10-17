import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { applyCommand, applyReferenceMove, boardRows, createBoard, createSession, decodeReferenceSolution } from '../../src/domain'
import { importPack } from '../../scripts/packs/import'
import { replayPack } from '../../scripts/packs/replay'
import type { EmptyMoveException } from '../../scripts/packs/replay'
import { root } from '../../scripts/packs/pipeline'
import { validatePack } from '../../src/data/validatePack'
import originalEmpty from '../fixtures/reference/classic-ii-empty-move.json'

const source = importPack(readFileSync(resolve(root, 'tests/fixtures/source/packs/Classic Levels.ini')), 'Classic Levels.ini')
const runtime = validatePack(JSON.parse(readFileSync(resolve(root, 'public/packs/classic.json'), 'utf8')))
describe('all 59 original Classic solutions against the generated runtime boards', () => {
  for (const level of source.levels) it(level.id, () => {
    const data = runtime.levels[level.index]!
    expect(data.rows).toEqual(level.rows)
    expect(data.par).toBe(level.par)
    let state = createSession({ id: data.id, packId: runtime.id, index: data.index, par: data.par, initialBoard: createBoard(data.rows) })
    for (const command of decodeReferenceSolution(level.encodedSolution!)) {
      const result = applyCommand(state, { type: 'move', ...command })
      expect(result.accepted).toBe(true)
      state = result.state
    }
    expect(state.status).toBe('won')
    expect(state.moveCount).toBe(level.par)
  })
})
it('matches every original-C transition including Classic II empty-origin pair Hg', () => {
  let state = createSession({ id: originalEmpty.id, packId: 'classic-ii', index: 20, par: originalEmpty.par, initialBoard: createBoard(originalEmpty.initialRows) })
  for (const [i, request] of decodeReferenceSolution(originalEmpty.encodedSolution).entries()) {
    if (i === originalEmpty.emptyMoveIndex) {
      const rejected = applyCommand(state, { type: 'move', ...request })
      expect(rejected.rejectionReason).toBe('not-a-block')
      expect(rejected.state).toBe(state)
    }
    const result = applyReferenceMove(state, request)
    expect(result.accepted).toBe(true)
    state = result.state
    const expected = originalEmpty.expectedAfterEachMove[i]!
    expect(boardRows(state.board)).toEqual(expected.rows)
    expect(state.moveCount).toBe(expected.moves)
    expect(state.status === 'won').toBe(expected.won)
  }
  expect(state.status).toBe('won')
})
it('never broadly forgives corrupt reference moves and reports missing solutions', () => {
  const bad = structuredClone(source)
  bad.levels[0]!.encodedSolution = 'aA'
  bad.levels[1]!.encodedSolution = null
  const report = replayPack(bad)
  expect(report.failures.map(f => f.levelId)).toEqual(['classic:0', 'classic:1'])
  expect(report.missingSolutions).toBe(1)
  expect(report.passed).toBe(57)
})
it('requires exact source and board pins for the legacy empty-move exception', () => {
  const pack = importPack(readFileSync(resolve(root, 'tests/fixtures/source/packs/Classic II Levels.pdb')), 'Classic II Levels.pdb')
  const exceptions = (JSON.parse(readFileSync(resolve(root, 'docs/compatibility/source-variants.json'), 'utf8')) as { replayExceptions: EmptyMoveException[] }).replayExceptions
  expect(replayPack(pack).failures).toHaveLength(1)
  const wrong = exceptions.map(item => ({ ...item, beforeBoardSha256: '0'.repeat(64) }))
  expect(replayPack(pack, wrong).failures).toHaveLength(1)
  const report = replayPack(pack, exceptions)
  expect(report.failures).toEqual([])
  expect(report.legacyEmptyMoves).toEqual([{ levelId: 'classic-ii:20', step: 36 }])
})
it('limits reference-only empty commands to one step and still rejects walls', () => {
  const state = createSession({ id: source.levels[0]!.id, packId: source.id, index: 0, par: 4, initialBoard: createBoard(source.levels[0]!.rows) })
  expect(applyReferenceMove(state, { from: { x: 5, y: 2 }, direction: 1, distance: 2 }).rejectionReason).toBe('invalid-move')
  expect(applyReferenceMove(state, { from: { x: 0, y: 0 }, direction: 1, distance: 1 }).rejectionReason).toBe('not-a-block')
})
