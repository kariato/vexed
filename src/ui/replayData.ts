// SPDX-License-Identifier: GPL-2.0-or-later
import { applyCommand, createBoard, createSession } from '../domain'
import type { GameSession, LevelDefinition, MoveRequest } from '../domain'
import type { RuntimePack } from '../data/types'
export function replayStates(level: LevelDefinition, commands: readonly MoveRequest[]): readonly GameSession[] {
  const states = [createSession(level)]
  for (const command of commands) {
    const result = applyCommand(states.at(-1)!, { type: 'move', ...command })
    if (!result.accepted) throw new Error('Invalid replay command')
    states.push(result.state)
  }
  return states
}
export function validateSolutions(input: unknown, pack: RuntimePack): ReadonlyMap<string, readonly MoveRequest[]> {
  const data = input as { schemaVersion?: unknown; rulesVersion?: unknown; packId?: unknown; levels?: unknown }
  if (!data || data.schemaVersion !== 1 || data.rulesVersion !== 1 || data.packId !== pack.id || !Array.isArray(data.levels) || data.levels.length !== pack.levels.length) throw new Error('Unsupported solution data')
  const solutions = new Map<string, readonly MoveRequest[]>()
  for (const item of data.levels as { levelId: string; commands: MoveRequest[] }[]) {
    const level = pack.levels.find(level => level.id === item?.levelId)
    if (!level || solutions.has(item.levelId) || !Array.isArray(item.commands) || item.commands.length > 1000) throw new Error('Invalid solution level')
    const commands = item.commands.map(command => {
      if (!command || !command.from || !Number.isInteger(command.from.x) || !Number.isInteger(command.from.y) || (command.direction !== -1 && command.direction !== 1) || command.distance !== 1) throw new Error('Invalid solution move')
      return { from: { x: command.from.x, y: command.from.y }, direction: command.direction, distance: command.distance }
    })
    const states = replayStates({ id: level.id, packId: pack.id, index: level.index, par: level.par, initialBoard: createBoard(level.rows) }, commands)
    if (states.at(-1)!.status !== 'won') throw new Error('Solution did not clear board')
    solutions.set(level.id, commands)
  }
  return solutions
}
