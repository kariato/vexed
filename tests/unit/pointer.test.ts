import { describe, expect, it } from 'vitest'
import { cellAt, isDrag } from '../../src/ui/pointer'
describe('responsive pointer coordinates', () => {
  const rect = { left: 12, top: 100, width: 600, height: 480 }
  it('maps tablet coordinates to cells without rounding at boundaries', () => {
    expect(cellAt(12, 100, rect)).toEqual({ x: 0, y: 0 })
    expect(cellAt(72, 160, rect)).toEqual({ x: 1, y: 1 })
    expect(cellAt(611.9, 579.9, rect)).toEqual({ x: 9, y: 7 })
  })
  it('rejects released pointers outside the board, including far edges', () => {
    for (const [x, y] of [[11, 100], [612, 100], [12, 580], [12, 99]]) expect(cellAt(x!, y!, rect)).toBeNull()
    expect(cellAt(12, 100, { ...rect, width: 0 })).toBeNull()
  })
  it('scales to narrow phone layouts and fractional CSS pixels', () => {
    expect(cellAt(165, 222.4, { left: 15, top: 100, width: 300, height: 240 })).toEqual({ x: 5, y: 4 })
  })
  it('distinguishes finger jitter from a gesture in either direction', () => {
    const start = { id: 1, from: { x: 2, y: 3 }, x: 100, y: 100 }
    expect(isDrag(start, 104, 104)).toBe(false)
    expect(isDrag(start, 108, 100)).toBe(true)
    expect(isDrag(start, 90, 102)).toBe(true)
  })
})
