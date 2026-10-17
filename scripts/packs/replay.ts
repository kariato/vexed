// SPDX-License-Identifier: GPL-2.0-or-later
import { applyCommand, applyReferenceMove, boardRows, createBoard, createSession, decodeReferenceSolution, tileAt } from '../../src/domain'
import { sha256 } from './import'
import type { ReferencePack } from './import'
export interface ReplayFailure { levelId: string; step: number | null; reason: string }
export interface EmptyMoveException {
  levelId: string; step: number; from: { x: number; y: number }; direction: number
  sourceSha256: string[]; beforeBoardSha256: string; reason: string
}
export function replayPack(pack: ReferencePack, exceptions: readonly EmptyMoveException[] = []): {
  id: string; filename: string; levels: number; passed: number; steps: number
  sourceSha256: string; missingSolutions: number; failures: ReplayFailure[]; legacyEmptyMoves: { levelId: string; step: number }[]
} {
  let passed = 0, steps = 0, missingSolutions = 0
  const failures: ReplayFailure[] = []
  const legacyEmptyMoves: { levelId: string; step: number }[] = []
  for (const level of pack.levels) {
    if (level.encodedSolution === null) {
      missingSolutions++; failures.push({ levelId: level.id, step: null, reason: 'missing solution' }); continue
    }
    let step: number | null = null
    try {
      const commands = decodeReferenceSolution(level.encodedSolution)
      let state = createSession({ id: level.id, packId: pack.id, index: level.index, par: level.par, initialBoard: createBoard(level.rows) })
      for (const [index, command] of commands.entries()) {
        step = index
        let result = applyCommand(state, { type: 'move', ...command })
        if (!result.accepted && result.rejectionReason === 'not-a-block' && tileAt(state.board, command.from) === '.') {
          const known = exceptions.find(item => item.levelId === level.id && item.step === index
            && item.sourceSha256.includes(pack.source.sha256) && item.from.x === command.from.x
            && item.from.y === command.from.y && item.direction === command.direction
            && item.beforeBoardSha256 === sha256(JSON.stringify(boardRows(state.board))))
          if (known) {
            result = applyReferenceMove(state, command)
            if (result.accepted) legacyEmptyMoves.push({ levelId: level.id, step: index })
          }
        }
        if (!result.accepted) throw new Error(result.rejectionReason ?? 'rejected command')
        state = result.state; steps++
      }
      if (state.status !== 'won') throw new Error('reference solution does not solve board')
      if (state.moveCount !== level.par) throw new Error('counted moves differ from reference par')
      passed++
    } catch (error) { failures.push({ levelId: level.id, step, reason: String(error) }) }
  }
  return { id: pack.id, filename: pack.source.filename, sourceSha256: pack.source.sha256, levels: pack.levels.length, passed, steps, missingSolutions, failures, legacyEmptyMoves }
}
