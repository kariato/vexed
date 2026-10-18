// SPDX-License-Identifier: GPL-2.0-or-later
import { useEffect, useId, useRef, useState } from 'react'
// Sandboxed/cross-origin game embeds can suppress window.confirm. The itch-only
// presentation fork awaits a native HTML dialog instead of a browser modal.
export function useConfirm() {
  const [message, setMessage] = useState<string | null>(null)
  const pending = useRef<((answer: boolean) => void) | null>(null)
  const opener = useRef<HTMLElement | null>(null)
  const titleId = useId(), messageId = useId()
  useEffect(() => () => { pending.current?.(false); pending.current = null }, [])
  const confirm = (text: string): Promise<boolean> => new Promise(resolve => {
    pending.current?.(false)
    pending.current = resolve
    opener.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
    setMessage(text)
  })
  const finish = (answer: boolean) => {
    const resolve = pending.current; pending.current = null
    setMessage(null); resolve?.(answer)
    requestAnimationFrame(() => opener.current?.focus({ preventScroll: true }))
  }
  const confirmation = message === null ? null : <dialog className="replay-dialog" aria-labelledby={titleId} aria-describedby={messageId}
    ref={element => { if (element && !element.open) element.showModal() }}
    onCancel={event => { event.preventDefault(); finish(false) }}>
    <h2 id={titleId}>Confirm action</h2><p id={messageId}>{message}</p>
    <div className="controls"><button className="secondary" onClick={() => finish(false)}>Cancel</button><button onClick={() => finish(true)}>Continue</button></div>
  </dialog>
  return { confirm, confirmation }
}
