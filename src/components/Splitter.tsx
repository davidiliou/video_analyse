import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from 'react'

type Props = {
  /** vertical = barre verticale (redim. largeur), horizontal = barre horizontale */
  orientation: 'vertical' | 'horizontal'
  onDrag: (delta: number) => void
  disabled?: boolean
}

/**
 * Poignée de redimensionnement. onDrag reçoit le delta souris
 * (positif = vers la droite / bas).
 */
export function Splitter({ orientation, onDrag, disabled }: Props) {
  const [dragging, setDragging] = useState(false)
  const lastPos = useRef(0)
  const onDragRef = useRef(onDrag)
  onDragRef.current = onDrag

  const onPointerDown = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      if (disabled) return
      e.preventDefault()
      lastPos.current = orientation === 'vertical' ? e.clientX : e.clientY
      setDragging(true)
      e.currentTarget.setPointerCapture(e.pointerId)
    },
    [disabled, orientation],
  )

  useEffect(() => {
    if (!dragging) return

    const onMove = (e: PointerEvent) => {
      const pos = orientation === 'vertical' ? e.clientX : e.clientY
      const delta = pos - lastPos.current
      lastPos.current = pos
      if (delta !== 0) onDragRef.current(delta)
    }
    const onUp = () => setDragging(false)

    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', onUp)
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onUp)
    }
  }, [dragging, orientation])

  return (
    <div
      className={`splitter splitter--${orientation}${dragging ? ' splitter--active' : ''}${disabled ? ' splitter--disabled' : ''}`}
      role="separator"
      aria-orientation={orientation}
      aria-disabled={disabled || undefined}
      onPointerDown={onPointerDown}
      title="Glisser pour redimensionner"
    />
  )
}
