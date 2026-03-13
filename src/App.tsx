import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import './App.css'
import { chiptuneAudio, type MusicTheme, type UiSoundKey } from './audio'
import { GameScreen } from './components/GameScreen'
import { PixelIcon } from './components/PixelIcon'
import { PixelRange } from './components/PixelRange'
import {
  DIRECTIONS,
  advanceGame,
  commandToText,
  createCommandTemplate,
  createDefaultConfig,
  createDefaultPrograms,
  createInitialGameState,
  normalizeProgramsForPlayers,
  type Command,
  type CommandType,
  type CompareOperator,
  type Condition,
  type ConditionKind,
  type Direction,
  type BombDistanceSource,
  type GameConfig,
  type GameState,
  type NumericRegister,
  type ShootDirectionSource,
} from './game'

type Screen = 'menu' | 'tutorial' | 'config' | 'program' | 'game'
type MenuConfirmSource = Exclude<Screen, 'menu'>
type GameMusicTheme = Exclude<MusicTheme, 'menu'>

type DragPayload =
  | {
      kind: 'palette'
      commandType: CommandType
    }
  | {
      kind: 'program'
      index: number
    }

const DEFAULT_UI_FONT_SIZE = 17
const MIN_UI_FONT_SIZE = 5
const MAX_UI_FONT_SIZE = 24
const DEFAULT_MASTER_VOLUME = 170
const MIN_MASTER_VOLUME = 30
const MAX_MASTER_VOLUME = 320

function sanitizeUiFontSize(value: number): number {
  if (!Number.isFinite(value)) {
    return DEFAULT_UI_FONT_SIZE
  }

  return Math.min(MAX_UI_FONT_SIZE, Math.max(MIN_UI_FONT_SIZE, Math.round(value)))
}

function sanitizeMasterVolume(value: number): number {
  if (!Number.isFinite(value)) {
    return DEFAULT_MASTER_VOLUME
  }

  return Math.min(MAX_MASTER_VOLUME, Math.max(MIN_MASTER_VOLUME, Math.round(value)))
}

const NAV_ICONS = {
  quick: ['#    ', '##   ', '###  ', '##   ', '#    '],
  config: [' ### ', '# # #', ' ### ', '# # #', ' ### '],
  program: ['#####', '#   #', '#####', '#   #', '#####'],
  tutorial: ['#### ', '#   #', '#### ', '#   #', '#   #'],
  add: ['  #  ', '  #  ', '#####', '  #  ', '  #  '],
  back: [' #    ', '##    ', '##### ', '##    ', ' #    '],
  cancel: ['#   #', ' # # ', '  #  ', ' # # ', '#   #'],
  restart: [' ### ', '#   #', '## ##', '#   #', ' ### '],
  menu: ['#####', '# # #', '#   #', '# # #', '#####'],
  start: ['#    ', '##   ', '###  ', '##   ', '#    '],
  tips: ['  #  ', ' ### ', '#####', ' ### ', '  #  '],
}

const COMMAND_LIBRARY: Array<{ type: CommandType; desc: string; icon: React.ReactNode }> = [
  {
    type: 'MOVER',
    desc: 'Mueve casilla en dirección.',
    icon: <PixelIcon color="#38bdf8" grid={['  #  ', ' ### ', '#####', ' ### ', '  #  ', '  #  ', '  #  ']} />
  },
  {
    type: 'DISPARAR',
    desc: 'Ataque instantáneo línea recta.',
    icon: <PixelIcon color="#f87171" grid={[' ### ', '#####', ' # # ', ' # # ', '  #  ', '  #  ', '  #  ']} />
  },
  {
    type: 'COLOCAR_MINA',
    desc: 'Deja mina en casilla (daño 40).',
    icon: <PixelIcon color="#facc15" grid={['  #  ', ' ### ', '#####', ' ### ', '  #  ']} />
  },
  {
    type: 'BOMBA',
    desc: 'Radial 3x3 a distancia.',
    icon: <PixelIcon color="#ef4444" grid={['#   #', ' # # ', '  #  ', ' ### ', '#####', ' ### ', '  #  ']} />
  },
  {
    type: 'RAD',
    desc: 'Radar (- tanque, + estación).',
    icon: <PixelIcon color="#4ade80" grid={['  #  ', ' # # ', '#   #', '  #  ', '  #  ', '  #  ', ' ### ']} />
  },
  {
    type: 'IF',
    desc: 'Si falla, salta línea.',
    icon: <PixelIcon color="#a78bfa" grid={[' ### ', '#   #', '   # ', '  #  ', '     ', '  #  ', '  #  ']} />
  },
  {
    type: 'ESPERA',
    desc: 'Sin acción.',
    icon: <PixelIcon color="#94a3b8" grid={['#####', ' # # ', '  #  ', ' # # ', '#####']} />
  },
  {
    type: 'LABEL',
    desc: 'Marca salto.',
    icon: <PixelIcon color="#f472b6" grid={['#### ', '#   #', '#### ', '#    ', '#    ']} />
  },
  {
    type: 'JUMP',
    desc: 'Ir a LABEL.',
    icon: <PixelIcon color="#fb923c" grid={[' ### ', '#   #', '    #', '  ## ', ' #   ', '#### ']} />
  },
]

const CONDITION_OPTIONS: Array<{ kind: ConditionKind; label: string }> = [
  { kind: 'TRUE', label: 'TRUE' },
  { kind: 'REGISTER_COMPARE', label: 'REGISTRO OP VALOR' },
  { kind: 'DAÑO', label: 'DAÑO_DIR != NONE' },
  { kind: 'DIR_MOV_EQ', label: 'DIR_MOV == dir' },
]

const REGISTER_OPTIONS: NumericRegister[] = ['RAD', 'SALUD']
const COMPARE_OPERATORS: CompareOperator[] = ['<=', '<', '>', '>=', '==']
const DIST_SOURCE_OPTIONS: BombDistanceSource[] = ['VAL', 'RAD', 'SALUD']
const SHOOT_DIRECTION_OPTIONS: Array<Direction | 'RAD_DIR'> = [...DIRECTIONS, 'RAD_DIR']

function getUiSoundForButton(button: HTMLButtonElement): UiSoundKey {
  const className = typeof button.className === 'string' ? button.className.toLowerCase() : ''
  const descriptor = `${button.getAttribute('aria-label') ?? ''} ${button.getAttribute('title') ?? ''} ${button.textContent ?? ''}`
    .toLowerCase()

  if (
    className.includes('danger') ||
    descriptor.includes('reiniciar') ||
    descriptor.includes('abandonar') ||
    descriptor.includes('eliminar')
  ) {
    return 'ui-danger'
  }

  if (descriptor.includes('paso') || descriptor.includes('step')) {
    return 'ui-step'
  }

  if (
    className.includes('tank-tab') ||
    className.includes('program-icon-btn') ||
    className.includes('top-control-btn') ||
    className.includes('btn-with-icon')
  ) {
    return 'ui-nav'
  }

  if (
    className.includes('small-btn') ||
    className.includes('pixel-select-option') ||
    className.includes('pixel-select-trigger')
  ) {
    return 'ui-toggle'
  }

  return 'ui-action'
}

function createDefaultCondition(kind: ConditionKind): Condition {
  if (kind === 'REGISTER_COMPARE') {
    return { kind, register: 'RAD', operator: '>', value: 0 }
  }

  if (kind === 'DIR_MOV_EQ') {
    return { kind, dir: 'N' }
  }

  return { kind }
}

function getConditionForEditor(condition: Condition | undefined): Condition {
  if (!condition) {
    return { kind: 'TRUE' }
  }

  if (condition.kind === 'REGISTER_COMPARE') {
    return {
      kind: 'REGISTER_COMPARE',
      register: condition.register ?? 'RAD',
      operator: condition.operator ?? '>',
      value: condition.value ?? 0,
    }
  }

  if (condition.kind === 'DIR_MOV_EQ') {
    return {
      kind: 'DIR_MOV_EQ',
      dir: condition.dir ?? 'N',
    }
  }

  return condition
}

function getReturnToMenuDialog(source: MenuConfirmSource): {
  title: string
  message: string
  confirmLabel: string
} {
  if (source === 'game') {
    return {
      title: 'Abandonar partida',
      message: 'Se perderá la partida en curso. ¿Quieres abandonar y volver al menú?',
      confirmLabel: 'Abandonar partida',
    }
  }

  if (source === 'program') {
    return {
      title: 'Volver al menú',
      message: 'Vas a salir del programador de tanques. ¿Deseas volver al menú?',
      confirmLabel: 'Volver al menú',
    }
  }

  if (source === 'config') {
    return {
      title: 'Volver al menú',
      message: 'Vas a salir de configuración. ¿Deseas volver al menú?',
      confirmLabel: 'Volver al menú',
    }
  }

  return {
    title: 'Volver al menú',
    message: '¿Deseas volver al menú principal?',
    confirmLabel: 'Volver al menú',
  }
}

type PixelSelectOption = {
  value: string
  label: React.ReactNode
}

type PixelSelectProps = {
  value: string
  options: PixelSelectOption[]
  title?: string
  onChange: (value: string) => void
}

function PixelSelect({ value, options, title, onChange }: PixelSelectProps) {
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
  }, [open])

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

function App() {
  const [screen, setScreen] = useState<Screen>('menu')
  const [config, setConfig] = useState<GameConfig>(() => createDefaultConfig())
  const [programs, setPrograms] = useState<Command[][]>(() => {
    const defaults = createDefaultConfig()
    return createDefaultPrograms(defaults.players)
  })
  const [selectedTank, setSelectedTank] = useState(0)
  const [dragPayload, setDragPayload] = useState<DragPayload | null>(null)
  const [gameState, setGameState] = useState<GameState | null>(null)
  const [running, setRunning] = useState(false)
  const [gameMusicTheme, setGameMusicTheme] = useState<GameMusicTheme>('game')
  const [animatePassiveLines, setAnimatePassiveLines] = useState(true)
  const [restartConfirmOpen, setRestartConfirmOpen] = useState(false)
  const [showProgramTips, setShowProgramTips] = useState(true)
  const [recentlyAddedCommandId, setRecentlyAddedCommandId] = useState<string | null>(null)
  const [menuConfirmSource, setMenuConfirmSource] = useState<MenuConfirmSource | null>(null)
  const [programScrollRequest, setProgramScrollRequest] = useState(0)
  const [uiFontSize, setUiFontSize] = useState<number>(() => {
    if (typeof window === 'undefined') {
      return DEFAULT_UI_FONT_SIZE
    }

    const stored = window.localStorage.getItem('ui-font-size')
    if (!stored) {
      return DEFAULT_UI_FONT_SIZE
    }

    return sanitizeUiFontSize(Number(stored))
  })
  const [masterVolume, setMasterVolume] = useState<number>(() => {
    if (typeof window === 'undefined') {
      return DEFAULT_MASTER_VOLUME
    }

    const stored = window.localStorage.getItem('master-volume')
    if (!stored) {
      return DEFAULT_MASTER_VOLUME
    }

    return sanitizeMasterVolume(Number(stored))
  })

  const currentProgram = programs[selectedTank] ?? []
  const programAreaRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    return () => {
      chiptuneAudio.stopMusic()
    }
  }, [])

  useEffect(() => {
    if (screen !== 'game') {
      setRunning(false)
    }
  }, [screen])

  useEffect(() => {
    if (screen === 'game') {
      chiptuneAudio.startMusic(gameMusicTheme)
      return
    }

    chiptuneAudio.startMusic('menu')
  }, [screen, gameMusicTheme])

  useEffect(() => {
    if (chiptuneAudio.isAudioUnlocked()) {
      return
    }

    const startCurrentTheme = () => {
      chiptuneAudio.unlockAudio()
      if (screen === 'game') {
        chiptuneAudio.startMusic(gameMusicTheme)
        return
      }

      chiptuneAudio.startMusic('menu')
    }

    window.addEventListener('pointerdown', startCurrentTheme, { capture: true, once: true })
    window.addEventListener('keydown', startCurrentTheme, { capture: true, once: true })
    window.addEventListener('touchstart', startCurrentTheme, { capture: true, once: true })

    return () => {
      window.removeEventListener('pointerdown', startCurrentTheme, true)
      window.removeEventListener('keydown', startCurrentTheme, true)
      window.removeEventListener('touchstart', startCurrentTheme, true)
    }
  }, [screen, gameMusicTheme])

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target
      if (!(target instanceof Element)) {
        return
      }

      const button = target.closest('button')
      if (button instanceof HTMLButtonElement) {
        if (!button.disabled) {
          chiptuneAudio.playUi(getUiSoundForButton(button))
        }
        return
      }

      const toggleInput = target.closest('input[type="checkbox"]')
      if (toggleInput instanceof HTMLInputElement) {
        if (!toggleInput.disabled) {
          chiptuneAudio.playUi('ui-toggle')
        }
        return
      }

      const toggleLabel = target.closest('label.tips-toggle')
      if (toggleLabel) {
        chiptuneAudio.playUi('ui-toggle')
      }
    }

    document.addEventListener('pointerdown', handlePointerDown, true)
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown, true)
    }
  }, [])

  useEffect(() => {
    if (gameState?.finished) {
      setRunning(false)
    }
  }, [gameState?.finished])

  useEffect(() => {
    if (!running || screen !== 'game' || !gameState || gameState.finished) {
      return
    }

    const timeoutId = window.setTimeout(() => {
      setGameState((previous) => {
        if (!previous || previous.finished) {
          return previous
        }

        const next = advanceGame(previous)
        next.soundEvents.forEach((sound) => chiptuneAudio.play(sound))
        return next
      })
    }, gameState.config.tickMs)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [gameState, running, screen])

  useEffect(() => {
    document.documentElement.style.fontSize = `${uiFontSize}px`
    window.localStorage.setItem('ui-font-size', String(uiFontSize))
  }, [uiFontSize])

  useEffect(() => {
    chiptuneAudio.setMasterVolume(masterVolume / 100)
    window.localStorage.setItem('master-volume', String(masterVolume))
  }, [masterVolume])

  useEffect(() => {
    if (programScrollRequest === 0 || screen !== 'program') {
      return
    }

    const frameId = window.requestAnimationFrame(() => {
      if (!programAreaRef.current) {
        return
      }

      programAreaRef.current.scrollTop = programAreaRef.current.scrollHeight
    })

    return () => {
      window.cancelAnimationFrame(frameId)
    }
  }, [programScrollRequest, screen, currentProgram.length])

  useEffect(() => {
    if (!recentlyAddedCommandId) {
      return
    }

    const timeoutId = window.setTimeout(() => {
      setRecentlyAddedCommandId(null)
    }, 1000)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [recentlyAddedCommandId])

  const updatePlayers = (value: number): void => {
    const players = Math.min(6, Math.max(2, value))
    setConfig((previous) => ({ ...previous, players }))
    setPrograms((previous) => normalizeProgramsForPlayers(previous, players))
    setSelectedTank((previous) => (previous >= players ? players - 1 : previous))
  }

  const updateGridSize = (value: number): void => {
    const gridSize = Math.min(15, Math.max(6, value))
    setConfig((previous) => ({ ...previous, gridSize }))
  }

  const updatePassiveLimit = (value: number): void => {
    const passiveLimit = Math.min(50, Math.max(0, value))
    setConfig((previous) => ({ ...previous, passiveLimit }))
  }

  const updateUiFontSize = (value: number): void => {
    setUiFontSize(sanitizeUiFontSize(value))
  }

  const updateMasterVolume = (value: number): void => {
    setMasterVolume(sanitizeMasterVolume(value))
  }

  const applyDefaultSetup = (): void => {
    const defaults = createDefaultConfig()
    setConfig(defaults)
    setPrograms(createDefaultPrograms(defaults.players))
    setSelectedTank(0)
  }

  const runSingleStep = (): void => {
    setGameState((previous) => {
      if (!previous || previous.finished) {
        return previous
      }

      const next = advanceGame(previous)
      next.soundEvents.forEach((sound) => chiptuneAudio.play(sound))
      return next
    })
  }

  const startSimulation = (quick = false): void => {
    const selectedTheme: GameMusicTheme = quick ? 'quick' : 'game'
    const selectedConfig = quick ? createDefaultConfig() : config
    const selectedPrograms = quick
      ? createDefaultPrograms(selectedConfig.players)
      : normalizeProgramsForPlayers(programs, selectedConfig.players)

    if (quick) {
      setConfig(selectedConfig)
      setPrograms(selectedPrograms)
      setSelectedTank(0)
    } else {
      setPrograms(selectedPrograms)
    }

    const initialState = createInitialGameState(selectedConfig, selectedPrograms)
    setGameMusicTheme(selectedTheme)
    setGameState(initialState)
    setScreen('game')
    setRunning(true)
    chiptuneAudio.startMusic(selectedTheme)
  }

  const restartSimulation = (): void => {
    const normalizedPrograms = normalizeProgramsForPlayers(programs, config.players)
    setPrograms(normalizedPrograms)
    setGameState(createInitialGameState(config, normalizedPrograms))
    setRunning(true)
    chiptuneAudio.startMusic(gameMusicTheme)
  }

  const updateSelectedProgram = (updater: (program: Command[]) => Command[]): void => {
    setPrograms((previous) => {
      const next = previous.map((program) => [...program])
      const selected = [...(next[selectedTank] ?? [])]
      next[selectedTank] = updater(selected)
      return next
    })
  }

  const patchCommand = (index: number, updater: (command: Command) => void): void => {
    updateSelectedProgram((program) => {
      if (!program[index]) {
        return program
      }

      const current = program[index]
      const nextCommand: Command = {
        ...current,
        condition: current.condition ? { ...current.condition } : undefined,
      }

      updater(nextCommand)
      program[index] = nextCommand
      return program
    })
  }

  const addCommandAt = (index: number, type: CommandType): void => {
    updateSelectedProgram((program) => {
      const insertAt = Math.min(program.length, Math.max(0, index))
      const next = [...program]
      next.splice(insertAt, 0, createCommandTemplate(type))
      return next
    })
  }

  const addCommandByClick = (type: CommandType): void => {
    const command = createCommandTemplate(type)
    updateSelectedProgram((program) => {
      const next = [...program, command]
      return next
    })

    setRecentlyAddedCommandId(command.id)
    setProgramScrollRequest((previous) => previous + 1)
  }

  const moveCommand = (fromIndex: number, toIndex: number): void => {
    updateSelectedProgram((program) => {
      if (fromIndex < 0 || fromIndex >= program.length) {
        return program
      }

      const next = [...program]
      const [item] = next.splice(fromIndex, 1)
      let insertAt = Math.min(next.length, Math.max(0, toIndex))

      if (fromIndex < insertAt) {
        insertAt -= 1
      }

      next.splice(insertAt, 0, item)
      return next
    })
  }

  const moveCommandUp = (index: number): void => {
    if (index <= 0) {
      return
    }

    moveCommand(index, index - 1)
  }

  const moveCommandDown = (index: number, total: number): void => {
    if (index >= total - 1) {
      return
    }

    moveCommand(index, index + 2)
  }

  const handleDropAt = (index: number): void => {
    if (!dragPayload) {
      return
    }

    if (dragPayload.kind === 'palette') {
      addCommandAt(index, dragPayload.commandType)
    } else {
      moveCommand(dragPayload.index, index)
    }

    setDragPayload(null)
  }

  const removeCommand = (index: number): void => {
    updateSelectedProgram((program) => program.filter((_, commandIndex) => commandIndex !== index))
  }

  const getCondition = (command: Command): Condition => {
    return getConditionForEditor(command.condition)
  }

  const getIfDependencyDepth = (program: Command[], index: number): number => {
    let depth = 0

    for (let cursor = index - 1; cursor >= 0; cursor -= 1) {
      if (program[cursor]?.type !== 'IF') {
        break
      }

      depth += 1
    }

    return depth
  }

  const renderProgramField = (label: string, control: React.ReactNode, className?: string) => {
    return (
      <label className={['field-stack', className].filter(Boolean).join(' ')}>
        {control}
        <span className="field-pill">{label}</span>
      </label>
    )
  }

  const renderConfigStepper = (
    value: number,
    min: number,
    max: number,
    onValueChange: (nextValue: number) => void,
    title: string,
  ) => {
    const clampValue = (candidate: number) => Math.min(max, Math.max(min, Math.round(candidate)))

    return (
      <div className="config-stepper">
        <button
          className="small-btn config-step-btn"
          type="button"
          title={`Reducir ${title}`}
          onClick={() => onValueChange(clampValue(value - 1))}
        >
          -
        </button>
        <input
          className="config-number-input"
          type="number"
          min={min}
          max={max}
          value={value}
          onChange={(event) => {
            const parsed = Number(event.target.value)
            if (!Number.isFinite(parsed)) {
              return
            }
            onValueChange(clampValue(parsed))
          }}
        />
        <button
          className="small-btn config-step-btn"
          type="button"
          title={`Incrementar ${title}`}
          onClick={() => onValueChange(clampValue(value + 1))}
        >
          +
        </button>
      </div>
    )
  }

  const askReturnToMenu = (source: MenuConfirmSource): void => {
    setMenuConfirmSource(source)
  }

  const askRestartSimulation = (): void => {
    setRestartConfirmOpen(true)
  }

  const cancelRestartSimulation = (): void => {
    setRestartConfirmOpen(false)
  }

  const confirmRestartSimulation = (): void => {
    setRestartConfirmOpen(false)
    restartSimulation()
  }

  const cancelReturnToMenu = (): void => {
    setMenuConfirmSource(null)
  }

  const confirmReturnToMenu = (): void => {
    if (menuConfirmSource === 'game') {
      setGameState(null)
      setRunning(false)
    }

    setMenuConfirmSource(null)
    setScreen('menu')
  }

  const menuConfirmDialog = menuConfirmSource ? getReturnToMenuDialog(menuConfirmSource) : null

  const renderMenu = () => {
    return (
      <section className="panel menu-screen">
        <div className="hero-banner">
          <h1 className="retro-title">PIXEL TANKS</h1>
        </div>
        <p className="subtitle">Observa y Programa la batalla automática de tanques.</p>
        <div className="menu-actions">
          <button className="pixel-btn btn-large btn-with-icon" onClick={() => startSimulation(true)}>
            <span className="btn-icon"><PixelIcon color="#064e3b" grid={NAV_ICONS.quick} /></span>
            <span>Partida rápida</span>
          </button>
          <button className="pixel-btn btn-large btn-with-icon" onClick={() => setScreen('config')}>
            <span className="btn-icon"><PixelIcon color="#064e3b" grid={NAV_ICONS.config} /></span>
            <span>Configuración</span>
          </button>
          <button className="pixel-btn btn-large btn-with-icon" onClick={() => setScreen('program')}>
            <span className="btn-icon"><PixelIcon color="#064e3b" grid={NAV_ICONS.program} /></span>
            <span>Programar tanques</span>
          </button>
          <button className="pixel-btn btn-large btn-with-icon" onClick={() => setScreen('tutorial')}>
            <span className="btn-icon"><PixelIcon color="#064e3b" grid={NAV_ICONS.tutorial} /></span>
            <span>Tutorial</span>
          </button>
        </div>
      </section>
    )
  }

  const renderTutorial = () => {
    return (
      <section className="panel tutorial-screen">
        <h2>Tutorial</h2>
        <ul className="tutorial-list">
          <li>
            <span className="tutorial-item-icon"><PixelIcon color="#38bdf8" grid={['  #  ', ' ### ', '#####', ' ### ', '  #  ', '  #  ', '  #  ']} /></span>
            <strong>MOVER(DIR)</strong>: mueve en N/S/E/O (sin diagonales).
          </li>
          <li>
            <span className="tutorial-item-icon"><PixelIcon color="#f87171" grid={[' ### ', '#####', ' # # ', ' # # ', '  #  ', '  #  ', '  #  ']} /></span>
            <strong>DISPARAR(DIR)</strong>: daño instantáneo de -20, alcance según tablero. También acepta <strong>DISPARAR(RAD_DIR)</strong>.
          </li>
          <li>
            <span className="tutorial-item-icon"><PixelIcon color="#facc15" grid={['  #  ', ' ### ', '#####', ' ### ', '  #  ']} /></span>
            <strong>COLOCAR_MINA</strong>: pone mina en casilla actual (3 por tanque, -40 daño).
          </li>
          <li>
            <span className="tutorial-item-icon"><PixelIcon color="#ef4444" grid={['#   #', ' # # ', '  #  ', ' ### ', '#####', ' ### ', '  #  ']} /></span>
            <strong>BOMBA(DIR,DIST)</strong>: 2 por tanque, área 3x3 (-30) y residual alrededor (-15). DIR puede ser N/S/E/O o RAD_DIR, y DIST puede ser VAL, |RAD| o SALUD.
          </li>
          <li>
            <span className="tutorial-item-icon"><PixelIcon color="#4ade80" grid={['  #  ', ' # # ', '#   #', '  #  ', '  #  ', '  #  ', ' ### ']} /></span>
            <strong>RAD(DIR)</strong>: guarda RAD con -d si hay tanque/obstáculo/mina, +d si hay estación, y actualiza RAD_DIR con la última dirección leída.
          </li>
          <li>
            <span className="tutorial-item-icon"><PixelIcon color="#a78bfa" grid={[' ### ', '#   #', '   # ', '  #  ', '     ', '  #  ', '  #  ']} /></span>
            <strong>IF(COND)</strong>: si falla, salta la siguiente línea. COND usa operadores &lt;=, &lt;, &gt;, &gt;=, ==.
          </li>
          <li>
            <span className="tutorial-item-icon"><PixelIcon color="#fb923c" grid={[' ### ', '#   #', '    #', '  ## ', ' #   ', '#### ']} /></span>
            <strong>LABEL</strong> y <strong>JUMP[COND,LABEL]</strong>: controlan bucles y saltos con la misma condición de IF.
          </li>
        </ul>

        <h3>Registros</h3>
        <ul className="tutorial-list">
          <li><span className="tutorial-item-icon"><PixelIcon color="#34d399" grid={['#####', '#   #', '### #', '#   #', '#####']} /></span><strong>RAD</strong>: radar en la dirección leída. -d si detecta tanque/obstáculo/mina, +d si detecta estación, 0 si no detecta.</li>
          <li><span className="tutorial-item-icon"><PixelIcon color="#22d3ee" grid={[' ### ', '#   #', '# # #', '#   #', ' ### ']} /></span><strong>RAD_DIR</strong>: última dirección usada por RAD. Se puede reutilizar en DISPARAR(RAD_DIR).</li>
          <li><span className="tutorial-item-icon"><PixelIcon color="#f87171" grid={['#   #', '## ##', '# # #', '#   #', '#   #']} /></span><strong>DANO_DIR</strong>: dirección desde la que recibió daño en el turno previo (sirve para saltar a huida).</li>
          <li><span className="tutorial-item-icon"><PixelIcon color="#60a5fa" grid={['#   #', '## ##', '# # #', '#   #', ' ### ']} /></span><strong>DIR_MOV</strong>: última dirección usada en MOVER.</li>
          <li><span className="tutorial-item-icon"><PixelIcon color="#fcd34d" grid={[' ### ', '#   #', '#   #', '#   #', ' ### ']} /></span><strong>SALUD</strong>: vida actual del tanque (0 a 100).</li>
        </ul>

        <h3>Reglas clave</h3>
        <ul className="tutorial-list">
          <li><span className="tutorial-item-icon"><PixelIcon color="#38bdf8" grid={['#####', '#   #', '#   #', '#   #', '#####']} /></span>Tanques personalizables: 2 a 6 jugadores.</li>
          <li><span className="tutorial-item-icon"><PixelIcon color="#4ade80" grid={['#####', '# # #', '# # #', '# # #', '#####']} /></span>Tablero personalizable: 6x6 a 15x15.</li>
          <li><span className="tutorial-item-icon"><PixelIcon color="#ef4444" grid={[' ### ', '#####', ' ### ', ' ### ', ' # # ']} /></span>Vida inicial 100, colisión contra borde/pared/tanque: -10.</li>
          <li><span className="tutorial-item-icon"><PixelIcon color="#22d3ee" grid={['  #  ', ' ### ', '#   #', ' ### ', '  #  ']} /></span>Recupera 10 al pisar estación; estaciones se mueven cada 5 rondas.</li>
          <li><span className="tutorial-item-icon"><PixelIcon color="#f97316" grid={['  #  ', ' ### ', '#####', ' ### ', '  #  ']} /></span>Eliminar objetivos da recuperación del 20% y puntos.</li>
          <li><span className="tutorial-item-icon"><PixelIcon color="#fcd34d" grid={[' ### ', ' # # ', ' ### ', '  #  ', '  #  ']} /></span>Puntaje: eliminaciones, salud final y 10% extra al código más corto.</li>
        </ul>

        <div className="inline-actions">
          <button className="pixel-btn btn-with-icon" onClick={() => askReturnToMenu('tutorial')}>
            <span className="btn-icon"><PixelIcon color="#064e3b" grid={NAV_ICONS.menu} /></span>
            <span>Volver al menú</span>
          </button>
        </div>
      </section>
    )
  }

  const renderConfig = () => {
    return (
      <section className="panel config-screen">
        <h2>Configuración</h2>
        <p className="config-lead">Ajusta reglas de partida y tamaño de interfaz antes de iniciar.</p>
        <div className="config-grid">
          <label>
            Número de tanques (2-6)
            {renderConfigStepper(config.players, 2, 6, updatePlayers, 'número de tanques')}
          </label>

          <label>
            Tamaño del grid (6-15)
            {renderConfigStepper(config.gridSize, 6, 15, updateGridSize, 'tamaño del grid')}
          </label>

          <label>
            Líneas pasivas permitidas
            {renderConfigStepper(config.passiveLimit, 0, 50, updatePassiveLimit, 'líneas pasivas')}
          </label>

          <label className="font-size-setting">
            <div className="font-size-header">
              <span>Tamaño de letra</span>
              <strong>{uiFontSize}px</strong>
            </div>
            <PixelRange
              className="config-range-control"
              title="Tamaño de letra"
              ariaLabel="Tamaño de letra"
              value={uiFontSize}
              min={MIN_UI_FONT_SIZE}
              max={MAX_UI_FONT_SIZE}
              step={1}
              onChange={updateUiFontSize}
            />
            <div className="font-size-actions">
              <button className="small-btn" type="button" onClick={() => updateUiFontSize(DEFAULT_UI_FONT_SIZE)}>
                Reset
              </button>
            </div>
            <div className="font-size-preview">Vista previa: paneles, botones y textos se adaptan al nuevo tamaño.</div>
          </label>

          <label className="font-size-setting">
            <div className="font-size-header">
              <span>Volumen base</span>
              <strong>{masterVolume}%</strong>
            </div>
            <PixelRange
              className="config-range-control"
              title="Volumen base"
              ariaLabel="Volumen base"
              value={masterVolume}
              min={MIN_MASTER_VOLUME}
              max={MAX_MASTER_VOLUME}
              step={5}
              onChange={updateMasterVolume}
            />
            <div className="font-size-actions">
              <button className="small-btn" type="button" onClick={() => updateMasterVolume(DEFAULT_MASTER_VOLUME)}>
                Reset
              </button>
            </div>
            <div className="font-size-preview">Controla el volumen global de música, acciones del juego y botones.</div>
          </label>
        </div>

        <div className="inline-actions">
          <button className="pixel-btn" onClick={applyDefaultSetup}>
            Usar valores default
          </button>
          <button className="pixel-btn btn-with-icon" onClick={() => setScreen('program')}>
            <span className="btn-icon"><PixelIcon color="#064e3b" grid={NAV_ICONS.program} /></span>
            <span>Programar tanques</span>
          </button>
          <button className="pixel-btn btn-with-icon" onClick={() => startSimulation(false)}>
            <span className="btn-icon"><PixelIcon color="#064e3b" grid={NAV_ICONS.start} /></span>
            <span>Iniciar simulación</span>
          </button>
          <button className="pixel-btn btn-with-icon" onClick={() => askReturnToMenu('config')}>
            <span className="btn-icon"><PixelIcon color="#064e3b" grid={NAV_ICONS.menu} /></span>
            <span>Volver</span>
          </button>
        </div>
      </section>
    )
  }

  const renderProgramEditor = () => {
    return (
      <section className={`panel editor-screen ${showProgramTips ? '' : 'tips-hidden'}`}>
        <div className="program-top-bar">
          <h2 className="program-top-title">Programador de tanques</h2>

          <div className="program-top-controls">
            <div className="program-top-actions">
              <button className="pixel-btn program-icon-btn" title="Volver a configuración" aria-label="Volver a configuración" onClick={() => setScreen('config')}>
                <PixelIcon color="#064e3b" grid={NAV_ICONS.back} />
              </button>
              <button className="pixel-btn program-icon-btn" title="Iniciar simulación" aria-label="Iniciar simulación" onClick={() => startSimulation(false)}>
                <PixelIcon color="#064e3b" grid={NAV_ICONS.start} />
              </button>
              <button className="pixel-btn program-icon-btn" title="Volver al menú" aria-label="Volver al menú" onClick={() => askReturnToMenu('program')}>
                <PixelIcon color="#064e3b" grid={NAV_ICONS.menu} />
              </button>
            </div>

            <label className="tips-toggle" title={showProgramTips ? 'Ocultar tips' : 'Mostrar tips'}>
              <input
                type="checkbox"
                checked={showProgramTips}
                aria-label="Mostrar u ocultar tips del editor"
                onChange={(event) => setShowProgramTips(event.target.checked)}
              />
              <span className="tips-toggle-track">
                <span className="tips-toggle-thumb" />
              </span>
              <span className="tips-toggle-icon">
                <PixelIcon color={showProgramTips ? '#fcd34d' : '#94a3b8'} grid={NAV_ICONS.tips} />
              </span>
            </label>
          </div>
        </div>

        <div className="tank-tabs">
          {Array.from({ length: config.players }, (_, index) => {
            const selected = index === selectedTank
            return (
              <button
                key={`tab-${index + 1}`}
                className={`tank-tab ${selected ? 'active' : ''}`}
                onClick={() => setSelectedTank(index)}
              >
                T{index + 1}
              </button>
            )
          })}
        </div>

        <div className="editor-layout">
          <div className="palette">
            <h3>Comandos</h3>
            <ul>
              {COMMAND_LIBRARY.map((item) => (
                <li key={item.type} className="palette-item">
                  <div className="palette-header">
                    <span className="palette-icon">{item.icon}</span>
                    <span className="palette-title">{item.type}</span>
                  </div>
                  <div className="palette-actions">
                    <button
                      className="small-btn palette-add-btn"
                      type="button"
                      title={`Agregar ${item.type}`}
                      aria-label={`Agregar ${item.type}`}
                      onClick={() => addCommandByClick(item.type)}
                    >
                      <PixelIcon color="#064e3b" grid={NAV_ICONS.add} />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="program-area" ref={programAreaRef}>
            <h3>Programa de T{selectedTank + 1}</h3>

            <ul className="program-list">
              {currentProgram.map((command, index) => {
                const condition = getCondition(command)
                const bombDistSource = command.distSource ?? 'VAL'
                const ifDepth = Math.min(4, getIfDependencyDepth(currentProgram, index))
                const closesPreviousIf = currentProgram[index - 1]?.type === 'IF'

                return (
                  <li
                    key={command.id}
                    className={[
                      'program-row',
                      command.id === recentlyAddedCommandId ? 'is-new-line' : '',
                      ifDepth > 0 ? `if-depth-${ifDepth}` : '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                    draggable
                    onDragStart={() => setDragPayload({ kind: 'program', index })}
                    onDragEnd={() => setDragPayload(null)}
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={(event) => {
                      event.preventDefault()
                      const targetIndex =
                        dragPayload?.kind === 'program' && dragPayload.index < index ? index + 1 : index
                      handleDropAt(targetIndex)
                    }}
                  >
                    {ifDepth > 0 && (
                      <div className="if-guides" aria-hidden="true">
                        {Array.from({ length: ifDepth }, (_, guideIndex) => (
                          <span key={`${command.id}-guide-${guideIndex}`} className="if-guide-line" />
                        ))}
                      </div>
                    )}

                    <div className="row-controls compact-controls">
                      <div className="row-topline">
                        <span className="row-num">{index + 1}</span>
                        <div className="row-move">
                          <button
                            className="small-btn row-move-btn"
                            type="button"
                            title="Subir línea"
                            disabled={index === 0}
                            onClick={() => moveCommandUp(index)}
                          >
                            ↑
                          </button>
                          <button
                            className="small-btn row-move-btn"
                            type="button"
                            title="Bajar línea"
                            disabled={index === currentProgram.length - 1}
                            onClick={() => moveCommandDown(index, currentProgram.length)}
                          >
                            ↓
                          </button>
                        </div>
                        <span className="row-command-chip">{command.type}</span>
                        <div className="code-preview code-inline">{commandToText(command)}</div>
                        <button
                          className="small-btn danger row-delete"
                          type="button"
                          title="Quitar línea"
                          onClick={() => removeCommand(index)}
                        >
                          X
                        </button>
                      </div>

                      <div className="row-detailline">
                        {renderProgramField(
                          'TIPO',
                          <PixelSelect
                            title="Tipo"
                            value={command.type}
                            options={COMMAND_LIBRARY.map((item) => ({ value: item.type, label: item.type }))}
                            onChange={(selectedType) => {
                              const nextType = selectedType as CommandType
                              patchCommand(index, (next) => {
                                const reset = createCommandTemplate(nextType)
                                next.type = reset.type
                                next.dir = reset.dir
                                next.dirSource = reset.dirSource
                                next.dist = reset.dist
                                next.distSource = reset.distSource
                                next.label = reset.label
                                next.condition = reset.condition
                              })
                            }}
                          />,
                        )}

                        {(command.type === 'MOVER' || command.type === 'RAD') && (
                          renderProgramField(
                            'DIR',
                            <PixelSelect
                              title="DIR"
                              value={command.dir ?? 'N'}
                              options={DIRECTIONS.map((dir) => ({ value: dir, label: dir }))}
                              onChange={(selectedDir) => {
                                const dir = selectedDir as Direction
                                patchCommand(index, (next) => {
                                  next.dir = dir
                                })
                              }}
                            />,
                          )
                        )}

                        {command.type === 'DISPARAR' &&
                          renderProgramField(
                            'DIR',
                            <PixelSelect
                              title="DIR"
                              value={command.dirSource === 'RAD_DIR' ? 'RAD_DIR' : command.dir ?? 'N'}
                              options={SHOOT_DIRECTION_OPTIONS.map((option) => ({ value: option, label: option }))}
                              onChange={(value) => {
                                const selected = value as Direction | 'RAD_DIR'
                                patchCommand(index, (next) => {
                                  if (selected === 'RAD_DIR') {
                                    next.dirSource = selected as ShootDirectionSource
                                    return
                                  }

                                  next.dir = selected
                                  next.dirSource = 'VAL'
                                })
                              }}
                            />,
                          )}

                        {command.type === 'BOMBA' && (
                          <>
                            {renderProgramField(
                              'DIR',
                              <PixelSelect
                                title="DIR"
                                value={command.dirSource === 'RAD_DIR' ? 'RAD_DIR' : command.dir ?? 'N'}
                                options={SHOOT_DIRECTION_OPTIONS.map((option) => ({ value: option, label: option }))}
                                onChange={(value) => {
                                  const selected = value as Direction | 'RAD_DIR'
                                  patchCommand(index, (next) => {
                                    if (selected === 'RAD_DIR') {
                                      next.dirSource = selected as ShootDirectionSource
                                      return
                                    }

                                    next.dir = selected
                                    next.dirSource = 'VAL'
                                  })
                                }}
                              />,
                            )}

                            {renderProgramField(
                              'DIST',
                              <PixelSelect
                                title="Fuente de DIST"
                                value={bombDistSource}
                                options={DIST_SOURCE_OPTIONS.map((source) => ({
                                  value: source,
                                  label: source === 'RAD' ? '|RAD|' : source,
                                }))}
                                onChange={(value) => {
                                  const distSource = value as BombDistanceSource
                                  patchCommand(index, (next) => {
                                    next.distSource = distSource
                                  })
                                }}
                              />,
                            )}

                            {bombDistSource === 'VAL' && (
                              renderProgramField(
                                'VAL',
                                <div className="field-inline-control">
                                  <input
                                    className="symbol-input symbol-input-sm"
                                    title="DIST"
                                    type="number"
                                    min={1}
                                    max={config.gridSize}
                                    value={command.dist ?? 2}
                                    onChange={(event) => {
                                      const parsed = Number(event.target.value)
                                      const safeParsed = Number.isFinite(parsed) ? parsed : 1
                                      const dist = Math.min(config.gridSize, Math.max(1, safeParsed))
                                      patchCommand(index, (next) => {
                                        next.dist = dist
                                      })
                                    }}
                                  />
                                  <button
                                    className="small-btn field-quick-btn"
                                    type="button"
                                    title="Usar valor absoluto de RAD"
                                    onClick={() => {
                                      patchCommand(index, (next) => {
                                        next.distSource = 'RAD'
                                      })
                                    }}
                                  >
                                    |RAD|
                                  </button>
                                </div>,
                                'field-val',
                              )
                            )}
                          </>
                        )}

                        {command.type === 'LABEL' && (
                          renderProgramField(
                            'LABEL',
                            <input
                              className="symbol-input"
                              title="Nombre de la etiqueta"
                              type="text"
                              value={command.label ?? 'LOOP'}
                              onChange={(event) => {
                                patchCommand(index, (next) => {
                                  next.label = event.target.value.toUpperCase()
                                })
                              }}
                            />,
                          )
                        )}

                        {(command.type === 'IF' || command.type === 'JUMP') && (
                          <>
                            {renderProgramField(
                              'COND',
                              <PixelSelect
                                title="Condición"
                                value={condition.kind}
                                options={CONDITION_OPTIONS.map((option) => ({
                                  value: option.kind,
                                  label: option.label,
                                }))}
                                onChange={(value) => {
                                  const kind = value as ConditionKind
                                  patchCommand(index, (next) => {
                                    next.condition = createDefaultCondition(kind)
                                  })
                                }}
                              />,
                            )}

                            {condition.kind === 'REGISTER_COMPARE' && (
                              <>
                                {renderProgramField(
                                  'REG',
                                  <PixelSelect
                                    title="Registro"
                                    value={condition.register ?? 'RAD'}
                                    options={REGISTER_OPTIONS.map((register) => ({
                                      value: register,
                                      label: register,
                                    }))}
                                    onChange={(value) => {
                                      const register = value as NumericRegister
                                      patchCommand(index, (next) => {
                                        const current = getConditionForEditor(next.condition)
                                        next.condition = {
                                          ...(current.kind === 'REGISTER_COMPARE'
                                            ? current
                                            : createDefaultCondition('REGISTER_COMPARE')),
                                          register,
                                        }
                                      })
                                    }}
                                  />,
                                )}

                                {renderProgramField(
                                  'OP',
                                  <PixelSelect
                                    title="Operador"
                                    value={condition.operator ?? '>'}
                                    options={COMPARE_OPERATORS.map((operator) => ({
                                      value: operator,
                                      label: operator,
                                    }))}
                                    onChange={(value) => {
                                      const operator = value as CompareOperator
                                      patchCommand(index, (next) => {
                                        const current = getConditionForEditor(next.condition)
                                        next.condition = {
                                          ...(current.kind === 'REGISTER_COMPARE'
                                            ? current
                                            : createDefaultCondition('REGISTER_COMPARE')),
                                          operator,
                                        }
                                      })
                                    }}
                                  />,
                                )}

                                {renderProgramField(
                                  'VAL',
                                  <input
                                    className="symbol-input symbol-input-sm"
                                    title="Valor"
                                    type="number"
                                    value={condition.value ?? 0}
                                    onChange={(event) => {
                                      const parsed = Number(event.target.value)
                                      const value = Number.isFinite(parsed) ? parsed : 0
                                      patchCommand(index, (next) => {
                                        const current = getConditionForEditor(next.condition)
                                        next.condition = {
                                          ...(current.kind === 'REGISTER_COMPARE'
                                            ? current
                                            : createDefaultCondition('REGISTER_COMPARE')),
                                          value,
                                        }
                                      })
                                    }}
                                  />,
                                  'field-val',
                                )}
                              </>
                            )}

                            {condition.kind === 'DIR_MOV_EQ' && (
                              renderProgramField(
                                'DIRC',
                                <PixelSelect
                                  title="DIR"
                                  value={condition.dir ?? 'N'}
                                  options={DIRECTIONS.map((dir) => ({ value: dir, label: dir }))}
                                  onChange={(value) => {
                                    const dir = value as Direction
                                    patchCommand(index, (next) => {
                                      const current = getConditionForEditor(next.condition)
                                      next.condition = {
                                        ...(current.kind === 'DIR_MOV_EQ'
                                          ? current
                                          : createDefaultCondition('DIR_MOV_EQ')),
                                        dir,
                                      }
                                    })
                                  }}
                                />,
                              )
                            )}
                          </>
                        )}

                        {command.type === 'JUMP' && (
                          renderProgramField(
                            'LABEL',
                            <input
                              className="symbol-input"
                              title="Línea o LABEL a saltar"
                              type="text"
                              value={command.label ?? 'LOOP'}
                              onChange={(event) => {
                                patchCommand(index, (next) => {
                                  next.label = event.target.value.toUpperCase()
                                })
                              }}
                            />,
                          )
                        )}
                      </div>

                      {closesPreviousIf && (
                        <div className="if-end-marker" aria-label="ENDIF automático">
                          <span className="if-end-line" />
                          <span>ENDIF</span>
                        </div>
                      )}
                    </div>
                  </li>
                )
              })}
            </ul>
          </div>
        </div>
      </section>
    )
  }

  const renderGame = () => {
    return (
      <GameScreen
        gameState={gameState}
        running={running}
        animatePassiveLines={animatePassiveLines}
        onToggleRunning={() => setRunning((previous) => !previous)}
        onAnimatePassiveLinesChange={setAnimatePassiveLines}
        onRunSingleStep={runSingleStep}
        onRestart={askRestartSimulation}
        onBackToMenu={() => askReturnToMenu('game')}
        onTickMsChange={(tickMs) => {
          setConfig((previous) => ({ ...previous, tickMs }))
          setGameState((previous) =>
            previous ? { ...previous, config: { ...previous.config, tickMs } } : previous
          )
        }}
      />
    )
  }

  return (
    <>
      <main className="app-shell">
        {screen === 'menu' && renderMenu()}
        {screen === 'tutorial' && renderTutorial()}
        {screen === 'config' && renderConfig()}
        {screen === 'program' && renderProgramEditor()}
        {screen === 'game' && renderGame()}
      </main>

      {menuConfirmDialog && (
        <div className="confirm-overlay" role="dialog" aria-modal="true" aria-label={menuConfirmDialog.title}>
          <section className="panel confirm-panel">
            <h3>{menuConfirmDialog.title}</h3>
            <p>{menuConfirmDialog.message}</p>
            <div className="confirm-actions">
              <button className="pixel-btn secondary btn-with-icon" onClick={cancelReturnToMenu}>
                <span className="btn-icon"><PixelIcon color="#1f2937" grid={NAV_ICONS.cancel} /></span>
                <span>Cancelar</span>
              </button>
              <button className="pixel-btn danger btn-with-icon" onClick={confirmReturnToMenu}>
                <span className="btn-icon"><PixelIcon color="#ffffff" grid={NAV_ICONS.menu} /></span>
                <span>{menuConfirmDialog.confirmLabel}</span>
              </button>
            </div>
          </section>
        </div>
      )}

      {restartConfirmOpen && (
        <div className="confirm-overlay" role="dialog" aria-modal="true" aria-label="Reiniciar partida">
          <section className="panel confirm-panel">
            <h3>Reiniciar partida</h3>
            <p>Se reiniciará la partida actual desde cero. ¿Deseas continuar?</p>
            <div className="confirm-actions">
              <button className="pixel-btn secondary btn-with-icon" onClick={cancelRestartSimulation}>
                <span className="btn-icon"><PixelIcon color="#1f2937" grid={NAV_ICONS.cancel} /></span>
                <span>Cancelar</span>
              </button>
              <button className="pixel-btn danger btn-with-icon" onClick={confirmRestartSimulation}>
                <span className="btn-icon"><PixelIcon color="#ffffff" grid={NAV_ICONS.restart} /></span>
                <span>Reiniciar</span>
              </button>
            </div>
          </section>
        </div>
      )}
    </>
  )
}

export default App
