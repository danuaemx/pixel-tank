import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

export type PixelSelectOption = {
  value: string
  label: React.ReactNode
}

type PixelSelectProps = {
  value: string
  options: PixelSelectOption[]
  title?: string
  onChange: (value: string) => void
}

export function PixelSelect({ value, options, title, onChange }: PixelSelectProps) {
  const [open, setOpen] = useState(false)
  const [menuDirection, setMenuDirection] = useState<'down' | 'up'>('down')
  const triggerRef = useRef<HTMLButtonElement | null>(null)
  const hostRef = useRef<HTMLDivElement | null>(null)
  const menuRef = useRef<HTMLDivElement | null>(null)
  const [menuStyle, setMenuStyle] = useState<React.CSSProperties>({})

  const selected = options.find((option) => option.value === value) ?? options[0]

  useEffect(() => {
    if (!open || !triggerRef.current) {
      return
    }

    const updateMenuPosition = () => {
      const rect = triggerRef.current?.getBoundingClientRect()
      if (!rect) {
        return
      }

      const viewportPadding = 8
      const spaceBelow = window.innerHeight - rect.bottom - viewportPadding
      const spaceAbove = rect.top - viewportPadding

      const estimatedMenuHeight =
        menuRef.current?.offsetHeight ?? Math.min(240, Math.max(96, options.length * 34 + 8))

      const openUpward = spaceBelow < estimatedMenuHeight && spaceAbove > spaceBelow
      const availableHeight = openUpward ? spaceAbove : spaceBelow
      const maxHeight = Math.max(48, Math.floor(availableHeight))

      setMenuDirection(openUpward ? 'up' : 'down')

      if (openUpward) {
        setMenuStyle({
          left: rect.left,
          bottom: window.innerHeight - rect.top + 4,
          minWidth: rect.width,
          maxHeight,
        })
        return
      }

      setMenuStyle({
        left: rect.left,
        top: rect.bottom + 4,
        minWidth: rect.width,
        maxHeight,
      })
    }

    updateMenuPosition()
    window.addEventListener('resize', updateMenuPosition)
    window.addEventListener('scroll', updateMenuPosition, true)

    return () => {
      window.removeEventListener('resize', updateMenuPosition)
      window.removeEventListener('scroll', updateMenuPosition, true)
    }
  }, [open, options.length])

  useEffect(() => {
    if (!open) {
      return
    }

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node
      if (hostRef.current?.contains(target) || menuRef.current?.contains(target)) {
        return
      }
      setOpen(false)
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleEscape)

    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [open])

  return (
    <div className="pixel-select" ref={hostRef}>
      <button
        ref={triggerRef}
        className="symbol-select pixel-select-trigger"
        type="button"
        title={title}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((previous) => !previous)}
      >
        <span className="pixel-select-label">{selected?.label ?? value}</span>
        <span className="pixel-select-caret" aria-hidden="true">
          ▾
        </span>
      </button>

      {open &&
        createPortal(
          <div
            className={`pixel-select-menu ${menuDirection === 'up' ? 'opens-up' : ''}`}
            ref={menuRef}
            role="listbox"
            style={menuStyle}
          >
            {options.map((option) => {
              const active = option.value === value
              return (
                <button
                  key={option.value}
                  className={`pixel-select-option ${active ? 'is-selected' : ''}`}
                  type="button"
                  role="option"
                  aria-selected={active}
                  onClick={() => {
                    onChange(option.value)
                    setOpen(false)
                  }}
                >
                  {option.label}
                </button>
              )
            })}
          </div>,
          document.body,
        )}
    </div>
  )
}
