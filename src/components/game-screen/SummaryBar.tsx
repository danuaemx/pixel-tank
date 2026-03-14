import { PixelIcon } from '../PixelIcon'
import { PixelRange } from '../PixelRange'
import { getDisplayScore } from '../../game'
import { CONTROL_ICONS, SUMMARY_ICONS } from './_const'
import type { SummaryBarProps } from './types'

export function SummaryBar({
  gameState,
  running,
  animatePassiveLines,
  aliveTanks,
  currentTurn,
  leader,
  onToggleRunning,
  onAnimatePassiveLinesChange,
  onRunSingleStep,
  onRestart,
  onBackToMenu,
  onTickMsChange,
}: SummaryBarProps) {
  return (
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
  )
}
