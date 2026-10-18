// SPDX-License-Identifier: GPL-2.0-or-later
import type { MoveRequest } from './types'
export function decodeReferenceSolution(encoded: string): readonly MoveRequest[] {
  if (encoded.length % 2) throw new Error('Solution must contain coordinate pairs')
  const commands: MoveRequest[] = []
  for (let i = 0; i < encoded.length; i += 2) {
    const x = encoded[i]!, y = encoded[i + 1]!
    if (!/^[a-jA-J]$/.test(x) || !/^[a-hA-H]$/.test(y) || (x === x.toUpperCase()) === (y === y.toUpperCase())) throw new Error(`Invalid solution pair at ${i / 2}`)
    commands.push({ from: { x: x.toLowerCase().charCodeAt(0) - 97, y: y.toLowerCase().charCodeAt(0) - 97 }, direction: x === x.toUpperCase() ? -1 : 1, distance: 1 })
  }
  return commands
}
