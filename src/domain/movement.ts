// SPDX-License-Identifier: GPL-2.0-or-later
import { isBlock, isInside, replaceTiles, tileAt } from './board'
import type { BlockMotion, Board, Direction, Position } from './types'
export interface BoardMove { readonly board: Board; readonly motion: BlockMotion }
/** No settling, history, gesture, or score semantics here. */
export function tryMoveOneCell(board: Board, from: Position, direction: Direction): BoardMove | null {
  if (!isInside(from) || (direction !== -1 && direction !== 1)) return null
  const kind = tileAt(board, from)
  const to = { x: from.x + direction, y: from.y }
  if (!isBlock(kind) || tileAt(board, to) !== '.') return null
  return { board: replaceTiles(board, [{ position: from, tile: '.' }, { position: to, tile: kind }]), motion: { from: { ...from }, to, kind } }
}
