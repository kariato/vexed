// SPDX-License-Identifier: GPL-2.0-or-later
import { applyCommand, createBoard, createSession } from '../domain'
import type { GameSession, MoveRequest, PackProgress, Snapshot } from '../domain'
import type { RuntimePack } from '../data/types'
export interface Preferences { theme: 'classic' | 'modern'; motion: 'normal' | 'fast' | 'off'; practice: boolean }
interface SavedSession { levelId: string; commands: readonly MoveRequest[]; history: number[]; checkpoint: readonly MoveRequest[] | null }
export interface SavedGame { schemaVersion: 1; rulesVersion: 1; packId: string; game: SavedSession; previous: SavedSession | null; progress: PackProgress; preferences: Preferences }
export interface RestoredGame { game: GameSession; previous: GameSession | null; progress: PackProgress; preferences: Preferences }
export function assertSaveBounds(value: SavedGame): void {
  for (const session of [value.game, value.previous]) if (session && (session.commands.length > 5000 || (session.checkpoint?.length ?? 0) > 5000)) throw new Error('Attempt exceeds restore limits')
  if (JSON.stringify(value).length > 2_000_000) throw new Error('Save exceeds size limit')
}
function serialize(game: GameSession): SavedSession {
  return { levelId: game.level.id, commands: game.commands, history: game.history.map(snapshot => snapshot.commands.length), checkpoint: game.checkpoint?.commands ?? null }
}
export function encodeSave(packId: string, game: GameSession, previous: GameSession | null, progress: PackProgress, preferences: Preferences): SavedGame {
  return { schemaVersion: 1, rulesVersion: 1, packId, game: serialize(game), previous: previous ? serialize(previous) : null, progress, preferences }
}
function commands(input: unknown): MoveRequest[] {
  if (!Array.isArray(input) || input.length > 5000) throw new Error('Invalid command log')
  return input.map(value => {
    const c = value as MoveRequest
    if (!c?.from || !Number.isInteger(c.from.x) || !Number.isInteger(c.from.y) || (c.direction !== -1 && c.direction !== 1) || !Number.isInteger(c.distance) || c.distance < 1 || c.distance > 9) throw new Error('Invalid saved move')
    return { from: { x: c.from.x, y: c.from.y }, direction: c.direction, distance: c.distance }
  })
}
function restoreSession(input: unknown, pack: RuntimePack): GameSession {
  const data = input as SavedSession
  const level = pack.levels.find(level => level.id === data?.levelId)
  if (!level || !Array.isArray(data.history) || data.history.length > 15) throw new Error('Invalid saved level')
  const moves = commands(data.commands)
  if (data.history.some((n, i) => !Number.isInteger(n) || n < 0 || n >= moves.length || (i > 0 && n <= data.history[i - 1]!))) throw new Error('Invalid undo history')
  const fresh = () => createSession({ id: level.id, packId: pack.id, index: level.index, par: level.par, initialBoard: createBoard(level.rows) })
  const play = (moves: readonly MoveRequest[], capture = false) => {
    let state = fresh(); const history: Snapshot[] = []
    for (const [i, move] of moves.entries()) {
      if (capture && data.history.includes(i)) history.push({ board: state.board, moveCount: state.moveCount, commands: state.commands })
      const result = applyCommand(state, { type: 'move', ...move })
      if (!result.accepted) throw new Error('Saved replay does not match rules')
      state = result.state
    }
    return { ...state, history }
  }
  const state = play(moves, true)
  const checkpoint = data.checkpoint === null ? null : play(commands(data.checkpoint))
  return { ...state, checkpoint: checkpoint ? { board: checkpoint.board, moveCount: checkpoint.moveCount, commands: checkpoint.commands } : null }
}
export function decodeSave(input: unknown, pack: RuntimePack): RestoredGame {
  const data = input as SavedGame
  if (!data || data.schemaVersion !== 1 || data.rulesVersion !== 1 || data.packId !== pack.id) throw new Error('Unsupported save version')
  const p = data.preferences
  if (!p || !['classic','modern'].includes(p.theme) || !['normal','fast','off'].includes(p.motion) || typeof p.practice !== 'boolean') throw new Error('Invalid preferences')
  const progress = data.progress
  if (!progress || !Number.isSafeInteger(progress.baseMade) || progress.baseMade < 0 || !Number.isSafeInteger(progress.basePar) || progress.basePar < 0 || !progress.completions || typeof progress.completions !== 'object' || Array.isArray(progress.completions)) throw new Error('Invalid scores')
  const completions: Record<number, { moves: number; par: number | null }> = {}
  for (const [key, value] of Object.entries(progress.completions)) {
    const level = pack.levels[Number(key)]
    if (!level || String(level.index) !== key || !value || !Number.isSafeInteger(value.moves) || value.moves < 1 || value.par !== level.par) throw new Error('Invalid completion')
    completions[level.index] = { moves: value.moves, par: level.par }
  }
  const game = restoreSession(data.game, pack)
  const unlocked = Math.max(0, ...Object.keys(completions).map(index => Number(index) + 1))
  if (!p.practice && game.level.index > unlocked) throw new Error('Invalid progression')
  return { game, previous: data.previous === null ? null : restoreSession(data.previous, pack), progress: { baseMade: progress.baseMade, basePar: progress.basePar, completions }, preferences: { ...p } }
}
