import { describe, expect, it } from 'vitest'
import { applyCommand, applyGesture, boardRows, countBlocks, createBoard, createSession, findMatches, gravityPass, resolveBoard, tryMoveOneCell } from '../../src/domain'
import type { GameCommand } from '../../src/domain'
const rows = ['##########', '#........#', '#........#', '#........#', '#........#', '#........#', '#a.......#', '##########']
const session = () => createSession({ id: 'test:0', packId: 'test', index: 0, par: 5, initialBoard: createBoard(rows) })
describe('board validation and immutable atomic movement', () => {
  it('rejects wrong geometry and invalid symbols', () => {
    expect(() => createBoard(['#'])).toThrow()
    expect(() => createBoard(rows.map((r, i) => i === 2 ? '#x.......#' : r))).toThrow()
  })
  it('moves without changing or settling its input', () => {
    const board = createBoard(rows)
    expect(Object.isFrozen(board.cells[0])).toBe(true)
    const next = tryMoveOneCell(board, { x: 1, y: 6 }, 1)!
    expect(boardRows(board)).toEqual(rows)
    expect(boardRows(next.board)[6]).toBe('#.a......#')
    expect(tryMoveOneCell(board, { x: 1, y: 6 }, -1)).toBeNull()
    expect(tryMoveOneCell(board, { x: 1.5, y: 6 }, 1)).toBeNull()
    expect(tryMoveOneCell(board, { x: 0, y: 0 }, 1)).toBeNull()
  })
})
describe('gravity and matching order', () => {
  it('moves stacked blocks one row in a pass while preserving order', () => {
    const board = createBoard(['##########', '#.a......#', '#.b......#', '#........#', '#........#', '#........#', '#........#', '##########'])
    const next = gravityPass(board)
    expect(next.moves.map(m => m.kind)).toEqual(['b', 'a'])
    expect(boardRows(next.board).slice(1, 4)).toEqual(['#........#', '#.a......#', '#.b......#'])
    const stable = resolveBoard(board).board
    expect(boardRows(stable).slice(5, 7)).toEqual(['#.a......#', '#.b......#'])
  })
  it('respects suspended walls and separate chambers', () => {
    const board = createBoard(['##########', '#a.......#', '#........#', '##.......#', '#b.......#', '#........#', '#........#', '##########'])
    expect(boardRows(resolveBoard(board).board)).toEqual(['##########', '#........#', '#a.......#', '##.......#', '#........#', '#........#', '#b.......#', '##########'])
  })
  it('marks all orthogonal groups including triples, never diagonals or walls', () => {
    const board = createBoard(['##########', '#aa......#', '#a.b.....#', '#...b....#', '#........#', '#........#', '#cc......#', '##########'])
    expect(findMatches(board).map(m => m.kind)).toEqual(['a', 'a', 'a', 'c', 'c'])
  })
  it('fully falls before testing transient side contact', () => {
    const board = createBoard(['##########', '#a.......#', '#........#', '#.a......#', '#.#......#', '#........#', '#........#', '##########'])
    const result = resolveBoard(board)
    expect(countBlocks(result.board)).toBe(2)
    expect(result.events.every(e => e.type === 'blocks-fell')).toBe(true)
  })
  it('removes simultaneous groups and continues through a cascade', () => {
    const board = createBoard(['##########', '#........#', '#........#', '#........#', '#........#', '#ab......#', '#ba......#', '#bb......#'])
    const result = resolveBoard(board)
    // Bottom pair disappears, then matching blocks meet after falling.
    expect(result.events.filter(e => e.type === 'blocks-removed').length).toBeGreaterThanOrEqual(2)
    expect(result.events[0]?.type).toBe('blocks-removed')
    expect(countBlocks(result.board)).toBeLessThan(countBlocks(board))
  })
})
describe('commands and recovery', () => {
  it.each([
    { type: 'move', from: { x: -1, y: 6 }, direction: 1, distance: 1 },
    { type: 'move', from: { x: NaN, y: 6 }, direction: 1, distance: 1 },
    { type: 'move', from: { x: 1, y: 6 }, direction: 1, distance: 0 },
    { type: 'move', from: { x: 1, y: 6 }, direction: 1, distance: 10 },
    { type: 'move', from: { x: 1, y: 6 }, direction: 0, distance: 1 },
    { type: 'move', from: { x: 0, y: 0 }, direction: 1, distance: 1 },
  ])('rejects malformed movement without changes: %j', command => {
    const initial = session(), result = applyCommand(initial, command as GameCommand)
    expect(result.accepted).toBe(false)
    expect(result.state).toBe(initial)
    expect(result.events).toEqual([])
  })
  it('restores checkpoints with matching command log and clears later undo history', () => {
    let state = applyCommand(session(), { type: 'memorize' }).state
    state = applyGesture(state, { from: { x: 1, y: 6 }, target: { x: 4, y: 6 }, method: 'drag' }).state
    const recalled = applyCommand(state, { type: 'recall' }).state
    expect(boardRows(recalled.board)).toEqual(rows)
    expect(recalled.moveCount).toBe(0)
    expect(recalled.commands).toEqual([])
    expect(recalled.history).toEqual([])
    expect(state.moveCount).toBe(3)
    const restarted = applyCommand(state, { type: 'restart' }).state
    expect(restarted.checkpoint).toBeNull()
    expect(restarted.history).toEqual([])
    expect(boardRows(restarted.board)).toEqual(rows)
  })
  it('reports completion once and supports undo after a win', () => {
    const initial = createSession({ ...session().level, initialBoard: createBoard([...rows.slice(0, 6), '#a.a.....#', '##########']) })
    const win = applyGesture(initial, { from: { x: 1, y: 6 }, target: { x: 2, y: 6 }, method: 'drag' })
    expect(win.state.status).toBe('won')
    expect(win.events.map(e => e.type)).toEqual(['block-moved', 'blocks-removed', 'level-solved'])
    expect(applyCommand(win.state, { type: 'move', from: { x: 2, y: 6 }, direction: 1, distance: 1 }).rejectionReason).toBe('already-won')
    expect(applyCommand(win.state, { type: 'undo' }).state.status).toBe('playing')
    expect(initial.moveCount).toBe(0)
  })
  it('accepts an already empty level as won without resolving the initial board', () => {
    const empty = createSession({ ...session().level, initialBoard: createBoard(Array<string>(8).fill('##########')) })
    expect(empty.status).toBe('won')
  })
  it('rejects recall without a checkpoint', () => expect(applyCommand(session(), { type: 'recall' }).rejectionReason).toBe('no-checkpoint'))
})
it('records a canonical move independent of whether it came from a gesture or a command', () => {
  const a = applyCommand(session(), { type: 'move', from: { x: 1, y: 6 }, direction: 1, distance: 3 }).state
  const b = applyGesture(session(), { from: { x: 1, y: 6 }, target: { x: 4, y: 6 }, method: 'drag' }).state
  expect(a).toEqual(b)
  const from = { x: 1, y: 6 }
  const result = applyCommand(session(), { type: 'move', from, direction: 1, distance: 1 }).state
  from.x = 8
  expect(result.commands[0]?.from).toEqual({ x: 1, y: 6 })
})
