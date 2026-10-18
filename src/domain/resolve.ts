// SPDX-License-Identifier: GPL-2.0-or-later
// Source-informed port: Palm Vexed game.c, James McCombe (1999), Vexed team (2006).
import { HEIGHT, WIDTH, isBlock, replaceTiles, tileAt } from './board'
import type { BlockAt, BlockMotion, Board, EngineEvent } from './types'
export function gravityPass(board: Board): { board: Board; moves: readonly BlockMotion[] } {
  let next = board
  const moves: BlockMotion[] = []
  for (let y = HEIGHT - 2; y >= 0; y--) for (let x = WIDTH - 1; x >= 0; x--) {
    const from = { x, y }, to = { x, y: y + 1 }, kind = tileAt(next, from)
    if (isBlock(kind) && tileAt(next, to) === '.') {
      next = replaceTiles(next, [{ position: from, tile: '.' }, { position: to, tile: kind }])
      moves.push({ from, to, kind })
    }
  }
  return { board: next, moves }
}
export function findMatches(board: Board): readonly BlockAt[] {
  const matches: BlockAt[] = []
  for (let y = 0; y < HEIGHT; y++) for (let x = 0; x < WIDTH; x++) {
    const kind = tileAt(board, { x, y })
    if (!isBlock(kind)) continue
    if ([{ x: x - 1, y }, { x: x + 1, y }, { x, y: y - 1 }, { x, y: y + 1 }].some(p => tileAt(board, p) === kind)) {
      matches.push({ position: { x, y }, kind })
    }
  }
  return matches
}
export function resolveBoard(board: Board): { board: Board; events: readonly EngineEvent[]; changed: boolean } {
  let next = board
  const events: EngineEvent[] = []
  // Each fall increases block y; each removal strictly decreases block count.
  // The bound exceeds every possible fall/removal wave on an 80-cell board.
  for (let wave = 0; wave < WIDTH * HEIGHT; wave++) {
    for (let pass = 0; pass < HEIGHT; pass++) {
      const result = gravityPass(next)
      next = result.board
      if (!result.moves.length) break
      events.push({ type: 'blocks-fell', moves: result.moves })
    }
    const blocks = findMatches(next)
    if (!blocks.length) return { board: next, events, changed: events.length > 0 }
    next = replaceTiles(next, blocks.map(({ position }) => ({ position, tile: '.' })))
    events.push({ type: 'blocks-removed', blocks })
  }
  throw new Error('Resolution exceeded the board convergence bound')
}
