import { cellKey, type Direction, type GameState, type Tank } from '../../game'

export type BoardInfo = {
  tankMap: Map<string, Tank>
  mineMap: Map<string, true>
  stationMap: Map<string, true>
  effectMap: Map<string, Set<string>>
}

export function getTankDirection(tank: Tank): Direction {
  return tank.registers.DIR_MOV === 'NONE' ? 'N' : tank.registers.DIR_MOV
}

export function buildBoardInfo(gameState: GameState | null): BoardInfo {
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
}

export function clampProgramLine(line: number, programLength: number): number {
  if (programLength <= 0) {
    return 0
  }
  return Math.min(programLength - 1, Math.max(0, line))
}

export function getCurrentTurn(gameState: GameState): number {
  return ((gameState.turnIndex % gameState.tanks.length) + gameState.tanks.length) % gameState.tanks.length + 1
}

export function getActiveLine(tank: Tank, animatePassiveLines: boolean, animatedLine: number | undefined): number {
  const finalLine = tank.program.length === 0 ? 0 : Math.min(tank.program.length - 1, Math.max(0, tank.lastExecutedIp))

  if (!animatePassiveLines || animatedLine === undefined) {
    return finalLine
  }

  return Math.min(
    tank.program.length > 0 ? tank.program.length - 1 : 0,
    Math.max(0, animatedLine),
  )
}
