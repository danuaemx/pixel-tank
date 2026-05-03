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
  const minTickMs = 180
  const maxTickMs = 1400
  const speedSliderValue = Math.min(maxTickMs, Math.max(minTickMs, maxTickMs + minTickMs - gameState.config.tickMs))
  const speedPercent = Math.round(((speedSliderValue - minTickMs) / (maxTickMs - minTickMs)) * 100)

  return (
    <div className="game-summary-head panel">
      <div className="summary-head-row">
        <div className="summary-line">
          <span className="summary-chip" title="Ronda">
            <PixelIcon color="#fcd34d" grid={SUMMARY_ICONS.round} />
            <span className="summary-chip-label">Ronda</span>
            <strong>{gameState.round}</strong>
          </span>
          <span className="summary-chip" title="Turno">
            <PixelIcon color="#38bdf8" grid={SUMMARY_ICONS.turn} />
            <span className="summary-chip-label">Turno</span>
            <strong>{currentTurn}</strong>
          </span>
          <span className="summary-chip" title="Activos">
            <PixelIcon color="#ef4444" grid={SUMMARY_ICONS.alive} />
            <span className="summary-chip-label">Activos</span>
            <strong>{aliveTanks}/{gameState.tanks.length}</strong>
          </span>
          <span className="summary-chip" title="Minas">
            <PixelIcon color="#facc15" grid={SUMMARY_ICONS.mines} />
            <span className="summary-chip-label">Minas</span>
            <strong>{gameState.mines.length}</strong>
          </span>
          <span className="summary-chip" title="Estaciones">
            <PixelIcon color="#4ade80" grid={SUMMARY_ICONS.stations} />
            <span className="summary-chip-label">Estaciones</span>
            <strong>{gameState.stations.length}</strong>
          </span>
          <span className="summary-chip" title="Líder">
            <PixelIcon color="#f472b6" grid={SUMMARY_ICONS.leader} />
            <span className="summary-chip-label">Líder</span>
            {leader ? <span className="summary-dot" style={{ backgroundColor: leader.color }} /> : <span className="summary-dot" />}
            <strong>{leader ? getDisplayScore(leader) : '-'}</strong>
          </span>
        </div>

        <div className="summary-actions">
          <button
            className="pixel-btn top-control-btn"
            title={running ? 'Modo automático (clic para pasar a paso a paso)' : 'Modo paso a paso (clic para continuar automático)'}
            aria-label={running ? 'Modo automático activo' : 'Modo paso a paso activo'}
            disabled={gameState.finished}
            onClick={onToggleRunning}
          >
            <PixelIcon color="#064e3b" grid={running ? CONTROL_ICONS.auto : CONTROL_ICONS.manual} />
            <span className="top-control-label">{running ? 'Automático' : 'Paso a paso'}</span>
          </button>
          <button
            className="pixel-btn top-control-btn"
            title="Ejecutar un paso (avance manual)"
            aria-label="Ejecutar un paso"
            disabled={running || gameState.finished}
            onClick={onRunSingleStep}
          >
            <PixelIcon color="#064e3b" grid={CONTROL_ICONS.step} />
            <span className="top-control-label">Paso</span>
          </button>
          <button className="pixel-btn top-control-btn" title="Reiniciar simulación" aria-label="Reiniciar simulación" onClick={onRestart}>
            <PixelIcon color="#064e3b" grid={CONTROL_ICONS.restart} />
            <span className="top-control-label">Reiniciar</span>
          </button>
          <button className="pixel-btn top-control-btn" title="Volver al menú principal" aria-label="Volver al menú principal" onClick={onBackToMenu}>
            <PixelIcon color="#064e3b" grid={CONTROL_ICONS.menu} />
            <span className="top-control-label">Menú</span>
          </button>
          <div className="speed-control-top" title={`Velocidad: ${speedPercent}% (${gameState.config.tickMs}ms)`}>
            <span className="speed-control-label">Velocidad</span>
            <span className="speed-control-icon" aria-hidden="true">
              <PixelIcon color="#fcd34d" grid={CONTROL_ICONS.speed} />
            </span>
            <PixelRange
              className="speed-range-control"
              ariaLabel="Velocidad de simulación (izquierda lento, derecha rápido)"
              value={speedSliderValue}
              min={minTickMs}
              max={maxTickMs}
              step={20}
              onChange={(nextSpeedValue) => onTickMsChange(maxTickMs + minTickMs - nextSpeedValue)}
            />
          </div>
          <label className="tips-toggle game-passive-toggle" title="Mostrar detalle de ejecución">
            <input
              type="checkbox"
              checked={animatePassiveLines}
              aria-label="Mostrar detalle de ejecución"
              onChange={(event) => onAnimatePassiveLinesChange(event.target.checked)}
            />
            <span className="tips-toggle-track">
              <span className="tips-toggle-thumb" />
            </span>
            <span className="tips-toggle-icon">
              <PixelIcon color={animatePassiveLines ? '#fcd34d' : '#94a3b8'} grid={CONTROL_ICONS.passive} />
            </span>
            <span className="toggle-caption">Detalle</span>
          </label>
        </div>
      </div>
    </div>
  )
}
