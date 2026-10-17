import { useEffect, useState } from 'react'
import { applyCommand, applyGesture, createBoard, createSession, isBlock, tileAt } from './domain'
import type { GameCommand, GameSession, Position, StepResult } from './domain'
import { loadPack } from './data/packLoader'
import type { RuntimePack } from './data/types'
import { Board } from './ui/Board'
import './App.css'
function session(pack: RuntimePack, index: number) {
  const level = pack.levels[index]!
  return createSession({ id: level.id, packId: pack.id, index, par: level.par, initialBoard: createBoard(level.rows) })
}
export default function App() {
  const [pack, setPack] = useState<RuntimePack | null>(null)
  const [game, setGame] = useState<GameSession | null>(null)
  const [error, setError] = useState(false)
  const [attempt, setAttempt] = useState(0)
  const [selected, setSelected] = useState<Position | null>(null)
  const [message, setMessage] = useState('Select a block or drag it sideways.')
  const [solved, setSolved] = useState<Set<number>>(new Set())
  useEffect(() => {
    let active = true
    loadPack('classic').then(value => { if (active) { setPack(value); setGame(session(value, 0)); setError(false) } }).catch(() => { if (active) setError(true) })
    return () => { active = false }
  }, [attempt])
  const accept = (result: StepResult) => {
    setSelected(null)
    if (!result.accepted) { setMessage('That move is blocked. Choose an empty destination in another column.'); return }
    setGame(result.state)
    if (result.state.status === 'won') {
      setSolved(previous => new Set(previous).add(result.state.level.index))
      setMessage('Puzzle solved in ' + result.state.moveCount + ' moves!')
    } else setMessage(result.state.moveCount + (result.state.moveCount === 1 ? ' move. ' : ' moves. ') + 'Select a block or drag it sideways.')
  }
  const command = (value: GameCommand) => { if (game) accept(applyCommand(game, value)) }
  const restart = () => {
    setSelected(null)
    if (game && (!game.moveCount || window.confirm('Restart this puzzle? Your current moves will be cleared.'))) command({ type: 'restart' })
  }
  const tap = (target: Position) => {
    if (!game || game.status === 'won') return
    if (isBlock(tileAt(game.board, target))) {
      const same = selected?.x === target.x && selected.y === target.y
      setSelected(same ? null : target)
      setMessage(same ? 'Selection cleared.' : 'Block selected. Tap an empty destination, even on another row, or use the arrow buttons.')
    } else if (selected) accept(applyGesture(game, { from: selected, target, method: 'tap' }))
  }
  const changeLevel = (index: number) => {
    setSelected(null)
    if (!pack || !game || (game.status !== 'won' && game.moveCount > 0 && !window.confirm('Leave this puzzle? Your current moves will be cleared.'))) return
    setGame(session(pack, index)); setMessage('Select a block or drag it sideways.')
  }
  return <main>
    <header><div><p className="eyebrow">THE PALM CLASSIC · REBUILT FOR TOUCH</p><h1>Vexed <span>Think sideways.</span></h1></div><p className="intro">Slide. Match. Clear the board.</p></header>
    {!game || !pack ? <section className="game"><h2>{error ? 'Could not load the Classic puzzles' : 'Loading Classic puzzles…'}</h2>{error && <><p>Check your connection, then try again.</p><button onClick={() => { setError(false); setAttempt(value => value + 1) }}>Retry</button></>}</section> : <>
      <section className="game" aria-label="Classic puzzle">
        <div className="game-heading"><div><p className="eyebrow">CLASSIC · 59 ORIGINAL PUZZLES</p><h2>Level {game.level.index + 1}</h2></div><label className="level-picker">Go to level<select aria-label="Go to level" value={game.level.index} onChange={event => changeLevel(Number(event.target.value))}>{pack.levels.map(level => <option key={level.id} value={level.index}>{level.index + 1}{solved.has(level.index) ? ' ✓' : ''}</option>)}</select></label></div>
        <dl className="stats"><div><dt>Moves</dt><dd>{game.moveCount}</dd></div><div><dt>Par</dt><dd>{game.level.par ?? '—'}</dd></div><div><dt>Cleared</dt><dd>{solved.size}<small> / 59</small></dd></div></dl>
        <div className="board-frame"><Board key={game.level.id} board={game.board} selected={selected} disabled={game.status === 'won'} onTap={tap}
          onDrag={(from, target) => accept(applyGesture(game, { from, target, method: 'drag' }))} onCancel={() => setSelected(null)} onUndo={() => command({ type: 'undo' })} onRestart={restart}/></div>
        <p className={'feedback ' + (game.status === 'won' ? 'success' : '')} role="status" aria-live="polite">{message}</p>
        <div className="controls"><button className="secondary" onClick={() => command({ type: 'undo' })} disabled={!game.history.length}>Undo</button><button className="secondary" onClick={restart}>Restart</button>
          <div className="move-controls" aria-label="Move selected block"><button aria-label="Move selected block left" disabled={!selected} onClick={() => selected && accept(applyGesture(game, { from: selected, target: { x: selected.x - 1, y: selected.y }, method: 'tap' }))}>←</button><button aria-label="Move selected block right" disabled={!selected} onClick={() => selected && accept(applyGesture(game, { from: selected, target: { x: selected.x + 1, y: selected.y }, method: 'tap' }))}>→</button></div></div>
        {game.status === 'won' && <div className="completion">{game.level.index < pack.levels.length - 1 ? <button onClick={() => changeLevel(game.level.index + 1)}>Next puzzle →</button> : <p>Final puzzle cleared. Choose any level to play again.</p>}</div>}
      </section>
      <aside><span className="guide-number" aria-hidden="true">01—59</span><h2>A little space.<br/>A lot to untangle.</h2><p>Move blocks sideways into empty space. Gravity pulls them down. Matching blocks disappear when their edges touch.</p><div className="guide"><h3>Make your move</h3><p><strong>Drag</strong> a block left or right. A slide stops when blocks fall or a match clears.</p><p><strong>Tap</strong> a block, then an empty destination. Its column sets the direction and distance; the row can differ.</p><p><strong>Arrow buttons</strong> move a selected block one space. Undo remembers your last 15 gestures.</p></div><details><summary>Keyboard controls</summary><p>Tab to the board. Arrow keys move the cursor; Enter or Space selects a block or destination. Escape clears selection. Z undoes; R restarts.</p></details><p className="session-note">Play any level. Progress lasts for this tab. Refreshing starts fresh.</p><p className="license">Original game: James McCombe and the Vexed project team.<br/>GPL-2.0-or-later · <a href="https://github.com/kariato/vexed">Source & documentation</a></p></aside>
    </>}
  </main>
}
