import { describe, expect, it } from 'vitest'
import { applyCommand, applyGesture, boardRows, createBoard, createSession } from '../../src/domain'
import { animationFrames } from '../../src/ui/presentation'
import { replayStates, validateSolutions } from '../../src/ui/replayData'
const level = { id: 'classic:0', packId: 'classic', index: 0, par: 1, initialBoard: createBoard(['##########','#........#','#........#','#........#','#........#','#........#','#a.a.....#','##########']) }
describe('presentation projection and isolated replay', () => {
  it('keeps block identities through a slide and simultaneous removal', () => {
    const before = createSession(level)
    const result = applyGesture(before, { from: { x: 1, y: 6 }, target: { x: 2, y: 6 }, method: 'drag' })
    const frames = animationFrames(before.board, result.events)
    expect(frames[0]!.sprites.map(s => s.id)).toEqual([61, 63])
    expect(frames[1]!.sprites.find(s => s.id === 61)?.x).toBe(2)
    expect(frames.at(-1)!.sprites.every(s => s.removed)).toBe(true)
    expect(result.state.status).toBe('won')
    expect(before.moveCount).toBe(0)
  })
  it('projects simultaneous falls without confusing source and destination cells', () => {
    const board = createBoard(['##########','#a.......#','#a.......#','#........#','#........#','#........#','#........#','##########'])
    const frames = animationFrames(board, [{ type: 'blocks-fell', moves: [{ kind: 'a', from: { x: 1, y: 2 }, to: { x: 1, y: 3 } }, { kind: 'a', from: { x: 1, y: 1 }, to: { x: 1, y: 2 } }] }])
    expect(frames[1]!.sprites.map(s => [s.id, s.y])).toEqual([[11, 2], [21, 3]])
  })
  it('undo and checkpoint restoration bypass motion', () => {
    expect(animationFrames(level.initialBoard, [{ type: 'board-restored', reason: 'undo', board: level.initialBoard }])).toEqual([])
  })
  it('replays from initial position without changing player checkpoint or history', () => {
    let player = createSession(level)
    player = applyCommand(player, { type: 'memorize' }).state
    player = applyGesture(player, { from: { x: 1, y: 6 }, target: { x: 2, y: 6 }, method: 'tap' }).state
    const original = JSON.stringify(player)
    const states = replayStates(player.level, player.commands)
    expect(states[0]!.moveCount).toBe(0)
    expect(states.at(-1)!.status).toBe('won')
    expect(JSON.stringify(player)).toBe(original)
    expect(boardRows(applyCommand(player, { type: 'recall' }).state.board)).toEqual(boardRows(level.initialBoard))
  })
  it('rejects corrupt replay moves and unsupported solution schemas', () => {
    expect(() => replayStates(level, [{ from: { x: 0, y: 0 }, direction: 1, distance: 1 }])).toThrow()
    expect(() => validateSolutions(null, {} as never)).toThrow()
  })
})
