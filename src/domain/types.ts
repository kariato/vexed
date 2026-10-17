// SPDX-License-Identifier: GPL-2.0-or-later
export type Block = 'a' | 'b' | 'c' | 'd' | 'e' | 'f' | 'g' | 'h'
export type Tile = '.' | '#' | Block
export type Direction = -1 | 1
export interface Position { readonly x: number; readonly y: number }
export interface Board {
  readonly width: 10
  readonly height: 8
  readonly cells: readonly (readonly Tile[])[]
}
export interface LevelDefinition {
  readonly id: string
  readonly packId: string
  readonly index: number
  readonly initialBoard: Board
  readonly par: number | null
}
export interface MoveRequest {
  readonly from: Position
  readonly direction: Direction
  readonly distance: number
}
export interface Snapshot {
  readonly board: Board
  readonly moveCount: number
  readonly commands: readonly MoveRequest[]
}
export interface GameSession extends Snapshot {
  readonly level: LevelDefinition
  readonly status: 'playing' | 'won'
  readonly history: readonly Snapshot[]
  readonly checkpoint: Snapshot | null
}
export interface GestureIntent {
  readonly from: Position
  readonly target: Position
  readonly method: 'drag' | 'tap'
}
export interface BlockAt { readonly position: Position; readonly kind: Block }
export interface BlockMotion { readonly from: Position; readonly to: Position; readonly kind: Block }
export type EngineEvent =
  | ({ readonly type: 'block-moved' } & BlockMotion)
  | { readonly type: 'blocks-fell'; readonly moves: readonly BlockMotion[] }
  | { readonly type: 'blocks-removed'; readonly blocks: readonly BlockAt[] }
  | { readonly type: 'level-solved' }
  | { readonly type: 'board-restored'; readonly reason: 'undo' | 'restart' | 'recall'; readonly board: Board }
export type GameCommand =
  | ({ readonly type: 'move' } & MoveRequest)
  | { readonly type: 'undo' | 'restart' | 'memorize' | 'recall' }
export type RejectionReason = 'out-of-bounds' | 'not-a-block' | 'invalid-move' | 'occupied'
  | 'different-row' | 'same-column' | 'already-won' | 'no-history' | 'no-checkpoint'
export interface StepResult {
  readonly accepted: boolean
  readonly state: GameSession
  readonly events: readonly EngineEvent[]
  readonly rejectionReason?: RejectionReason
}
