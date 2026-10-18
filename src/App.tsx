import { useCallback, useEffect, useMemo, useState } from 'react'
import { applyCommand, applyGesture, calculatePackScore, createBoard, createSession, emptyProgress, isBlock, openSolution, recordCompletion, tileAt } from './domain'
import type { GameCommand, GameSession, MoveRequest, PackProgress, Position, StepResult } from './domain'
import { loadPack } from './data/packLoader'
import type { RuntimePack } from './data/types'
import { Board } from './ui/Board'
import { Animation } from './ui/Animation'
import { animationFrames } from './ui/presentation'
import type { VisualFrame } from './ui/presentation'
import { Replay } from './ui/ReplayViewer'
import { replayStates, validateSolutions } from './ui/replayData'
import { readSave, writeSave } from './storage/database'
import { decodeSave, encodeSave } from './storage/save'
import { Offline } from './ui/Offline'
import './App.css'
function session(pack: RuntimePack, index: number) {
  const level = pack.levels[index]!
  return createSession({ id: level.id, packId: pack.id, index, par: level.par, initialBoard: createBoard(level.rows) })
}
interface Viewer { title: string; states: readonly GameSession[] }
export default function App() {
  const [pack, setPack] = useState<RuntimePack | null>(null)
  const [game, setGame] = useState<GameSession | null>(null)
  const [error, setError] = useState(false)
  const [attempt, setAttempt] = useState(0)
  const [selected, setSelected] = useState<Position | null>(null)
  const [message, setMessage] = useState('Select a block or drag it sideways.')
  const [progress, setProgress] = useState<PackProgress>(emptyProgress)
  const [theme, setTheme] = useState<'classic' | 'modern'>('classic')
  const [motion, setMotion] = useState<'normal' | 'fast' | 'off'>('normal')
  const [practice, setPractice] = useState(false)
  const [frames, setFrames] = useState<VisualFrame[] | null>(null)
  const [viewer, setViewer] = useState<Viewer | null>(null)
  const [previous, setPrevious] = useState<GameSession | null>(null)
  const [loadingSolution, setLoadingSolution] = useState(false)
  const [savedPayload, setSavedPayload] = useState<ReturnType<typeof encodeSave> | null>(null)
  const [loaded, setLoaded] = useState(false)
  const [saveStatus, setSaveStatus] = useState('Loading saved progress…')
  const [storageOK, setStorageOK] = useState(true)
  const [recovery, setRecovery] = useState(false)
  const [epoch, setEpoch] = useState(0)
  const finishAnimation = useCallback(() => setFrames(null), [])
  const busy = frames !== null || loadingSolution || viewer !== null
  const unlocked = Math.min(58, Math.max(-1, ...Object.keys(progress.completions).map(Number)) + 1)
  const payload = useMemo(() => game && pack ? encodeSave(pack.id, game, previous, progress, { theme, motion, practice }) : null, [pack, game, previous, progress, theme, motion, practice])
  const saving = loaded && storageOK && !recovery && payload !== savedPayload
  useEffect(() => {
    let active = true
    loadPack('classic').then(async value => {
      let restored = null
      try {
        const saved = await readSave(import.meta.env.BASE_URL + 'classic')
        if (saved !== undefined) {
          try { restored = decodeSave(saved, value) }
          catch { if (active) { setRecovery(true); setSaveStatus('Saved data could not be read. It has been kept for recovery. Autosave is paused.') } }
        }
      } catch { if (active) { setStorageOK(false); setSaveStatus('Browser storage is unavailable. This game will last for this tab.') } }
      if (!active) return
      setPack(value); setGame(restored?.game ?? session(value, 0)); setError(false)
      if (restored) { setProgress(restored.progress); setPrevious(restored.previous); setTheme(restored.preferences.theme); setMotion(restored.preferences.motion); setPractice(restored.preferences.practice); setMessage('Your saved game is ready.') }
      setLoaded(true)
    }).catch(() => { if (active) setError(true) })
    return () => { active = false }
  }, [attempt])
  useEffect(() => {
    if (!loaded || !payload || !storageOK || recovery) return
    let active = true
    writeSave(import.meta.env.BASE_URL + 'classic', payload).then(() => { if (active) { setSavedPayload(payload); setSaveStatus('Saved on this device') } }).catch(() => { if (active) { setStorageOK(false); setSaveStatus('Could not save on this device. Keep this tab open to retain your progress.') } })
    return () => { active = false }
  }, [loaded, payload, storageOK, recovery])
  const accept = (result: StepResult, feedback?: string, interrupt = false) => {
    if (busy && !interrupt) return
    setSelected(null)
    if (!result.accepted) { setMessage('That move is blocked. Choose an empty destination in another column.'); return }
    setGame(result.state)
    if (game && motion !== 'off' && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      const next = animationFrames(game.board, result.events)
      if (next.length) setFrames(next)
    }
    if (result.state.status === 'won') {
      setProgress(value => recordCompletion(value, { index: result.state.level.index, moves: result.state.moveCount, par: result.state.level.par }))
      setMessage('Puzzle solved in ' + result.state.moveCount + ' moves!')
    } else setMessage(feedback ?? result.state.moveCount + (result.state.moveCount === 1 ? ' move. ' : ' moves. ') + 'Select a block or drag it sideways.')
  }
  const command = (value: GameCommand, feedback?: string) => {
    if (!game || viewer || loadingSolution) return
    if (value.type === 'undo') { setFrames(null); accept(applyCommand(game, value), feedback, true) }
    else if (!busy) accept(applyCommand(game, value), feedback)
  }
  const restart = () => {
    if (busy) return
    setSelected(null)
    if (game && (!game.moveCount || window.confirm('Restart this puzzle? Your current moves will be cleared.'))) command({ type: 'restart' })
  }
  const tap = (target: Position) => {
    if (!game || game.status === 'won' || busy) return
    if (isBlock(tileAt(game.board, target))) {
      const same = selected?.x === target.x && selected.y === target.y
      setSelected(same ? null : target)
      setMessage(same ? 'Selection cleared.' : 'Block selected. Tap an empty destination, even on another row, or use the arrow buttons.')
    } else if (selected) accept(applyGesture(game, { from: selected, target, method: 'tap' }))
  }
  const changeLevel = (index: number) => {
    if (busy || !pack || !game || index < 0 || index >= pack.levels.length || (!practice && index > unlocked)) return
    setSelected(null)
    if (game.status !== 'won' && game.moveCount > 0 && !window.confirm('Leave this puzzle? Your current moves will be cleared.')) return
    if (game.commands.length) setPrevious(game)
    setGame(session(pack, index)); setMessage('Select a block or drag it sideways.')
  }
  const replay = (source: GameSession) => {
    if (busy) return
    setSelected(null); setViewer({ title: 'Your replay · Level ' + (source.level.index + 1), states: replayStates(source.level, source.commands) })
  }
  const reveal = async () => {
    if (!game || !pack || busy) return
    setSelected(null); setLoadingSolution(true)
    try {
      const response = await fetch(import.meta.env.BASE_URL + 'packs/classic-solutions.json')
      if (!response.ok) throw new Error('Unavailable')
      const commands: readonly MoveRequest[] | undefined = validateSolutions(await response.json(), pack).get(game.level.id)
      if (!commands) throw new Error('Unavailable')
      const exempt = openSolution(progress, game.level.index, true, false)
      const opened = exempt.opened ? exempt : openSolution(progress, game.level.index, true, window.confirm('View the full solution? This adds 5 points to your pack score, even if you close it early.'))
      if (!opened.opened) return
      setProgress(opened.progress)
      setViewer({ title: 'Solution · Level ' + (game.level.index + 1), states: replayStates(game.level, commands) })
      setMessage(opened.penaltyApplied ? 'Solution viewed: +5 points. Your position is preserved.' : 'Solution viewing is free after clearing this level at or below par.')
    } catch { setMessage('The solution could not be loaded. No penalty was charged. Try again when connected.') }
    finally { setLoadingSolution(false) }
  }
  const changePractice = (enabled: boolean) => {
    if (!game || !pack) return
    const leaving = !enabled && game.level.index > unlocked
    if (leaving && game.moveCount > 0 && game.status !== 'won' && !window.confirm('Return to progression? Your current practice attempt will be cleared.')) return
    setPractice(enabled); setSelected(null); setFrames(null); setEpoch(value => value + 1)
    if (leaving) { if (game.commands.length) setPrevious(game); setGame(session(pack, unlocked)); setMessage('Select a block or drag it sideways.') }
  }
  const settingsChanged = () => { setFrames(null); setSelected(null); setEpoch(value => value + 1) }
  const score = game ? calculatePackScore(progress, { index: game.level.index, moves: game.moveCount, par: game.level.par }) : 0
  return <main className={'theme-' + theme}>
    <header><div><p className="eyebrow">THE PALM CLASSIC · REBUILT FOR TOUCH</p><h1>Vexed <span>Think sideways.</span></h1></div><p className="intro">Slide. Match. Clear the board.</p></header>
    {!game || !pack ? <section className="game"><h2>{error ? 'Could not load the Classic puzzles' : 'Loading Classic puzzles…'}</h2>{error && <><p>Check your connection, then try again.</p><button onClick={() => { setError(false); setAttempt(value => value + 1) }}>Retry</button></>}</section> : <>
      <section className="game" aria-label="Classic puzzle">
        <div className="game-heading"><div><p className="eyebrow">CLASSIC · {practice ? 'PRACTICE' : 'PROGRESSION'}</p><h2>Level {game.level.index + 1}</h2></div><label className="level-picker">Go to level<select aria-label="Go to level" disabled={busy} value={game.level.index} onChange={event => changeLevel(Number(event.target.value))}>{pack.levels.map(level => <option key={level.id} value={level.index} disabled={!practice && level.index > unlocked}>{level.index + 1}{progress.completions[level.index] ? ' ✓' : !practice && level.index > unlocked ? ' · locked' : ''}</option>)}</select></label></div>
        <dl className="stats"><div><dt>Moves</dt><dd>{game.moveCount}</dd></div><div><dt>Par</dt><dd>{game.level.par ?? '—'}</dd></div><div><dt>Score</dt><dd aria-label="Pack score">{score > 0 ? '+' : ''}{score}</dd></div><div><dt>Cleared</dt><dd>{Object.keys(progress.completions).length}<small> / 59</small></dd></div></dl>
        <div className="board-frame"><Board key={game.level.id + ':' + theme + ':' + motion + ':' + epoch + ':' + Boolean(viewer)} board={game.board} selected={selected} disabled={game.status === 'won' || busy} onTap={tap}
          overlay={frames ? <Animation frames={frames} speed={motion === 'fast' ? 2 : 1} done={finishAnimation}/> : undefined}
          onDrag={(from, target) => accept(applyGesture(game, { from, target, method: 'drag' }))} onCancel={() => setSelected(null)} onUndo={() => command({ type: 'undo' })} onRestart={restart}/></div>
        <p className={'feedback ' + (game.status === 'won' ? 'success' : '')} role="status" aria-live="polite">{loadingSolution ? 'Loading solution…' : frames ? 'Resolving blocks…' : message}</p>
        <div className="controls"><button className="secondary" onClick={() => command({ type: 'undo' })} disabled={Boolean(viewer) || loadingSolution || !game.history.length}>Undo</button><button className="secondary" onClick={restart} disabled={busy}>Restart</button>
          <div className="move-controls" aria-label="Move selected block"><button aria-label="Move selected block left" disabled={busy || !selected} onClick={() => selected && accept(applyGesture(game, { from: selected, target: { x: selected.x - 1, y: selected.y }, method: 'tap' }))}>←</button><button aria-label="Move selected block right" disabled={busy || !selected} onClick={() => selected && accept(applyGesture(game, { from: selected, target: { x: selected.x + 1, y: selected.y }, method: 'tap' }))}>→</button></div></div>
        {game.status === 'won' && <div className="completion">{game.level.index < pack.levels.length - 1 ? <button disabled={busy} onClick={() => changeLevel(game.level.index + 1)}>Next puzzle →</button> : <p>Final puzzle cleared. Choose a level to play again.</p>}</div>}
      </section>
      <aside><span className="guide-number" aria-hidden="true">01—59</span><h2>A little space.<br/>A lot to untangle.</h2>
        <div className="tools"><h3>Your toolkit</h3><div className="tool-buttons"><button className="secondary" disabled={busy} onClick={() => command({ type: 'memorize' }, 'Position memorized. Recall will restore this board and move count.')}>Memorize</button><button className="secondary" disabled={busy || !game.checkpoint} onClick={() => command({ type: 'recall' }, 'Memorized position recalled. Undo history cleared.')}>Recall</button><button className="secondary" disabled={busy || !game.commands.length} onClick={() => replay(game)}>Replay moves</button><button className="secondary" disabled={busy || !previous} onClick={() => previous && replay(previous)}>Replay previous</button><button className="secondary" disabled={busy} onClick={() => void reveal()}>View solution</button></div><p className="session-note">Best: {progress.completions[game.level.index]?.moves ?? '—'} moves · Unlocked through: {unlocked + 1}{practice ? ' · Practice enabled' : ''}</p></div>
        <details className="settings" onToggle={settingsChanged}><summary>Settings</summary><label>Appearance<select aria-label="Appearance" disabled={loadingSolution} value={theme} onChange={event => { setTheme(event.target.value as 'classic' | 'modern'); settingsChanged() }}><option value="classic">Classic Palm</option><option value="modern">Modern</option></select></label><label>Animations<select aria-label="Animations" disabled={loadingSolution} value={motion} onChange={event => { setMotion(event.target.value as 'normal' | 'fast' | 'off'); settingsChanged() }}><option value="normal">Normal</option><option value="fast">Fast</option><option value="off">Off</option></select></label><label className="check"><input type="checkbox" disabled={loadingSolution} checked={practice} onChange={event => changePractice(event.target.checked)}/>Practice: unlock all levels</label><p>Reduced-motion preferences automatically disable movement animation. Settings and progress are saved on this device when browser storage is available.</p></details>
        <details className="help"><summary>How to play & scoring</summary><p>Drag blocks sideways or tap a block, then an empty destination, even on a different row. Gravity pulls blocks down; matching edges disappear. Arrow buttons move selected blocks one space. Undo remembers 15 gestures.</p><p>Tab to the board. Arrows move the cursor; Enter/Space selects or commits, Escape clears, Z undoes and R restarts.</p><p>Lower pack scores are better. Best completed moves minus par are added across levels, with active excess moves and solution penalties following the audited Palm rules. Every confirmed solution viewing costs 5 points unless this level was already cleared at or below par. Replays are free.</p><p>Memorize stores one checkpoint; Recall restores its board and move count and clears undo history. Restart clears the checkpoint. Completing a puzzle unlocks the next; Practice opens all 59.</p></details>
        <div className="device-status"><p className="session-note" aria-live="polite">{saving ? 'Saving…' : saveStatus}</p>{recovery && <button className="secondary" onClick={() => { if (window.confirm('Replace the unreadable saved game with this attempt?')) setRecovery(false) }}>Start a new save</button>}{!storageOK && <button className="secondary" onClick={() => { setStorageOK(true); setSaveStatus('Retrying save…') }}>Retry saving</button>}<Offline canUpdate={!saving && saveStatus === 'Saved on this device' && !busy}/></div><p className="license">Original game: James McCombe and the Vexed project team.<br/>New CSS artwork and solution paths · GPL-2.0-or-later · <a href="https://github.com/kariato/vexed">Source & documentation</a></p>
      </aside>
      {viewer && <Replay states={viewer.states} title={viewer.title} close={() => setViewer(null)}/>}
    </>}
  </main>
}
