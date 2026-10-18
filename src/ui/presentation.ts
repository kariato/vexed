// SPDX-License-Identifier: GPL-2.0-or-later
import { isBlock } from '../domain'
import type { Board, Block, EngineEvent } from '../domain'
export interface Sprite { id: number; x: number; y: number; kind: Block; removed: boolean }
export interface VisualFrame { sprites: readonly Sprite[]; duration: number }
export function animationFrames(board: Board, events: readonly EngineEvent[]): VisualFrame[] {
  let sprites: Sprite[] = []
  board.cells.forEach((row, y) => row.forEach((kind, x) => { if (isBlock(kind)) sprites.push({ id: y * 10 + x, x, y, kind, removed: false }) }))
  const frames: VisualFrame[] = [{ sprites, duration: 30 }]
  for (const event of events) {
    sprites = sprites.filter(sprite => !sprite.removed)
    if (event.type === 'board-restored') return []
    if (event.type === 'level-solved') continue
    if (event.type === 'blocks-removed') sprites = sprites.map(sprite => ({ ...sprite, removed: event.blocks.some(block => block.position.x === sprite.x && block.position.y === sprite.y) }))
    else {
      const motions = event.type === 'block-moved' ? [event] : event.moves
      sprites = sprites.map(sprite => {
        const motion = motions.find(move => move.from.x === sprite.x && move.from.y === sprite.y && move.kind === sprite.kind)
        return motion ? { ...sprite, x: motion.to.x, y: motion.to.y } : sprite
      })
    }
    frames.push({ sprites, duration: event.type === 'blocks-removed' ? 120 : event.type === 'block-moved' ? 120 : 70 })
  }
  return frames.length > 1 ? frames : []
}
