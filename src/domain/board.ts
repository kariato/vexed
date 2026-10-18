// SPDX-License-Identifier: GPL-2.0-or-later
import type { Block, Board, Position, Tile } from './types'
export const WIDTH = 10
export const HEIGHT = 8
export const isBlock = (tile: unknown): tile is Block => typeof tile === 'string' && /^[a-h]$/.test(tile)
export const isInside = ({ x, y }: Position): boolean => Number.isInteger(x) && Number.isInteger(y)
  && x >= 0 && x < WIDTH && y >= 0 && y < HEIGHT
export function validateBoard(board: Board): readonly string[] {
  const issues: string[] = []
  if (board.width !== WIDTH || board.height !== HEIGHT || board.cells.length !== HEIGHT) issues.push('Board must be 10 × 8')
  for (const [y, row] of board.cells.entries()) {
    if (row.length !== WIDTH) issues.push(`Row ${y} must have 10 cells`)
    for (const [x, tile] of row.entries()) if (tile !== '.' && tile !== '#' && !isBlock(tile)) issues.push(`Invalid tile at ${x},${y}`)
  }
  return issues
}
export function createBoard(rows: readonly string[]): Board {
  const cells = rows.map(row => [...row] as Tile[])
  const board: Board = { width: WIDTH, height: HEIGHT, cells }
  const issues = validateBoard(board)
  if (issues.length) throw new Error(issues.join('; '))
  return Object.freeze({ ...board, cells: Object.freeze(cells.map(row => Object.freeze(row))) })
}
export const boardRows = (board: Board): readonly string[] => board.cells.map(row => row.join(''))
export const tileAt = (board: Board, { x, y }: Position): Tile | undefined => isInside({ x, y }) ? board.cells[y]?.[x] : undefined
export const countBlocks = (board: Board): number => board.cells.reduce((sum, row) => sum + row.filter(isBlock).length, 0)
/** Only used on dimension-checked boards with positions computed by engine loops. */
export function replaceTiles(board: Board, changes: readonly { position: Position; tile: Tile }[]): Board {
  const rows = board.cells.map(row => [...row])
  for (const { position: { x, y }, tile } of changes) {
    if (!isInside({ x, y })) throw new Error('Invalid engine cell write')
    rows[y]![x] = tile
  }
  return createBoard(rows.map(row => row.join('')))
}
