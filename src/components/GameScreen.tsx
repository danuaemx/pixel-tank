import { useEffect, useMemo, useState } from 'react'
import {
  cellKey,
  commandToText,
  getDisplayScore,
  type Direction,
  type GameState,
  type Tank,
} from '../game'
import { PixelIcon } from './PixelIcon'
import { PixelRange } from './PixelRange'

type GameScreenProps = {
  gameState: GameState | null
  running: boolean
  animatePassiveLines: boolean
  onToggleRunning: () => void
  onAnimatePassiveLinesChange: (enabled: boolean) => void
  onRunSingleStep: () => void
  onRestart: () => void
  onBackToMenu: () => void
  onTickMsChange: (tickMs: number) => void
}

function getTankDirection(tank: Tank): Direction {
  return tank.registers.DIR_MOV === 'NONE' ? 'N' : tank.registers.DIR_MOV
}

const CONTROL_ICONS = {
  play: ['#    ', '##   ', '###  ', '##   ', '#    '],
  pause: ['# #', '# #', '# #', '# #', '# #'],
  step: ['#   #', '##  #', '#####', '##  #', '#   #'],
  restart: [' ### ', '#   #', '## ##', '#   #', ' ### '],
  menu: ['#####', '     ', '#####', '     ', '#####'],
  speed: ['  #  ', ' ### ', '#   #', ' ### ', '  #  '],
  passive: ['#####', '# # #', '#####', '# # #', '#####'],
}

const SUMMARY_ICONS = {
  round: [' ### ', '#   #', '# # #', '#   #', ' ### '],
  turn: ['  #  ', ' ### ', '#####', ' ### ', '  #  '],
  alive: [' ### ', '#####', ' ### ', ' ### ', ' # # '],
  mines: ['  #  ', ' ### ', '#####', ' ### ', '  #  '],
  stations: ['  #  ', '  #  ', '#####', '  #  ', '  #  '],
  leader: [' ### ', '# # #', '# # #', '# # #', ' ### '],
}

export function GameScreen({
  gameState,
  running,
  animatePassiveLines,
  onToggleRunning,
  onAnimatePassiveLinesChange,
  onRunSingleStep,
  onRestart,
  onBackToMenu,
  onTickMsChange,
}: GameScreenProps) {
  const [animatedLineByTankId, setAnimatedLineByTankId] = useState<Record<string, number>>({})

  const ranking = useMemo(() => {
    if (!gameState) {
      return []
    }

    return [...gameState.tanks].sort((a, b) => getDisplayScore(b) - getDisplayScore(a))
  }, [gameState])

  const boardInfo = useMemo(() => {
    const tankMap = new Map<string, Tank>()
    const mineMap = new Map<string, true>()
    const stationMap = new Map<string, true>()
    const effectMap = new Map<string, Set<string>>()

    if (!gameState) {
      return { tankMap, mineMap, stationMap, effectMap }
    }

    gameState.tanks.forEach((tank) => {
      if (tank.alive) {
        tankMap.set(cellKey(tank.x, tank.y), tank)
      }
    })

    gameState.mines.forEach((mine) => {
      mineMap.set(cellKey(mine.x, mine.y), true)
    })

    gameState.stations.forEach((station) => {
      stationMap.set(cellKey(station.x, station.y), true)
    })

    gameState.effects.forEach((effect) => {
      const key = cellKey(effect.x, effect.y)
      const existing = effectMap.get(key) ?? new Set<string>()
      existing.add(effect.kind)
      effectMap.set(key, existing)
    })

    return { tankMap, mineMap, stationMap, effectMap }
  }, [gameState])

  useEffect(() => {
    if (!gameState) {
      return
    }

    const timers: number[] = []

    const clampLine = (line: number, programLength: number): number => {
      if (programLength <= 0) {
        return 0
      }
      return Math.min(programLength - 1, Math.max(0, line))
    }

    if (!animatePassiveLines) {
      setAnimatedLineByTankId((previous) => {
        const next = { ...previous }
        gameState.tanks.forEach((tank) => {
          next[tank.id] = clampLine(tank.lastExecutedIp, tank.program.length)
        })
        return next
      })
      return
    }

    gameState.tanks.forEach((tank) => {
      const rawTrace =
        tank.lastExecutionTrace && tank.lastExecutionTrace.length > 0
          ? tank.lastExecutionTrace
          : [tank.lastExecutedIp]
      const limitedTrace = rawTrace.slice(-32)
      const normalizedTrace = limitedTrace.map((line) => clampLine(line, tank.program.length))

      if (normalizedTrace.length <= 1) {
        const finalLine = normalizedTrace[0] ?? 0
        setAnimatedLineByTankId((previous) => ({ ...previous, [tank.id]: finalLine }))
        return
      }

      const animationBudget = Math.max(120, Math.min(420, Math.floor(gameState.config.tickMs * 0.75)))
      const stepMs = Math.max(35, Math.floor(animationBudget / normalizedTrace.length))

      normalizedTrace.forEach((line, index) => {
        const timeoutId = window.setTimeout(() => {
          setAnimatedLineByTankId((previous) => ({ ...previous, [tank.id]: line }))
        }, index * stepMs)

        timers.push(timeoutId)
      })
    })

    return () => {
      timers.forEach((timeoutId) => window.clearTimeout(timeoutId))
    }
  }, [animatePassiveLines, gameState])

  if (!gameState) {
    return (
      <section className="panel">
        <p>No hay partida activa.</p>
        <div className="inline-actions">
          <button className="pixel-btn" onClick={onBackToMenu}>
            Ir al menú
          </button>
        </div>
      </section>
    )
  }

  const size = gameState.config.gridSize
  const aliveTanks = gameState.tanks.filter((tank) => tank.alive).length
  const currentTurn =
    ((gameState.turnIndex % gameState.tanks.length) + gameState.tanks.length) % gameState.tanks.length + 1
  const leader = ranking[0]

  return (
    <div className="game-fullscreen">
      <div className="game-summary-head panel">
        <div className="summary-head-row">
          <div className="summary-line">
            <span className="summary-chip" title="Ronda">
              <PixelIcon color="#fcd34d" grid={SUMMARY_ICONS.round} />
              <strong>{gameState.round}</strong>
            </span>
            <span className="summary-chip" title="Turno">
              <PixelIcon color="#38bdf8" grid={SUMMARY_ICONS.turn} />
              <strong>{currentTurn}</strong>
            </span>
            <span className="summary-chip" title="Activos">
              <PixelIcon color="#ef4444" grid={SUMMARY_ICONS.alive} />
              <strong>{aliveTanks}/{gameState.tanks.length}</strong>
            </span>
            <span className="summary-chip" title="Minas">
              <PixelIcon color="#facc15" grid={SUMMARY_ICONS.mines} />
              <strong>{gameState.mines.length}</strong>
            </span>
            <span className="summary-chip" title="Estaciones">
              <PixelIcon color="#4ade80" grid={SUMMARY_ICONS.stations} />
              <strong>{gameState.stations.length}</strong>
            </span>
            <span className="summary-chip" title="Líder">
              <PixelIcon color="#f472b6" grid={SUMMARY_ICONS.leader} />
              {leader ? <span className="summary-dot" style={{ backgroundColor: leader.color }} /> : <span className="summary-dot" />}
              <strong>{leader ? getDisplayScore(leader) : '-'}</strong>
            </span>
          </div>

          <div className="summary-actions">
            <button
              className="pixel-btn top-control-btn"
              title={running ? 'Pausar simulación' : 'Continuar simulación'}
              aria-label={running ? 'Pausar simulación' : 'Continuar simulación'}
              disabled={gameState.finished}
              onClick={onToggleRunning}
            >
              <PixelIcon color="#064e3b" grid={running ? CONTROL_ICONS.pause : CONTROL_ICONS.play} />
            </button>
            <button
              className="pixel-btn top-control-btn"
              title="Ejecutar un paso"
              aria-label="Ejecutar un paso"
              disabled={running || gameState.finished}
              onClick={onRunSingleStep}
            >
              <PixelIcon color="#064e3b" grid={CONTROL_ICONS.step} />
            </button>
            <button className="pixel-btn top-control-btn" title="Reiniciar simulación" aria-label="Reiniciar simulación" onClick={onRestart}>
              <PixelIcon color="#064e3b" grid={CONTROL_ICONS.restart} />
            </button>
            <button className="pixel-btn top-control-btn" title="Volver al menú" aria-label="Volver al menú" onClick={onBackToMenu}>
              <PixelIcon color="#064e3b" grid={CONTROL_ICONS.menu} />
            </button>
            <div className="speed-control-top" title={`Velocidad: ${gameState.config.tickMs}ms`}>
              <PixelIcon color="#fff" grid={CONTROL_ICONS.speed} />
              <PixelRange
                className="speed-range-control"
                ariaLabel="Velocidad de simulación"
                value={gameState.config.tickMs}
                min={180}
                max={1400}
                step={20}
                onChange={onTickMsChange}
              />
            </div>
            <label className="tips-toggle game-passive-toggle" title="Animar ejecución de líneas pasivas">
              <input
                type="checkbox"
                checked={animatePassiveLines}
                aria-label="Animar líneas pasivas"
                onChange={(event) => onAnimatePassiveLinesChange(event.target.checked)}
              />
              <span className="tips-toggle-track">
                <span className="tips-toggle-thumb" />
              </span>
              <span className="tips-toggle-icon">
                <PixelIcon color={animatePassiveLines ? '#fcd34d' : '#94a3b8'} grid={CONTROL_ICONS.passive} />
              </span>
            </label>
          </div>
        </div>
      </div>

      <div className="game-main-layout">
        <div className="board-container">
          <div className="board" style={{ gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))` }}>
            {Array.from({ length: size * size }, (_, index) => {
              const x = index % size
              const y = Math.floor(index / size)
              const key = cellKey(x, y)

              const classes = ['board-cell']
              if (gameState.walls.has(key)) classes.push('is-wall')
              if (boardInfo.mineMap.has(key)) classes.push('has-mine')
              if (boardInfo.stationMap.has(key)) classes.push('has-station')

              const effects = boardInfo.effectMap.get(key)
              if (effects?.has('move')) classes.push('fx-move')
              if (effects?.has('shot')) classes.push('fx-shot')
              if (effects?.has('explosion')) classes.push('fx-explosion')
              if (effects?.has('heal')) classes.push('fx-heal')
              if (effects?.has('mine')) classes.push('fx-mine')
              if (effects?.has('hit')) classes.push('fx-hit')

              const tank = boardInfo.tankMap.get(key)

              return (
                <div key={key} className={classes.join(' ')}>
                  {gameState.walls.has(key) && <div className="tile-wall" />}
                  {boardInfo.stationMap.has(key) && <div className="tile-station">+</div>}
                  {boardInfo.mineMap.has(key) && <div className="tile-mine">*</div>}
                  {tank && (
                    <div
                      className="tile-tank"
                      data-dir={getTankDirection(tank)}
                      style={{ '--tank-color': tank.color } as React.CSSProperties}
                    >
                      <div className="tank-turret" />
                      <div className="tank-barrel" />
                      <span className="tank-name">{tank.name}</span>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        <div className="game-sidebar panel">
          <div className="right-panel">
            <div className="log-panel">
              <h3>Eventos</h3>
              <ul>
                {gameState.log.slice(0, 16).map((entry, index) => (
                  <li key={`${entry}-${index}`}>{entry}</li>
                ))}
              </ul>
            </div>

            <div className="score-list">
              {gameState.tanks.map((tank) => {
                const finalLine =
                  tank.program.length === 0
                    ? 0
                    : Math.min(tank.program.length - 1, Math.max(0, tank.lastExecutedIp))

                const activeLine =
                  animatePassiveLines && animatedLineByTankId[tank.id] !== undefined
                    ? Math.min(
                        tank.program.length > 0 ? tank.program.length - 1 : 0,
                        Math.max(0, animatedLineByTankId[tank.id] ?? finalLine),
                      )
                    : finalLine

                return (
                  <article key={tank.id} className={`score-card ${tank.alive ? '' : 'dead'}`}>
                  <header>
                    <span className="dot" style={{ backgroundColor: tank.color }} />
                    <strong>{tank.name}</strong>
                  </header>
                  <div className="tank-stats">
                    <span className="stat-chip">
                      <PixelIcon color="#ef4444" grid={[' ### ', '#####', ' ### ', ' ### ', ' # # ']} /> {Math.max(0, Math.round(tank.health))}
                    </span>
                    <span className="stat-chip">
                      <PixelIcon color="#ef4444" grid={['#   #', ' # # ', '  #  ', ' # # ', '#   #']} /> {tank.kills}
                    </span>
                    <span className="stat-chip">
                      <PixelIcon color="#ef4444" grid={['#   #', ' # # ', '  #  ', ' ### ', '#####', ' ### ', '  #  ']} /> {tank.bombsLeft}
                    </span>
                    <span className="stat-chip">
                      <PixelIcon color="#facc15" grid={['  #  ', ' ### ', '#####', ' ### ', '  #  ']} /> {tank.minesLeft}
                    </span>
                    <span className="stat-chip">
                      <PixelIcon color="#4ade80" grid={['  #  ', ' # # ', '#   #', '  #  ', '  #  ', '  #  ', ' ### ']} /> {tank.registers.RAD}
                    </span>
                    <span className="stat-chip">
                      <PixelIcon color="#22d3ee" grid={[' ### ', '#   #', '# # #', '#   #', ' ### ']} /> {tank.registers.RAD_DIR}
                    </span>
                    <span className="stat-chip">
                      <PixelIcon color="#38bdf8" grid={['  #  ', ' # # ', '  #  ', '  #  ', '  #  ']} /> {tank.registers.DANO_DIR}
                    </span>
                    <span className="stat-chip">
                      <PixelIcon color="#a78bfa" grid={['  #  ', ' ### ', '#####', ' ### ', '  #  ', '  #  ', '  #  ']} /> {tank.registers.DIR_MOV}
                    </span>
                    <span className="stat-chip">
                      <PixelIcon color="#fcd34d" grid={[' ### ', ' # # ', ' ### ', '  #  ', '  #  ']} /> {getDisplayScore(tank)}
                    </span>
                  </div>
                  <div className="tank-terminal">
                    <h4>Ejecución [Línea: {activeLine + 1}]</h4>
                    <pre className="terminal-output">
                      {tank.program.length === 0 ? (
                        <div className="terminal-line error">Sin programa...</div>
                      ) : (
                        tank.program.map((cmd, idx) => {
                          let start = Math.max(0, activeLine - 2)
                          let end = Math.min(tank.program.length - 1, start + 4)
                          if (end - start < 4) {
                            start = Math.max(0, end - 4)
                          }
                          const show = idx >= start && idx <= end

                          if (!show) return null
                          return (
                            <div key={idx} className={`terminal-line ${idx === activeLine ? 'active' : ''}`}>
                              <span className="line-num">{idx + 1}</span> {commandToText(cmd)}
                            </div>
                          )
                        })
                      )}
                    </pre>
                  </div>
                  </article>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {gameState.finished && (
        <div className="result-box">
          <h3>Resultado final</h3>
          <ol>
            {ranking.map((tank) => (
              <li key={`rank-${tank.id}`}>
                {tank.name}: {getDisplayScore(tank)} pts
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  )
}
