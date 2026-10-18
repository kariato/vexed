import type { Position } from '../domain'
export interface PointerStart { id: number; from: Position; x: number; y: number }
export function isDrag(start: PointerStart, x: number, y: number): boolean {
  return Math.hypot(x - start.x, y - start.y) >= 8
}
export function cellAt(x: number, y: number, rect: { left: number; top: number; width: number; height: number }): Position | null {
  if (rect.width <= 0 || rect.height <= 0 || x < rect.left || y < rect.top || x >= rect.left + rect.width || y >= rect.top + rect.height) return null
  return { x: Math.floor((x - rect.left) * 10 / rect.width), y: Math.floor((y - rect.top) * 8 / rect.height) }
}
