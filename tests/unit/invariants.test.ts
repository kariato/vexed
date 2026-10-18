import { expect, it } from 'vitest'
import { applyCommand, boardRows, countBlocks, createBoard, createSession, isBlock } from '../../src/domain'
it('preserves walls and block inventory through deterministic generated move sequences', () => {
  let seed = 170026
  const random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 2 ** 32 }
  for (let sample = 0; sample < 30; sample++) {
    const rows = Array.from({ length: 8 }, (_, y) => Array.from({ length: 10 }, (_, x) => {
      if (x === 0 || x === 9 || y === 0 || y === 7) return '#'
      const r = random()
      return r < 0.2 ? '#' : r < 0.55 ? 'abc'[Math.floor(random() * 3)]! : '.'
    }).join(''))
    let state = createSession({ id: `generated:${sample}`, packId: 'generated', index: sample, par: null, initialBoard: createBoard(rows) })
    for (let step = 0; step < 10 && state.status !== 'won'; step++) {
      const before = state
      const command = { type: 'move', from: { x: 1 + Math.floor(random() * 8), y: 1 + Math.floor(random() * 6) }, direction: random() < 0.5 ? -1 : 1, distance: 1 } as const
      const a = applyCommand(before, command), b = applyCommand(before, command)
      expect(a).toEqual(b)
      state = a.state
      expect(countBlocks(state.board)).toBeLessThanOrEqual(countBlocks(before.board))
      for (const kind of 'abc') {
        const count = (values: readonly string[]) => values.join('').split(kind).length - 1
        expect(count(boardRows(state.board))).toBeLessThanOrEqual(count(boardRows(before.board)))
      }
      for (let y = 0; y < 8; y++) for (let x = 0; x < 10; x++) {
        expect(state.board.cells[y]![x] === '#').toBe(rows[y]![x] === '#')
        expect(isBlock(state.board.cells[y]![x]) || '.#'.includes(state.board.cells[y]![x]!)).toBe(true)
      }
      expect(boardRows(before.board)).toEqual(boardRows(b.accepted ? applyCommand(b.state, { type: 'undo' }).state.board : b.state.board))
    }
  }
})
