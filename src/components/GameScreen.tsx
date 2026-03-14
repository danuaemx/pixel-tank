import { useEffect, useMemo, useState } from 'react'
import { getDisplayScore } from '../game'
import { BoardView } from './game-screen/BoardView'
import { Sidebar } from './game-screen/Sidebar'
import { SummaryBar } from './game-screen/SummaryBar'
import { buildBoardInfo, clampProgramLine, getCurrentTurn } from './game-screen/helpers'
import type { GameScreenProps } from './game-screen/types'

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

  const boardInfo = useMemo(() => buildBoardInfo(gameState), [gameState])

  useEffect(() => {
    if (!gameState) {
      return
    }

    const timers: number[] = []

    const actingTank =
      gameState.lastActorId !== null
        ? gameState.tanks.find((tank) => tank.id === gameState.lastActorId)
        : undefined

    if (!actingTank) {
      return
    }

    if (!animatePassiveLines) {
      setAnimatedLineByTankId((previous) => ({
        ...previous,
        [actingTank.id]: clampProgramLine(actingTank.lastExecutedIp, actingTank.program.length),
      }))
      return
    }

    const rawTrace =
      actingTank.lastExecutionTrace && actingTank.lastExecutionTrace.length > 0
        ? actingTank.lastExecutionTrace
        : [actingTank.lastExecutedIp]
    const limitedTrace = rawTrace.slice(-32)
    const normalizedTrace = limitedTrace.map((line) => clampProgramLine(line, actingTank.program.length))

    if (normalizedTrace.length <= 1) {
      const finalLine = normalizedTrace[0] ?? 0
      setAnimatedLineByTankId((previous) => ({ ...previous, [actingTank.id]: finalLine }))
      return
    }

    const animationBudget = Math.max(120, Math.min(420, Math.floor(gameState.config.tickMs * 0.75)))
    const stepMs = Math.max(35, Math.floor(animationBudget / normalizedTrace.length))

    normalizedTrace.forEach((line, index) => {
      const timeoutId = window.setTimeout(() => {
        setAnimatedLineByTankId((previous) => ({ ...previous, [actingTank.id]: line }))
      }, index * stepMs)

      timers.push(timeoutId)
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

  const aliveTanks = gameState.tanks.filter((tank) => tank.alive).length
  const currentTurn = getCurrentTurn(gameState)
  const leader = ranking[0]

  return (
    <div className="game-fullscreen">
      <SummaryBar
        gameState={gameState}
        running={running}
        animatePassiveLines={animatePassiveLines}
        aliveTanks={aliveTanks}
        currentTurn={currentTurn}
        leader={leader}
        onToggleRunning={onToggleRunning}
        onAnimatePassiveLinesChange={onAnimatePassiveLinesChange}
        onRunSingleStep={onRunSingleStep}
        onRestart={onRestart}
        onBackToMenu={onBackToMenu}
        onTickMsChange={onTickMsChange}
      />

      <div className="game-main-layout">
        <BoardView gameState={gameState} boardInfo={boardInfo} />
        <Sidebar
          gameState={gameState}
          animatePassiveLines={animatePassiveLines}
          animatedLineByTankId={animatedLineByTankId}
        />
      </div>

      {gameState.finished && (
        <div className="result-box">
          <h3 className="result-title">
            <img src="/effects/trophy.svg" alt="" aria-hidden="true" />
            <span>Resultado final</span>
          </h3>
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
