import { describe, expect, it } from 'vitest'
import fixtures from '../fixtures/reference/handlers.json'
import { applyCommand, applyGesture, boardRows, calculatePackScore, createBoard, createSession, emptyProgress, openSolution, recordCompletion } from '../../src/domain'
import type { ActiveScore, GameSession, PackProgress } from '../../src/domain'
const initialRows = [...Array<string>(6).fill('##########'), '#a.......#', '##########']
const fresh = (rows = initialRows) => createSession({ id: 'reference:0', packId: 'reference', index: 0, par: 0, initialBoard: createBoard(rows) })
function check(id: string, state: GameSession) {
  const expected = fixtures.find(f => f.id === id)!
  expect(expected).toBeDefined()
  expect(boardRows(state.board)).toEqual(expected.rows)
  expect(state.moveCount).toBe(expected.moves)
  expect(state.history.length).toBe(expected.undoCount)
  expect(state.commands.length).toBe(expected.replayCount)
}
const drag = (state: GameSession, fromX: number, toX: number) => applyGesture(state, { from: { x: fromX, y: 6 }, target: { x: toX, y: 6 }, method: 'drag' }).state
const score = (id: string, progress: PackProgress, active: ActiveScore) => {
  const fixture = fixtures.find(f => f.id === id)!
  expect(calculatePackScore(progress, active)).toBe(fixture.score)
  expect(progress.baseMade).toBe(fixture.baseMade)
}
describe('original Palm gesture and undo handler snapshots', () => {
  it('undo restores the whole three-step gesture and replay log', () => {
    const moved = drag(fresh(), 1, 4)
    check('drag-three-cells-one-undo', moved)
    const undone = applyCommand(moved, { type: 'undo' }).state
    check('undo-restores-entire-drag', undone)
    const emptyUndo = applyCommand(undone, { type: 'undo' })
    expect(emptyUndo.accepted).toBe(false)
    check('empty-undo-is-safe', emptyUndo.state)
  })
  it('retains precisely fifteen gesture snapshots', () => {
    let state = fresh()
    for (let i = 0; i < 16; i++) state = i % 2 ? drag(state, 2, 1) : drag(state, 1, 2)
    check('undo-ring-caps-at-fifteen', state)
    for (let i = 0; i < 15; i++) state = applyCommand(state, { type: 'undo' }).state
    check('undo-ring-restores-last-fifteen', state)
  })
  it('tap uses destination column across rows', () => {
    const rows = initialRows.map((r, y) => y === 5 ? '####.#####' : r)
    const result = applyGesture(fresh(rows), { from: { x: 1, y: 6 }, target: { x: 4, y: 5 }, method: 'tap' })
    check('cross-row-tap-uses-column', result.state)
  })
  it.each([
    ['same-column-tap-no-move', initialRows.map((r, y) => y === 5 ? '#.########' : r), 1, 5, 'tap'],
    ['occupied-tap-endpoint-rejected', [...initialRows.slice(0, 6), '#a..b....#', '##########'], 4, 6, 'tap'],
    ['cross-row-drag-rejected', initialRows.map((r, y) => y === 5 ? '####.#####' : r), 4, 5, 'drag'],
    ['wall-drag-endpoint-rejected', initialRows, 4, 7, 'drag'],
  ] as const)('%s', (id, rows, x, y, method) => {
    const initial = fresh([...rows])
    const result = applyGesture(initial, { from: { x: 1, y: 6 }, target: { x, y }, method })
    expect(result.accepted).toBe(false)
    expect(result.state).toBe(initial)
    check(id, result.state)
  })
  it('counts the intermediate blocked attempt when endpoint is empty', () => {
    const initial = fresh([...initialRows.slice(0, 6), '#ab......#', '##########'])
    check('empty-endpoint-behind-obstacle-counts-attempt', drag(initial, 1, 4))
  })
})
describe('original Palm score handler snapshots', () => {
  it('preserves active-level excess and completed negative scores', () => {
    let progress = emptyProgress()
    score('unsolved-active-excess-score', progress, { index: 0, moves: 7, par: 5 })
    score('unsolved-under-par-not-yet-negative', progress, { index: 0, moves: 3, par: 5 })
    progress = recordCompletion(progress, { index: 0, moves: 3, par: 5 })
    score('completed-under-par-negative-score', progress, { index: 1, moves: 0, par: 4 })
    progress = recordCompletion(emptyProgress(), { index: 0, moves: 7, par: 5 })
    score('active-completed-level-excess-counted-again', progress, { index: 0, moves: 7, par: 5 })
    score('active-better-attempt-keeps-completion-score', progress, { index: 0, moves: 3, par: 5 })
  })
  it.each([
    ['solution-repeated-openings-penalized', undefined, true, true, 2],
    ['solution-cancel-no-penalty', undefined, true, false, 1],
    ['missing-solution-no-penalty', undefined, false, true, 1],
    ['solution-at-par-exempt', 5, true, false, 1],
    ['solution-below-par-exempt', 4, true, false, 1],
    ['solution-above-par-penalized', 6, true, true, 1],
  ] as const)('%s', (id, previousMoves, available, confirmed, openings) => {
    let progress = emptyProgress(), opened = 0
    if (previousMoves !== undefined) progress = recordCompletion(progress, { index: 0, moves: previousMoves, par: 5 })
    const before = progress
    for (let i = 0; i < openings; i++) {
      const result = openSolution(progress, 0, available, confirmed)
      progress = result.progress
      if (result.opened) opened++
    }
    const fixture = fixtures.find(f => f.id === id)!
    expect(opened).toBe(fixture.solutionOpenings)
    score(id, progress, { index: 0, moves: 0, par: 0 })
    expect(before.baseMade).toBe(0)
  })
  it('retains the best completion, keeps penalties independent of undo/restart', () => {
    let progress = recordCompletion(emptyProgress(), { index: 0, moves: 4, par: 5 })
    progress = recordCompletion(progress, { index: 0, moves: 8, par: 5 })
    expect(progress.completions[0]?.moves).toBe(4)
    const penalized = openSolution(emptyProgress(), 0, true, true).progress
    let state = drag(fresh(), 1, 4)
    state = applyCommand(state, { type: 'undo' }).state
    state = applyCommand(state, { type: 'restart' }).state
    expect(calculatePackScore(penalized, { index: 0, moves: state.moveCount, par: 0 })).toBe(5)
  })
  it('treats unknown par as unavailable instead of minus one', () => {
    const progress = recordCompletion(emptyProgress(), { index: 0, moves: 2, par: null })
    expect(calculatePackScore(progress, { index: 0, moves: 4, par: null })).toBe(0)
    expect(openSolution(progress, 0, true, true).penaltyApplied).toBe(true)
  })
})
