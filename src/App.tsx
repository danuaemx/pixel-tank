import { useEffect, useRef, useState } from 'react'
import './App.css'
import { chiptuneAudio } from './audio'
import {
  DEFAULT_MASTER_VOLUME,
  DEFAULT_UI_FONT_SIZE,
  NAV_ICONS,
} from './app/_const'
import type { DragPayload, GameMusicTheme, MenuConfirmSource, Screen } from './app/types'
import {
  getConditionForEditor,
  getReturnToMenuDialog,
  getUiSoundForButton,
  sanitizeMasterVolume,
  sanitizeUiFontSize,
} from './app/utils'
import { ConfigScreen } from './app/screens/ConfigScreen'
import { MenuScreen } from './app/screens/MenuScreen'
import { ProgramEditorScreen } from './app/screens/ProgramEditorScreen'
import { TutorialScreen } from './app/screens/TutorialScreen'
import { GameScreen } from './components/GameScreen'
import { PixelIcon } from './components/PixelIcon'
import {
  advanceGame,
  createCommandTemplate,
  createDefaultConfig,
  createDefaultPrograms,
  createInitialGameState,
  MAX_BOMBS_PER_TANK,
  MAX_MAX_ROUNDS,
  MAX_MINES_PER_TANK,
  MIN_BOMBS_PER_TANK,
  MIN_MAX_ROUNDS,
  MIN_MINES_PER_TANK,
  normalizeProgramsForPlayers,
  type Command,
  type CommandType,
  type Condition,
  type GameConfig,
  type GameState,
} from './game'

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

  const updateMaxRounds = (value: number): void => {
    const maxRounds = Math.min(MAX_MAX_ROUNDS, Math.max(MIN_MAX_ROUNDS, value))
    setConfig((previous) => ({ ...previous, maxRounds }))
  }

  const updateBombsPerTank = (value: number): void => {
    const bombsPerTank = Math.min(MAX_BOMBS_PER_TANK, Math.max(MIN_BOMBS_PER_TANK, value))
    setConfig((previous) => ({ ...previous, bombsPerTank }))
  }

  const updateMinesPerTank = (value: number): void => {
    const minesPerTank = Math.min(MAX_MINES_PER_TANK, Math.max(MIN_MINES_PER_TANK, value))
    setConfig((previous) => ({ ...previous, minesPerTank }))
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
      <MenuScreen
        onQuickStart={() => startSimulation(true)}
        onOpenConfig={() => setScreen('config')}
        onOpenProgram={() => setScreen('program')}
        onOpenTutorial={() => setScreen('tutorial')}
      />
    )
  }

  const renderTutorial = () => {
    return <TutorialScreen onBackToMenu={() => askReturnToMenu('tutorial')} />
  }

  const renderConfig = () => {
    return (
      <ConfigScreen
        config={config}
        uiFontSize={uiFontSize}
        masterVolume={masterVolume}
        renderConfigStepper={renderConfigStepper}
        updatePlayers={updatePlayers}
        updateGridSize={updateGridSize}
        updatePassiveLimit={updatePassiveLimit}
        updateMaxRounds={updateMaxRounds}
        updateBombsPerTank={updateBombsPerTank}
        updateMinesPerTank={updateMinesPerTank}
        updateUiFontSize={updateUiFontSize}
        updateMasterVolume={updateMasterVolume}
        applyDefaultSetup={applyDefaultSetup}
        onOpenProgram={() => setScreen('program')}
        onStartSimulation={() => startSimulation(false)}
        onBack={() => askReturnToMenu('config')}
      />
    )
  }

  const renderProgramEditor = () => {
    return (
      <ProgramEditorScreen
        config={config}
        selectedTank={selectedTank}
        currentProgram={currentProgram}
        showProgramTips={showProgramTips}
        recentlyAddedCommandId={recentlyAddedCommandId}
        dragPayload={dragPayload}
        programAreaRef={programAreaRef}
        setShowProgramTips={setShowProgramTips}
        setSelectedTank={setSelectedTank}
        setDragPayload={setDragPayload}
        addCommandByClick={addCommandByClick}
        moveCommandUp={moveCommandUp}
        moveCommandDown={moveCommandDown}
        removeCommand={removeCommand}
        handleDropAt={handleDropAt}
        patchCommand={patchCommand}
        getCondition={getCondition}
        getIfDependencyDepth={getIfDependencyDepth}
        renderProgramField={renderProgramField}
        onBackToConfig={() => setScreen('config')}
        onStartSimulation={() => startSimulation(false)}
        onBackToMenu={() => askReturnToMenu('program')}
      />
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
