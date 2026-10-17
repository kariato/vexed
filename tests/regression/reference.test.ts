import { describe, expect, it } from 'vitest'
import classic from '../fixtures/reference/classic.json'
import gestures from '../fixtures/reference/gestures.json'
import { applyCommand, boardRows, createBoard, createSession, decodeReferenceSolution } from '../../src/domain'
describe('frozen original-C reference transitions', () => {
  for (const fixture of classic) it(`${fixture.id}: every original solution step matches`, () => {
    let state = createSession({ id: fixture.id, packId: 'classic', index: Number(fixture.id.split(':')[1]), par: fixture.par, initialBoard: createBoard(fixture.initialRows) })
    const commands = decodeReferenceSolution(fixture.encodedSolution)
    expect(commands.length).toBe(fixture.par)
    for (const [i, command] of commands.entries()) {
      const original = fixture.commands[i]!
      expect(command).toEqual({ from: { x: original[0], y: original[1] }, direction: original[2] === 1 ? -1 : 1, distance: original[3] })
      const result = applyCommand(state, { type: 'move', ...command })
      expect(result.accepted).toBe(true)
      state = result.state
      const expected = fixture.expectedAfterEachMove[i]!
      expect(boardRows(state.board), `${fixture.id}, step ${i}`).toEqual(expected.rows)
      expect(state.moveCount).toBe(expected.moves)
      expect(state.status === 'won').toBe(expected.won)
    }
    expect(state.status).toBe('won')
  })
  for (const fixture of gestures) it(fixture.id, () => {
    const [x, y, direction, distance] = fixture.command as [number, number, number, number]
    const initial = createSession({ id: fixture.id, packId: 'reference', index: 0, par: null, initialBoard: createBoard(fixture.initialRows) })
    const result = applyCommand(initial, { type: 'move', from: { x, y }, direction: direction === 1 ? -1 : 1, distance })
    expect(boardRows(result.state.board)).toEqual(fixture.expected.rows)
    expect(result.state.moveCount).toBe(fixture.expected.moves)
    expect(result.state.status === 'won').toBe(fixture.expected.won)
    expect(boardRows(initial.board)).toEqual(fixture.initialRows)
  })
})
it.each(['a', 'ff', 'FF', 'kA', 'aI', '12', 'aF '])('rejects malformed reference solution %s', encoded => expect(() => decodeReferenceSolution(encoded)).toThrow())
it('decodes the documented fF example', () => expect(decodeReferenceSolution('fF')).toEqual([{ from: { x: 5, y: 5 }, direction: 1, distance: 1 }]))
