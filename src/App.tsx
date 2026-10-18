import { useState } from 'react'
import { applyCommand, applyGesture, calculatePackScore, createBoard, createSession, emptyProgress, isBlock } from './domain'
import type { GameCommand, StepResult } from './domain'
import './App.css'
// Authored demonstration; original pack metadata is not shipped.
const level = {
  id: 'demo:0', packId: 'demo', index: 0, par: 1,
  initialBoard: createBoard(['##########', '#........#', '#........#', '#........#', '#........#', '#........#', '#a.a.....#', '##########']),
}
const initial = (): StepResult => ({ accepted: true, state: createSession(level), events: [] })
export default function App() {
  const [result, setResult] = useState(initial)
  const { state, events } = result
  const command = (cmd: GameCommand) => setResult(previous => applyCommand(previous.state, cmd))
  const step = () => setResult(previous => applyGesture(previous.state, { from: { x: 1, y: 6 }, target: { x: 2, y: 6 }, method: 'drag' }))
  const score = calculatePackScore(emptyProgress(), { index: 0, moves: state.moveCount, par: level.par })
  return <main>
    <header><p className="eyebrow">PALM PUZZLE · WEB ENGINE</p><h1>Vexed<span> / engine lab</span></h1>
      <p className="intro">The original rules, taking shape on the web.</p></header>
    <section className="game" aria-label="Engine demonstration">
      <div className="game-heading"><div><span className="eyebrow">AUTHORED DEMONSTRATION</span><h2>Level 1 · A matching pair</h2></div>
        <span className={'status ' + state.status}>{state.status === 'won' ? 'Solved' : 'Ready'}</span></div>
      <dl className="stats"><div><dt>Moves</dt><dd>{state.moveCount}</dd></div><div><dt>Par</dt><dd>{level.par}</dd></div><div><dt>Score</dt><dd>{score}</dd></div></dl>
      <div className="board" role="img" aria-label={'10 by 8 demo board. ' + (state.status === 'won' ? 'All blocks removed.' : 'Two matching A blocks on row 7, columns 2 and 4.')}>
        {state.board.cells.flatMap((row, y) => row.map((tile, x) => <div key={x + ':' + y} className={'tile ' + (tile === '#' ? 'wall' : isBlock(tile) ? 'block' : 'air')} aria-hidden="true">{isBlock(tile) ? tile.toUpperCase() : ''}</div>))}
      </div>
      <div className="controls"><button onClick={step} disabled={state.status === 'won'}>Run one move <span aria-hidden="true">→</span></button>
        <button className="secondary" onClick={() => command({ type: 'undo' })} disabled={!state.history.length}>Undo</button>
        <button className="secondary" onClick={() => command({ type: 'restart' })}>Reset</button></div>
      <p className="feedback" role="status">{state.status === 'won' ? 'The pair matched and disappeared. Undo restores the move.' : 'Slide A one space to the right. Matching blocks will disappear.'}</p>
    </section>
    <aside><h2>Phase 1 · Deterministic engine</h2><p>This preview exercises the same pure TypeScript rules tested against frozen Palm reference boards. Full puzzles, touchscreen dragging and offline play follow in later phases.</p>
      <details><summary>Last engine events ({events.length})</summary><pre>{events.length ? events.map(event => event.type).join('\n') : 'No events yet.'}</pre></details>
      <p className="license">Source-informed port of Palm Vexed · GPL-2.0-or-later<br/>Original game: James McCombe and the Vexed project team.</p></aside>
  </main>
}
