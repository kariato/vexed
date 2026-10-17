// SPDX-License-Identifier: GPL-2.0-or-later
// Source-informed: Palm game.c / vexed.c; see docs/compatibility/RULES.md.
import { boardRows, countBlocks, createBoard, isBlock, isInside, tileAt, validateBoard } from './board'
import { tryMoveOneCell } from './movement'
import { resolveBoard } from './resolve'
import type { EngineEvent, GameCommand, GameSession, GestureIntent, LevelDefinition, MoveRequest, RejectionReason, Snapshot, StepResult } from './types'
export const UNDO_LIMIT = 15
const snapshot = ({ board, moveCount, commands }: Snapshot): Snapshot => ({ board, moveCount, commands })
const reject = (state: GameSession, rejectionReason: RejectionReason): StepResult => ({ accepted: false, state, events: [], rejectionReason })
const status = (state: Snapshot): GameSession['status'] => countBlocks(state.board) ? 'playing' : 'won'
export function createSession(level: LevelDefinition): GameSession {
  if (validateBoard(level.initialBoard).length) throw new Error('Invalid initial board')
  if (!level.id || !level.packId || !Number.isInteger(level.index) || level.index < 0
    || (level.par !== null && (!Number.isInteger(level.par) || level.par < 0))) throw new Error('Invalid level metadata')
  const initialBoard = createBoard(boardRows(level.initialBoard))
  const ownedLevel = Object.freeze({ ...level, initialBoard })
  const state = { level: ownedLevel, board: initialBoard, moveCount: 0, commands: [], history: [], checkpoint: null }
  return { ...state, status: status(state) }
}
/** Logical request, including Palm's counted blocked attempt. UI uses applyGesture. */
function move(state: GameSession, request: MoveRequest, allowEmptyReference = false): StepResult {
  if (state.status === 'won') return reject(state, 'already-won')
  if (!isInside(request.from)) return reject(state, 'out-of-bounds')
  if (!isBlock(tileAt(state.board, request.from)) && !(allowEmptyReference && tileAt(state.board, request.from) === '.')) return reject(state, 'not-a-block')
  if ((request.direction !== -1 && request.direction !== 1) || !Number.isInteger(request.distance)
    || request.distance < 1 || request.distance > 9) return reject(state, 'invalid-move')
  let board = state.board, moveCount = state.moveCount
  const events: EngineEvent[] = []
  for (let step = 0; step < request.distance; step++) {
    const from = { x: request.from.x + step * request.direction, y: request.from.y }
    const slide = tryMoveOneCell(board, from, request.direction)
    moveCount++ // Palm increments even when an intermediate step hits an obstacle.
    if (slide) { board = slide.board; events.push({ type: 'block-moved', ...slide.motion }) }
    const resolved = resolveBoard(board)
    board = resolved.board
    events.push(...resolved.events)
    if (!slide || resolved.changed) break
  }
  const won = countBlocks(board) === 0
  if (won) events.push({ type: 'level-solved' })
  const command = Object.freeze({ from: Object.freeze({ ...request.from }), direction: request.direction, distance: request.distance })
  return { accepted: true, events, state: {
    ...state, board, moveCount, status: won ? 'won' : 'playing',
    history: [...state.history, snapshot(state)].slice(-UNDO_LIMIT), commands: [...state.commands, command],
  } }
}
/** Original solution playback only: one encoded pair may point at air.
 * Callers must pin/allowlist known legacy data; player commands remain strict.
 */
export function applyReferenceMove(state: GameSession, request: MoveRequest): StepResult {
  if (request.distance !== 1) return reject(state, 'invalid-move')
  return move(state, request, true)
}
export function applyGesture(state: GameSession, intent: GestureIntent): StepResult {
  if (!isInside(intent.from) || !isInside(intent.target)) return reject(state, 'out-of-bounds')
  if (intent.method !== 'drag' && intent.method !== 'tap') return reject(state, 'invalid-move')
  if (!isBlock(tileAt(state.board, intent.from))) return reject(state, 'not-a-block')
  if (tileAt(state.board, intent.target) !== '.') return reject(state, 'occupied')
  if (intent.method === 'drag' && intent.from.y !== intent.target.y) return reject(state, 'different-row')
  const dx = intent.target.x - intent.from.x
  if (!dx) return reject(state, 'same-column')
  return move(state, { from: intent.from, direction: dx < 0 ? -1 : 1, distance: Math.abs(dx) })
}
export function applyCommand(state: GameSession, command: GameCommand): StepResult {
  switch (command.type) {
    case 'move': return move(state, command)
    case 'memorize': return { accepted: true, state: { ...state, checkpoint: snapshot(state) }, events: [] }
    case 'restart': {
      const next = createSession(state.level)
      return { accepted: true, state: next, events: [{ type: 'board-restored', reason: 'restart', board: next.board }] }
    }
    case 'undo': {
      const previous = state.history.at(-1)
      if (!previous) return reject(state, 'no-history')
      return { accepted: true, state: { ...state, ...previous, status: status(previous), history: state.history.slice(0, -1) },
        events: [{ type: 'board-restored', reason: 'undo', board: previous.board }] }
    }
    case 'recall': {
      if (!state.checkpoint) return reject(state, 'no-checkpoint')
      const previous = state.checkpoint
      return { accepted: true, state: { ...state, ...previous, status: status(previous), history: [] },
        events: [{ type: 'board-restored', reason: 'recall', board: previous.board }] }
    }
  }
}
