import { commandToText, getDisplayScore } from '../../game'
import { PixelIcon } from '../PixelIcon'
import { COMMAND_LOGOS, SCORE_STAT_ICONS } from './_const'
import { getActiveLine } from './helpers'
import type { SidebarProps } from './types'

export function Sidebar({ gameState, animatePassiveLines, animatedLineByTankId }: SidebarProps) {
  return (
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
            const isActingTank = gameState.lastActorId === tank.id
            const actionLogo = COMMAND_LOGOS[tank.lastCommandType]
            const activeLine = getActiveLine(
              tank,
              animatePassiveLines && isActingTank,
              animatedLineByTankId[tank.id],
            )

            return (
              <article key={tank.id} className={`score-card ${tank.alive ? '' : 'dead'} ${isActingTank ? 'is-acting' : ''}`}>
                <header>
                  <span className="dot" style={{ backgroundColor: tank.color }} />
                  <strong>{tank.name}</strong>
                  {isActingTank && actionLogo && (
                    <span className="score-action-logo" title={tank.lastAction}>
                      <PixelIcon color={actionLogo.color} grid={actionLogo.grid} />
                    </span>
                  )}
                </header>
                <div className="tank-stats">
                  <span className="stat-chip">
                    <PixelIcon color={SCORE_STAT_ICONS.health.color} grid={SCORE_STAT_ICONS.health.grid} /> {Math.max(0, Math.round(tank.health))}
                  </span>
                  <span className="stat-chip">
                    <PixelIcon color={SCORE_STAT_ICONS.kills.color} grid={SCORE_STAT_ICONS.kills.grid} /> {tank.kills}
                  </span>
                  <span className="stat-chip">
                    <PixelIcon color={SCORE_STAT_ICONS.bombs.color} grid={SCORE_STAT_ICONS.bombs.grid} /> {tank.bombsLeft}
                  </span>
                  <span className="stat-chip">
                    <PixelIcon color={SCORE_STAT_ICONS.mines.color} grid={SCORE_STAT_ICONS.mines.grid} /> {tank.minesLeft}
                  </span>
                  <span className="stat-chip">
                    <PixelIcon color={SCORE_STAT_ICONS.rad.color} grid={SCORE_STAT_ICONS.rad.grid} /> {tank.registers.RAD}
                  </span>
                  <span className="stat-chip">
                    <PixelIcon color={SCORE_STAT_ICONS.radDir.color} grid={SCORE_STAT_ICONS.radDir.grid} /> {tank.registers.RAD_DIR}
                  </span>
                  <span className="stat-chip">
                    <PixelIcon color={SCORE_STAT_ICONS.danoDir.color} grid={SCORE_STAT_ICONS.danoDir.grid} /> {tank.registers.DANO_DIR}
                  </span>
                  <span className="stat-chip">
                    <PixelIcon color={SCORE_STAT_ICONS.dirMov.color} grid={SCORE_STAT_ICONS.dirMov.grid} /> {tank.registers.DIR_MOV}
                  </span>
                  <span className="stat-chip">
                    <PixelIcon color={SCORE_STAT_ICONS.score.color} grid={SCORE_STAT_ICONS.score.grid} /> {getDisplayScore(tank)}
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
  )
}
