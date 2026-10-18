import { useEffect, useState } from 'react'
import type { VisualFrame } from './presentation'
export function Animation({ frames, speed, done }: { frames: readonly VisualFrame[]; speed: number; done: () => void }) {
  const [index, setIndex] = useState(0)
  useEffect(() => {
    const finish = () => done()
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const changed = () => { if (document.hidden || media.matches) finish() }
    document.addEventListener('visibilitychange', changed); media.addEventListener('change', changed)
    if (document.hidden || media.matches) finish()
    const timer = window.setTimeout(() => { if (index + 1 >= frames.length) finish(); else setIndex(index + 1) }, frames[index]!.duration / speed)
    return () => { clearTimeout(timer); document.removeEventListener('visibilitychange', changed); media.removeEventListener('change', changed) }
  }, [index, frames, speed, done])
  return <div className="sprites" aria-hidden="true">{frames[index]!.sprites.map(sprite => <div className="sprite" key={sprite.id} style={{ transform: 'translate(' + sprite.x * 100 + '%, ' + sprite.y * 100 + '%)', opacity: sprite.removed ? 0 : 1, transitionDuration: (index === 0 ? 0 : frames[index]!.duration / speed) + 'ms' }}><div className={'tile block block-' + sprite.kind}>{sprite.kind.toUpperCase()}</div></div>)}</div>
}
