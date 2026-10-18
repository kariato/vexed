import { useEffect, useRef, useState } from 'react'
import type { GameSession } from '../domain'
import { Board } from './Board'
export function Replay({ states, title, close }: { states: readonly GameSession[]; title: string; close: () => void }) {
  const ref = useRef<HTMLDialogElement>(null)
  const [index, setIndex] = useState(0)
  const [playing, setPlaying] = useState(false)
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null
    ref.current?.showModal()
    return () => previous?.focus()
  }, [])
  useEffect(() => {
    if (!playing || document.hidden) return
    const timer = window.setTimeout(() => { if (index < states.length - 1) setIndex(index + 1); else setPlaying(false) }, 650)
    const pause = () => setPlaying(false)
    document.addEventListener('visibilitychange', pause)
    return () => { clearTimeout(timer); document.removeEventListener('visibilitychange', pause) }
  }, [playing, index, states])
  const noop = () => {}
  return <dialog ref={ref} className="replay-dialog" aria-labelledby="replay-title" onCancel={event => { event.preventDefault(); close() }}>
    <div className="dialog-heading"><div><p className="eyebrow">VIEW ONLY · YOUR BOARD IS PRESERVED</p><h2 id="replay-title">{title}</h2></div><button className="secondary" onClick={close}>Return to game</button></div>
    <p role="status">Step {index} of {states.length - 1} · {states[index]!.moveCount} {states[index]!.moveCount === 1 ? 'move' : 'moves'}{states[index]!.status === 'won' ? ' · Solved' : ''}</p>
    <div className="board-frame"><Board idPrefix="replay-" board={states[index]!.board} selected={null} disabled onTap={noop} onDrag={noop} onCancel={noop} onUndo={noop} onRestart={noop}/></div>
    <div className="controls"><button className="secondary" disabled={!index} onClick={() => { setPlaying(false); setIndex(index - 1) }}>Previous step</button><button disabled={index === states.length - 1} onClick={() => setPlaying(!playing)}>{playing ? 'Pause' : 'Play'}</button><button className="secondary" disabled={index === states.length - 1} onClick={() => { setPlaying(false); setIndex(index + 1) }}>Next step</button><button className="secondary" onClick={() => { setPlaying(false); setIndex(0) }}>Start over</button></div>
    <p className="session-note">Playback uses a separate board. Closing restores your position, move count, undo history and checkpoint. New solution paths may use more moves than the historical par.</p>
  </dialog>
}
