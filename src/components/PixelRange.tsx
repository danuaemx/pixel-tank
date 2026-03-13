import { useEffect, useMemo, useRef, useState } from 'react'

type PixelRangeProps = {
  value: number
  min: number
  max: number
  step: number
  onChange: (value: number) => void
  title?: string
  ariaLabel?: string
  className?: string
}

function clampToStep(value: number, min: number, max: number, step: number): number {
  const safeStep = Math.max(1, step)
  const clamped = Math.min(max, Math.max(min, value))
  const steps = Math.round((clamped - min) / safeStep)
  return min + steps * safeStep
}

export function PixelRange({
  value,
  min,
  max,
  step,
  onChange,
  title,
  ariaLabel,
  className,
}: PixelRangeProps) {
  const trackRef = useRef<HTMLDivElement | null>(null)
  const [dragging, setDragging] = useState(false)

  const safeStep = Math.max(1, step)
  const safeMax = Math.max(min, max)
  const safeValue = useMemo(() => clampToStep(value, min, safeMax, safeStep), [value, min, safeMax, safeStep])
  const rangeSpan = Math.max(1, safeMax - min)
  const percentage = ((safeValue - min) / rangeSpan) * 100

  const updateFromClientX = (clientX: number) => {
    const rect = trackRef.current?.getBoundingClientRect()
    if (!rect || rect.width <= 0) {
      return
    }

    const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width))
    const rawValue = min + ratio * (safeMax - min)
    const nextValue = clampToStep(rawValue, min, safeMax, safeStep)
    onChange(nextValue)
  }

  useEffect(() => {
    if (!dragging) {
      return
    }

    const handlePointerMove = (event: PointerEvent) => {
      updateFromClientX(event.clientX)
    }

    const handlePointerUp = () => {
      setDragging(false)
    }

    window.addEventListener('pointermove', handlePointerMove)
    window.addEventListener('pointerup', handlePointerUp)

    return () => {
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerup', handlePointerUp)
    }
  }, [dragging, min, safeMax, safeStep])

  const adjustBy = (delta: number) => {
    onChange(clampToStep(safeValue + delta, min, safeMax, safeStep))
  }

  return (
    <div className={['pixel-range', className].filter(Boolean).join(' ')} title={title}>
      <button className="small-btn pixel-range-step" type="button" onClick={() => adjustBy(-safeStep)}>
        -
      </button>

      <div
        ref={trackRef}
        className="pixel-range-track"
        role="slider"
        tabIndex={0}
        aria-label={ariaLabel}
        aria-valuemin={min}
        aria-valuemax={safeMax}
        aria-valuenow={safeValue}
        onPointerDown={(event) => {
          event.preventDefault()
          updateFromClientX(event.clientX)
          setDragging(true)
        }}
        onKeyDown={(event) => {
          if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') {
            event.preventDefault()
            adjustBy(-safeStep)
          }
          if (event.key === 'ArrowRight' || event.key === 'ArrowUp') {
            event.preventDefault()
            adjustBy(safeStep)
          }
          if (event.key === 'Home') {
            event.preventDefault()
            onChange(min)
          }
          if (event.key === 'End') {
            event.preventDefault()
            onChange(safeMax)
          }
        }}
      >
        <div className="pixel-range-fill" style={{ width: `${percentage}%` }} />
        <div className="pixel-range-thumb" style={{ left: `${percentage}%` }} />
      </div>

      <button className="small-btn pixel-range-step" type="button" onClick={() => adjustBy(safeStep)}>
        +
      </button>
    </div>
  )
}
