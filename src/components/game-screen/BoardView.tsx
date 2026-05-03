import { cellKey } from '../../game'
import { getPublicAssetUrl } from '../../app/utils'
import { PixelIcon } from '../PixelIcon'
import { COMMAND_LOGOS } from './_const'
import { getTankDirection } from './helpers'
import type { BoardProps } from './types'

export function BoardView({ gameState, boardInfo }: BoardProps) {
  const size = gameState.config.gridSize

  return (
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
          const explosionSvg = effects?.has('explosion-bomb')
            ? getPublicAssetUrl('effects/explosion-bomb.svg')
            : effects?.has('explosion-mine')
              ? getPublicAssetUrl('effects/explosion-mine.svg')
              : effects?.has('explosion-shot')
                ? getPublicAssetUrl('effects/explosion-shot.svg')
                : effects?.has('explosion')
                  ? getPublicAssetUrl('effects/explosion-impact.svg')
                  : null
          if (explosionSvg) classes.push('fx-explosion')
          if (effects?.has('heal')) classes.push('fx-heal')
          if (effects?.has('mine')) classes.push('fx-mine')
          if (effects?.has('hit')) classes.push('fx-hit')

          const tank = boardInfo.tankMap.get(key)
          const isActingTank = Boolean(tank && gameState.lastActorId && tank.id === gameState.lastActorId)
          const actingLogo = tank ? COMMAND_LOGOS[tank.lastCommandType] : undefined

          return (
            <div key={key} className={classes.join(' ')}>
              {gameState.walls.has(key) && <div className="tile-wall" />}
              {boardInfo.stationMap.has(key) && <div className="tile-station" aria-label="Estación de salud" />}
              {boardInfo.mineMap.has(key) && (
                <div className="tile-mine">
                  <img src={getPublicAssetUrl('effects/mine-advanced.svg')} alt="" aria-hidden="true" />
                </div>
              )}
              {tank && (
                <>
                  <div
                    className={`tile-tank ${isActingTank ? 'is-acting' : ''}`}
                    data-dir={getTankDirection(tank)}
                    style={{ '--tank-color': tank.color } as React.CSSProperties}
                  >
                    <div className="tank-turret" />
                    <div className="tank-barrel" />
                    <span className="tank-name">{tank.name}</span>
                  </div>
                  {isActingTank && actingLogo && (
                    <div className="tank-action-logo" title={tank.lastAction}>
                      <PixelIcon color={actingLogo.color} grid={actingLogo.grid} />
                    </div>
                  )}
                </>
              )}
              {explosionSvg && (
                <div className="tile-effect-svg fx-explosion-svg">
                  <img src={explosionSvg} alt="" aria-hidden="true" />
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
