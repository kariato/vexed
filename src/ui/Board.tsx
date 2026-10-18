import { useEffect, useRef, useState } from 'react'
import type { KeyboardEvent, PointerEvent, ReactNode } from 'react'
import { isBlock, tileAt } from '../domain'
import type { Board as GameBoard, Position } from '../domain'
import { cellAt, isDrag } from './pointer'
import type { PointerStart } from './pointer'
interface Props {
  idPrefix?: string; overlay?: ReactNode; board: GameBoard; selected: Position | null; disabled: boolean
  onTap: (position: Position) => void
  onDrag: (from: Position, target: Position) => void
  onCancel: () => void; onUndo: () => void; onRestart: () => void
}
export function Board({ idPrefix = '', overlay, board, selected, disabled, onTap, onDrag, onCancel, onUndo, onRestart }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const pointer = useRef<(PointerStart & { width: number; height: number; viewportWidth: number; viewportHeight: number }) | null>(null)
  const [cursor, setCursor] = useState<Position>({ x: 1, y: 1 })
  const [preview, setPreview] = useState<Position | null>(null)
  const cancel = () => { pointer.current = null; setPreview(null) }
  useEffect(() => {
    const reset = () => { pointer.current = null; setPreview(null) }
    window.addEventListener('blur', reset)
    window.addEventListener('resize', reset)
    document.addEventListener('visibilitychange', reset)
    return () => { window.removeEventListener('blur', reset); window.removeEventListener('resize', reset); document.removeEventListener('visibilitychange', reset) }
  }, [])
  const position = (event: PointerEvent<HTMLDivElement>) => {
    const rect = ref.current?.getBoundingClientRect()
    return rect ? cellAt(event.clientX, event.clientY, rect) : null
  }
  const down = (event: PointerEvent<HTMLDivElement>) => {
    if (disabled || !event.isPrimary || event.button !== 0 || pointer.current) return
    const from = position(event)
    if (!from) return
    ref.current?.focus({ preventScroll: true })
    setCursor(from)
    const rect = event.currentTarget.getBoundingClientRect()
    pointer.current = { id: event.pointerId, from, x: event.clientX, y: event.clientY, width: rect.width, height: rect.height, viewportWidth: window.innerWidth, viewportHeight: window.innerHeight }
    event.currentTarget.setPointerCapture(event.pointerId)
  }
  const cancelPointer = (event: PointerEvent<HTMLDivElement>) => { if (pointer.current?.id === event.pointerId) cancel() }
  const move = (event: PointerEvent<HTMLDivElement>) => {
    const start = pointer.current
    if (!start || start.id !== event.pointerId) return
    const target = position(event)
    setPreview(target && isDrag(start, event.clientX, event.clientY) ? { x: target.x, y: start.from.y } : null)
  }
  const up = (event: PointerEvent<HTMLDivElement>) => {
    const start = pointer.current
    if (!start || start.id !== event.pointerId) return
    const target = position(event)
    cancel()
    const rect = event.currentTarget.getBoundingClientRect()
    if (!target || disabled || rect.width !== start.width || rect.height !== start.height || window.innerWidth !== start.viewportWidth || window.innerHeight !== start.viewportHeight) return
    if (isDrag(start, event.clientX, event.clientY)) onDrag(start.from, { x: target.x, y: start.from.y })
    else onTap(target)
  }
  const key = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key.toLowerCase() === 'z') { event.preventDefault(); cancel(); onUndo(); return }
    if (disabled) return
    if (event.key.startsWith('Arrow')) {
      event.preventDefault(); cancel()
      const dx = event.key === 'ArrowLeft' ? -1 : event.key === 'ArrowRight' ? 1 : 0
      const dy = event.key === 'ArrowUp' ? -1 : event.key === 'ArrowDown' ? 1 : 0
      setCursor(value => ({ x: Math.max(0, Math.min(9, value.x + dx)), y: Math.max(0, Math.min(7, value.y + dy)) }))
    } else if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); cancel(); onTap(cursor) }
    else if (event.key === 'Escape') { cancel(); onCancel() }
    else if (event.key.toLowerCase() === 'r') { event.preventDefault(); cancel(); onRestart() }
  }
  return <div ref={ref} className={'board' + (overlay ? ' animating' : '')} role="grid" aria-label="Vexed puzzle, 8 rows and 10 columns" aria-busy={!!overlay} aria-rowcount={8} aria-colcount={10}
    tabIndex={0} aria-activedescendant={idPrefix + 'cell-' + cursor.x + '-' + cursor.y} aria-disabled={disabled}
    onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={cancelPointer} onLostPointerCapture={cancelPointer} onKeyDown={key}>
    {overlay}
    {board.cells.map((row, y) => <div role="row" className="board-row" key={y}>{row.map((tile, x) => {
      const active = selected?.x === x && selected.y === y
      return <div role="gridcell" id={idPrefix + 'cell-' + x + '-' + y} key={x} aria-selected={active}
        aria-label={'Row ' + (y + 1) + ', column ' + (x + 1) + ': ' + (isBlock(tile) ? 'block ' + tile.toUpperCase() : tile === '#' ? 'wall' : 'empty')}
        className={'tile ' + (tile === '#' ? 'wall' : isBlock(tile) ? 'block block-' + tile : 'air') + (active ? ' selected' : '') + (cursor.x === x && cursor.y === y ? ' cursor' : '') + (preview?.x === x && preview.y === y && tileAt(board, preview) === '.' ? ' preview' : '')}>
        <span aria-hidden="true">{isBlock(tile) ? tile.toUpperCase() : ''}</span></div>
    })}</div>)}
  </div>
}
