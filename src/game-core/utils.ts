import type {
  Command,
  CompareOperator,
  Condition,
  Direction,
  GameState,
  NumericRegister,
  Tank,
} from './types'

let idCounter = 0

export function createId(prefix: string): string {
  idCounter += 1
  return `${prefix}-${idCounter}`
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

export function inBounds(size: number, x: number, y: number): boolean {
  return x >= 0 && y >= 0 && x < size && y < size
}

export function opposite(dir: Direction): Direction {
  if (dir === 'N') return 'S'
  if (dir === 'S') return 'N'
  if (dir === 'E') return 'O'
  return 'E'
}

export function nextIndex(current: number, length: number, step = 1): number {
  if (length <= 0) {
    return 0
  }
  const mod = (current + step) % length
  return mod < 0 ? mod + length : mod
}

export function cellKey(x: number, y: number): string {
  return `${x},${y}`
}

export function keyToPoint(key: string): { x: number; y: number } {
  const [xRaw, yRaw] = key.split(',')
  return {
    x: Number(xRaw),
    y: Number(yRaw),
  }
}

function getNumericRegisterValue(tank: Tank, register: NumericRegister): number {
  if (register === 'RAD') {
    return tank.registers.RAD
  }
  return tank.registers.SALUD
}

function compareRegisterValues(left: number, operator: CompareOperator, right: number): boolean {
  switch (operator) {
    case '<=':
      return left <= right
    case '<':
      return left < right
    case '>':
      return left > right
    case '>=':
      return left >= right
    case '==':
    default:
      return left === right
  }
}

export function resolveBombDistance(command: Command, tank: Tank, gridSize: number): number {
  let rawDistance: number

  if (command.distSource === 'RAD') {
    rawDistance = Math.abs(tank.registers.RAD)
  } else if (command.distSource === 'SALUD') {
    rawDistance = tank.registers.SALUD
  } else {
    rawDistance = command.dist ?? 2
  }

  if (!Number.isFinite(rawDistance)) {
    return 1
  }

  return clamp(Math.round(Math.abs(rawDistance)), 1, gridSize)
}

export function resolveCommandDirection(command: Command, tank: Tank): Direction {
  if (command.dirSource === 'RAD_DIR') {
    return tank.registers.RAD_DIR === 'NONE' ? (command.dir ?? 'N') : tank.registers.RAD_DIR
  }

  return command.dir ?? 'N'
}

export function evaluateCondition(condition: Condition | undefined, tank: Tank): boolean {
  const safeCondition: Condition = condition ?? { kind: 'TRUE' }

  switch (safeCondition.kind) {
    case 'TRUE':
      return true
    case 'REGISTER_COMPARE': {
      const register = safeCondition.register ?? 'RAD'
      const operator = safeCondition.operator ?? '=='
      const comparedValue = safeCondition.value ?? 0
      const registerValue = getNumericRegisterValue(tank, register)
      return compareRegisterValues(registerValue, operator, comparedValue)
    }
    case 'DAÑO':
      return tank.registers.DANO_DIR !== 'NONE'
    case 'DIR_MOV_EQ':
      return tank.registers.DIR_MOV === (safeCondition.dir ?? 'N')
    default:
      return false
  }
}

export function getLabelMap(program: Command[]): Map<string, number> {
  const labelMap = new Map<string, number>()

  program.forEach((command, index) => {
    if (command.type === 'LABEL' && command.label) {
      labelMap.set(command.label.trim().toUpperCase(), index)
    }
  })

  return labelMap
}

export function pickRandomFreeCell(size: number, occupied: Set<string>): { x: number; y: number } | null {
  const freeCells: string[] = []

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const key = cellKey(x, y)
      if (!occupied.has(key)) {
        freeCells.push(key)
      }
    }
  }

  if (freeCells.length === 0) {
    return null
  }

  const randomKey = freeCells[Math.floor(Math.random() * freeCells.length)]
  return keyToPoint(randomKey)
}

export function conditionToText(condition: Condition | undefined): string {
  const safeCondition = condition ?? { kind: 'TRUE' as const }

  if (safeCondition.kind === 'REGISTER_COMPARE') {
    const register = safeCondition.register ?? 'RAD'
    const operator = safeCondition.operator ?? '=='
    const value = safeCondition.value ?? 0
    return `${register} ${operator} ${value}`
  }

  if (safeCondition.kind === 'DIR_MOV_EQ') {
    return `DIR_MOV == ${safeCondition.dir ?? 'N'}`
  }

  if (safeCondition.kind === 'DAÑO') {
    return 'DAÑO_DIR != NONE'
  }

  return 'TRUE'
}

export function getTankAt(state: GameState, x: number, y: number, excludeTankId?: string): number {
  return state.tanks.findIndex((tank) => {
    if (!tank.alive) return false
    if (excludeTankId && tank.id === excludeTankId) return false
    return tank.x === x && tank.y === y
  })
}

export function getStationAt(state: GameState, x: number, y: number): number {
  return state.stations.findIndex((station) => station.x === x && station.y === y)
}

export function getMineAt(state: GameState, x: number, y: number): number {
  return state.mines.findIndex((mine) => mine.x === x && mine.y === y)
}
