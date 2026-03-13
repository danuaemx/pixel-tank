export type Direction = 'N' | 'S' | 'E' | 'O'
export type RegisterDirection = Direction | 'NONE'

export type CommandType =
  | 'MOVER'
  | 'DISPARAR'
  | 'COLOCAR_MINA'
  | 'BOMBA'
  | 'RAD'
  | 'IF'
  | 'ESPERA'
  | 'LABEL'
  | 'JUMP'

export type NumericRegister = 'RAD' | 'SALUD'
export type CompareOperator = '<=' | '<' | '>' | '>=' | '=='
export type BombDistanceSource = 'VAL' | NumericRegister
export type ShootDirectionSource = 'VAL' | 'RAD_DIR'

export type ConditionKind =
  | 'TRUE'
  | 'REGISTER_COMPARE'
  | 'DAÑO'
  | 'DIR_MOV_EQ'

export type SoundKey =
  | 'move'
  | 'shoot'
  | 'mine'
  | 'bomb'
  | 'hit'
  | 'heal'
  | 'collision'
  | 'win'

export interface Condition {
  kind: ConditionKind
  register?: NumericRegister
  operator?: CompareOperator
  value?: number
  dir?: Direction
}

export interface Command {
  id: string
  type: CommandType
  dir?: Direction
  dirSource?: ShootDirectionSource
  dist?: number
  distSource?: BombDistanceSource
  label?: string
  condition?: Condition
}

export interface TankRegisters {
  RAD: number
  RAD_DIR: RegisterDirection
  DANO_DIR: RegisterDirection
  DIR_MOV: RegisterDirection
  SALUD: number
}

export interface Tank {
  id: string
  name: string
  color: string
  x: number
  y: number
  alive: boolean
  health: number
  kills: number
  score: number
  finalScore?: number
  bombsLeft: number
  minesLeft: number
  ip: number
  lastExecutedIp: number
  lastExecutionTrace: number[]
  lastCommandType: CommandType
  lastAction: string
  program: Command[]
  registers: TankRegisters
}

export interface Mine {
  id: string
  x: number
  y: number
  ownerId: string
}

export interface Station {
  id: string
  x: number
  y: number
  hp: number
}

export type EffectKind = 'move' | 'shot' | 'explosion' | 'heal' | 'mine' | 'hit'

export interface Effect {
  id: string
  x: number
  y: number
  kind: EffectKind
  ttl: number
}

export interface GameConfig {
  players: number
  gridSize: number
  passiveLimit: number
  maxRounds: number
  wallDensity: number
  stationCount: number
  tickMs: number
}

export interface GameState {
  config: GameConfig
  tanks: Tank[]
  walls: Set<string>
  mines: Mine[]
  stations: Station[]
  effects: Effect[]
  round: number
  turnIndex: number
  lastActorId: string | null
  finished: boolean
  winnerId?: string
  log: string[]
  soundEvents: SoundKey[]
}

export const DIRECTIONS: Direction[] = ['N', 'S', 'E', 'O']

export const DIR_SYMBOLS: Record<Direction, string> = {
  N: '↑',
  S: '↓',
  E: '→',
  O: '←',
}

const DIR_VECTORS: Record<Direction, { x: number; y: number }> = {
  N: { x: 0, y: -1 },
  S: { x: 0, y: 1 },
  E: { x: 1, y: 0 },
  O: { x: -1, y: 0 },
}

const ACTION_COMMANDS = new Set<CommandType>([
  'MOVER',
  'DISPARAR',
  'COLOCAR_MINA',
  'BOMBA',
  'ESPERA',
])

export const TANK_COLORS = ['#ef4444', '#3b82f6', '#22c55e', '#eab308', '#f97316', '#a855f7']

let idCounter = 0

function createId(prefix: string): string {
  idCounter += 1
  return `${prefix}-${idCounter}`
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function inBounds(size: number, x: number, y: number): boolean {
  return x >= 0 && y >= 0 && x < size && y < size
}

function opposite(dir: Direction): Direction {
  if (dir === 'N') return 'S'
  if (dir === 'S') return 'N'
  if (dir === 'E') return 'O'
  return 'E'
}

function nextIndex(current: number, length: number, step = 1): number {
  if (length <= 0) {
    return 0
  }
  const mod = (current + step) % length
  return mod < 0 ? mod + length : mod
}

export function cellKey(x: number, y: number): string {
  return `${x},${y}`
}

function keyToPoint(key: string): { x: number; y: number } {
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

function resolveBombDistance(command: Command, tank: Tank, gridSize: number): number {
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

function resolveCommandDirection(command: Command, tank: Tank): Direction {
  if (command.dirSource === 'RAD_DIR') {
    return tank.registers.RAD_DIR === 'NONE' ? (command.dir ?? 'N') : tank.registers.RAD_DIR
  }

  return command.dir ?? 'N'
}

function evaluateCondition(condition: Condition | undefined, tank: Tank): boolean {
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

function getTankAt(state: GameState, x: number, y: number, excludeTankId?: string): number {
  return state.tanks.findIndex((tank) => {
    if (!tank.alive) return false
    if (excludeTankId && tank.id === excludeTankId) return false
    return tank.x === x && tank.y === y
  })
}

function getStationAt(state: GameState, x: number, y: number): number {
  return state.stations.findIndex((station) => station.x === x && station.y === y)
}

function getMineAt(state: GameState, x: number, y: number): number {
  return state.mines.findIndex((mine) => mine.x === x && mine.y === y)
}

function pushLog(state: GameState, message: string): void {
  state.log = [`[R${state.round}] ${message}`, ...state.log].slice(0, 120)
}

function pushSound(state: GameState, sound: SoundKey): void {
  state.soundEvents.push(sound)
}

function addEffect(state: GameState, kind: EffectKind, x: number, y: number, ttl = 2): void {
  if (!inBounds(state.config.gridSize, x, y)) {
    return
  }
  state.effects.push({
    id: createId('fx'),
    x,
    y,
    kind,
    ttl,
  })
}

function healTank(state: GameState, tankIndex: number, amount: number, reason: string): void {
  const tank = state.tanks[tankIndex]
  if (!tank || !tank.alive || amount <= 0) {
    return
  }

  const oldHealth = tank.health
  tank.health = clamp(tank.health + amount, 0, 100)
  tank.registers.SALUD = tank.health

  if (tank.health > oldHealth) {
    addEffect(state, 'heal', tank.x, tank.y, 2)
    pushSound(state, 'heal')
    pushLog(state, `${tank.name} recupera ${tank.health - oldHealth} de vida por ${reason}.`)
  }
}

function rewardElimination(state: GameState, attackerIndex: number, targetName: string): void {
  const attacker = state.tanks[attackerIndex]
  if (!attacker || !attacker.alive) {
    return
  }

  attacker.kills += 1
  attacker.score += 1000
  healTank(state, attackerIndex, 20, `eliminar a ${targetName}`)
}

function applyDamage(
  state: GameState,
  targetIndex: number,
  amount: number,
  damageDir: RegisterDirection,
  sourceIndex?: number,
): void {
  const target = state.tanks[targetIndex]
  if (!target || !target.alive || amount <= 0) {
    return
  }

  target.health = clamp(target.health - amount, 0, 100)
  target.registers.SALUD = target.health
  target.registers.DANO_DIR = damageDir

  addEffect(state, 'hit', target.x, target.y, 2)
  pushSound(state, 'hit')

  if (target.health <= 0) {
    target.alive = false
    target.lastAction = 'DESTRUIDO'
    pushLog(state, `${target.name} fue destruido.`)

    if (sourceIndex !== undefined && sourceIndex >= 0 && sourceIndex !== targetIndex) {
      rewardElimination(state, sourceIndex, target.name)
    }
  }
}

function damageStationsInArea(state: GameState, x: number, y: number, sourceIndex?: number): void {
  const stationIndex = getStationAt(state, x, y)
  if (stationIndex < 0) {
    return
  }

  state.stations[stationIndex].hp -= 1

  if (state.stations[stationIndex].hp <= 0) {
    const destroyed = state.stations.splice(stationIndex, 1)[0]
    pushLog(state, `Estación en (${destroyed.x},${destroyed.y}) destruida.`)
    addEffect(state, 'explosion', destroyed.x, destroyed.y, 2)

    if (sourceIndex !== undefined && sourceIndex >= 0) {
      const attacker = state.tanks[sourceIndex]
      if (attacker && attacker.alive) {
        attacker.score += 300
        healTank(state, sourceIndex, 20, 'destruir estación')
      }
    }
  }
}

function getRadReading(state: GameState, tank: Tank, dir: Direction): number {
  const vector = DIR_VECTORS[dir]
  const maxDistance = state.config.gridSize

  for (let distance = 1; distance <= maxDistance; distance += 1) {
    const x = tank.x + vector.x * distance
    const y = tank.y + vector.y * distance

    if (!inBounds(state.config.gridSize, x, y)) {
      return 0
    }

    const hasBlockingElement =
      state.walls.has(cellKey(x, y)) ||
      getMineAt(state, x, y) >= 0 ||
      getTankAt(state, x, y, tank.id) >= 0

    if (hasBlockingElement) {
      return -distance
    }

    if (getStationAt(state, x, y) >= 0) {
      return distance
    }
  }

  return 0
}

function getLabelMap(program: Command[]): Map<string, number> {
  const labelMap = new Map<string, number>()

  program.forEach((command, index) => {
    if (command.type === 'LABEL' && command.label) {
      labelMap.set(command.label.trim().toUpperCase(), index)
    }
  })

  return labelMap
}

function createOccupiedSet(state: GameState): Set<string> {
  const occupied = new Set<string>()

  state.walls.forEach((key) => occupied.add(key))

  state.tanks.forEach((tank) => {
    if (tank.alive) {
      occupied.add(cellKey(tank.x, tank.y))
    }
  })

  state.mines.forEach((mine) => occupied.add(cellKey(mine.x, mine.y)))
  state.stations.forEach((station) => occupied.add(cellKey(station.x, station.y)))

  return occupied
}

function pickRandomFreeCell(size: number, occupied: Set<string>): { x: number; y: number } | null {
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

function moveStations(state: GameState): void {
  if (state.stations.length === 0) {
    return
  }

  const occupied = createOccupiedSet(state)

  state.stations.forEach((station) => {
    occupied.delete(cellKey(station.x, station.y))

    const destination = pickRandomFreeCell(state.config.gridSize, occupied)
    if (destination) {
      station.x = destination.x
      station.y = destination.y
    }

    occupied.add(cellKey(station.x, station.y))
  })

  pushLog(state, 'Las estaciones de reparación se reubicaron.')
}

function performMove(state: GameState, tankIndex: number, dir: Direction): void {
  const tank = state.tanks[tankIndex]
  if (!tank || !tank.alive) {
    return
  }

  const vector = DIR_VECTORS[dir]
  const nx = tank.x + vector.x
  const ny = tank.y + vector.y

  tank.registers.DIR_MOV = dir
  pushSound(state, 'move')

  const outOfBounds = !inBounds(state.config.gridSize, nx, ny)
  const hitsWall = state.walls.has(cellKey(nx, ny))
  const hitsTank = getTankAt(state, nx, ny, tank.id) >= 0

  if (outOfBounds || hitsWall || hitsTank) {
    applyDamage(state, tankIndex, 10, dir)
    pushSound(state, 'collision')
    pushLog(state, `${tank.name} colisiona al intentar mover ${dir} (-10).`)
    return
  }

  tank.x = nx
  tank.y = ny
  tank.lastAction = `MOVER ${dir}`
  addEffect(state, 'move', tank.x, tank.y, 2)

  const mineIndex = getMineAt(state, tank.x, tank.y)
  if (mineIndex >= 0) {
    const mine = state.mines[mineIndex]
    const ownerIndex = state.tanks.findIndex((candidate) => candidate.id === mine.ownerId)
    state.mines.splice(mineIndex, 1)
    applyDamage(state, tankIndex, 40, opposite(dir), ownerIndex >= 0 ? ownerIndex : undefined)
    addEffect(state, 'explosion', tank.x, tank.y, 3)
    pushSound(state, 'bomb')
    pushLog(state, `${tank.name} pisa una mina (-40).`)
  }

  const stationIndex = getStationAt(state, tank.x, tank.y)
  if (stationIndex >= 0) {
    healTank(state, tankIndex, 10, 'estación de reparación')
  }
}

function performShoot(state: GameState, tankIndex: number, dir: Direction): void {
  const shooter = state.tanks[tankIndex]
  if (!shooter || !shooter.alive) {
    return
  }

  const vector = DIR_VECTORS[dir]
  const range = Math.max(3, Math.floor(state.config.gridSize * 0.75))
  pushSound(state, 'shoot')

  for (let distance = 1; distance <= range; distance += 1) {
    const x = shooter.x + vector.x * distance
    const y = shooter.y + vector.y * distance

    if (!inBounds(state.config.gridSize, x, y)) {
      break
    }

    addEffect(state, 'shot', x, y, 1)

    if (state.walls.has(cellKey(x, y))) {
      break
    }

    const stationIndex = getStationAt(state, x, y)
    if (stationIndex >= 0) {
      damageStationsInArea(state, x, y, tankIndex)
      break
    }

    const mineIndex = getMineAt(state, x, y)
    if (mineIndex >= 0) {
      state.mines.splice(mineIndex, 1)
      addEffect(state, 'explosion', x, y, 2)
      break
    }

    const hitTankIndex = getTankAt(state, x, y, shooter.id)
    if (hitTankIndex >= 0) {
      applyDamage(state, hitTankIndex, 20, opposite(dir), tankIndex)
      break
    }
  }

  shooter.lastAction = `DISPARAR ${dir}`
  pushLog(state, `${shooter.name} dispara hacia ${dir}.`)
}

function performMinePlacement(state: GameState, tankIndex: number): void {
  const tank = state.tanks[tankIndex]
  if (!tank || !tank.alive) {
    return
  }

  if (tank.minesLeft <= 0) {
    tank.lastAction = 'SIN MINAS'
    pushLog(state, `${tank.name} intenta colocar mina, pero no tiene.`)
    return
  }

  if (getMineAt(state, tank.x, tank.y) >= 0) {
    tank.lastAction = 'MINA FALLIDA'
    pushLog(state, `${tank.name} ya tiene una mina en su casilla.`)
    return
  }

  tank.minesLeft -= 1
  state.mines.push({
    id: createId('mine'),
    x: tank.x,
    y: tank.y,
    ownerId: tank.id,
  })

  tank.lastAction = 'COLOCAR_MINA'
  addEffect(state, 'mine', tank.x, tank.y, 2)
  pushSound(state, 'mine')
  pushLog(state, `${tank.name} coloca una mina.`)
}

function performBomb(state: GameState, tankIndex: number, dir: Direction, dist: number): void {
  const tank = state.tanks[tankIndex]
  if (!tank || !tank.alive) {
    return
  }

  if (tank.bombsLeft <= 0) {
    tank.lastAction = 'SIN BOMBAS'
    pushLog(state, `${tank.name} intenta lanzar bomba, pero no tiene.`)
    return
  }

  tank.bombsLeft -= 1

  const vector = DIR_VECTORS[dir]
  let targetX = tank.x
  let targetY = tank.y

  for (let step = 0; step < Math.max(1, dist); step += 1) {
    const nx = targetX + vector.x
    const ny = targetY + vector.y

    if (!inBounds(state.config.gridSize, nx, ny)) {
      break
    }

    targetX = nx
    targetY = ny
  }

  for (let y = targetY - 2; y <= targetY + 2; y += 1) {
    for (let x = targetX - 2; x <= targetX + 2; x += 1) {
      if (!inBounds(state.config.gridSize, x, y)) {
        continue
      }

      const chebyshev = Math.max(Math.abs(x - targetX), Math.abs(y - targetY))
      if (chebyshev <= 2) {
        addEffect(state, 'explosion', x, y, chebyshev <= 1 ? 3 : 2)
      }
    }
  }

  state.tanks.forEach((targetTank, candidateIndex) => {
    if (!targetTank.alive) {
      return
    }

    const chebyshev = Math.max(Math.abs(targetTank.x - targetX), Math.abs(targetTank.y - targetY))
    if (chebyshev <= 1) {
      applyDamage(state, candidateIndex, 30, opposite(dir), tankIndex)
    } else if (chebyshev === 2) {
      applyDamage(state, candidateIndex, 15, opposite(dir), tankIndex)
    }
  })

  const minesToRemove = state.mines.filter((mine) => {
    const chebyshev = Math.max(Math.abs(mine.x - targetX), Math.abs(mine.y - targetY))
    return chebyshev <= 2
  })

  if (minesToRemove.length > 0) {
    state.mines = state.mines.filter((mine) => {
      const chebyshev = Math.max(Math.abs(mine.x - targetX), Math.abs(mine.y - targetY))
      return chebyshev > 2
    })
  }

  for (let y = targetY - 2; y <= targetY + 2; y += 1) {
    for (let x = targetX - 2; x <= targetX + 2; x += 1) {
      if (!inBounds(state.config.gridSize, x, y)) {
        continue
      }
      damageStationsInArea(state, x, y, tankIndex)
    }
  }

  tank.lastAction = `BOMBA ${dir},${Math.max(1, dist)}`
  pushSound(state, 'bomb')
  pushLog(state, `${tank.name} lanza bomba (${dir}, ${Math.max(1, dist)}).`)
}

function executeTankTurn(state: GameState, tankIndex: number): void {
  const tank = state.tanks[tankIndex]
  if (!tank || !tank.alive) {
    return
  }

  const program = tank.program
  if (program.length === 0) {
    tank.lastAction = 'ESPERA'
    tank.lastCommandType = 'ESPERA'
    tank.lastExecutedIp = 0
    tank.lastExecutionTrace = [0]
    return
  }

  const labelMap = getLabelMap(program)
  let passiveCount = 0
  let didAction = false
  let safetyCounter = 0
  const executionTrace: number[] = []

  while (!didAction && safetyCounter < 500 && tank.alive) {
    const command = program[tank.ip]

    if (!command) {
      tank.ip = 0
      tank.lastCommandType = 'ESPERA'
      tank.lastExecutedIp = 0
      executionTrace.push(0)
      safetyCounter += 1
      continue
    }

    const currentIp = tank.ip
    tank.lastCommandType = command.type

    switch (command.type) {
      case 'LABEL': {
        tank.ip = nextIndex(tank.ip, program.length, 1)
        passiveCount += 1
        break
      }
      case 'RAD': {
        const dir = command.dir ?? 'N'
        tank.registers.RAD = getRadReading(state, tank, dir)
        tank.registers.RAD_DIR = dir
        tank.ip = nextIndex(tank.ip, program.length, 1)
        passiveCount += 1
        break
      }
      case 'IF': {
        const conditionResult = evaluateCondition(command.condition, tank)
        tank.ip = nextIndex(tank.ip, program.length, conditionResult ? 1 : 2)
        passiveCount += 1
        break
      }
      case 'JUMP': {
        const conditionResult = evaluateCondition(command.condition, tank)
        if (conditionResult && command.label) {
          const jumpTarget = labelMap.get(command.label.trim().toUpperCase())
          tank.ip = jumpTarget ?? nextIndex(tank.ip, program.length, 1)
        } else {
          tank.ip = nextIndex(tank.ip, program.length, 1)
        }
        passiveCount += 1
        break
      }
      case 'MOVER': {
        performMove(state, tankIndex, command.dir ?? 'N')
        tank.ip = nextIndex(tank.ip, program.length, 1)
        didAction = true
        break
      }
      case 'DISPARAR': {
        const shootDir = resolveCommandDirection(command, tank)
        performShoot(state, tankIndex, shootDir)
        tank.ip = nextIndex(tank.ip, program.length, 1)
        didAction = true
        break
      }
      case 'COLOCAR_MINA': {
        performMinePlacement(state, tankIndex)
        tank.ip = nextIndex(tank.ip, program.length, 1)
        didAction = true
        break
      }
      case 'BOMBA': {
        const bombDir = resolveCommandDirection(command, tank)
        const distance = resolveBombDistance(command, tank, state.config.gridSize)
        performBomb(state, tankIndex, bombDir, distance)
        tank.ip = nextIndex(tank.ip, program.length, 1)
        didAction = true
        break
      }
      case 'ESPERA':
      default: {
        tank.lastAction = 'ESPERA'
        tank.ip = nextIndex(tank.ip, program.length, 1)
        didAction = true
        break
      }
    }

    tank.lastExecutedIp = currentIp
    executionTrace.push(currentIp)

    if (!didAction && passiveCount > state.config.passiveLimit) {
      tank.lastAction = 'ESPERA_FORZADA'
      pushLog(
        state,
        `${tank.name} supera líneas pasivas permitidas (${state.config.passiveLimit}) y espera.`,
      )
      didAction = true
    }

    safetyCounter += 1
  }

  if (!didAction) {
    tank.lastAction = 'ESPERA_FORZADA'
    tank.lastCommandType = 'ESPERA'
    pushLog(state, `${tank.name} entra en bucle y espera por seguridad.`)
  }

  tank.lastExecutionTrace = executionTrace.length > 0 ? executionTrace : [tank.lastExecutedIp]

  const stationIndex = getStationAt(state, tank.x, tank.y)
  if (stationIndex >= 0 && tank.alive) {
    healTank(state, tankIndex, 10, 'estación')
  }

  tank.registers.SALUD = tank.health
  tank.registers.DANO_DIR = 'NONE'
}

function finalizeGame(state: GameState): void {
  if (state.finished) {
    return
  }

  const minProgramLength = Math.min(
    ...state.tanks.map((tank) => {
      const length = tank.program.length
      return length <= 0 ? 1 : length
    }),
  )

  state.tanks.forEach((tank) => {
    const baseScore = tank.score + Math.max(0, Math.round(tank.health))
    const hasEfficiencyBonus = tank.program.length === minProgramLength
    const bonus = hasEfficiencyBonus ? Math.round(baseScore * 0.1) : 0
    tank.finalScore = baseScore + bonus
  })

  const ranking = [...state.tanks].sort((a, b) => (b.finalScore ?? 0) - (a.finalScore ?? 0))
  state.winnerId = ranking[0]?.id
  state.finished = true
  pushSound(state, 'win')

  if (ranking.length > 0) {
    pushLog(state, `Ganador: ${ranking[0].name} con ${ranking[0].finalScore ?? 0} puntos.`)
  }
}

function countAliveTanks(state: GameState): number {
  return state.tanks.filter((tank) => tank.alive).length
}

function findNextAliveTank(tanks: Tank[], startIndex: number): number {
  for (let step = 0; step < tanks.length; step += 1) {
    const index = (startIndex + step) % tanks.length
    if (tanks[index].alive) {
      return index
    }
  }

  return -1
}

function cloneState(previous: GameState): GameState {
  return {
    ...previous,
    config: { ...previous.config },
    tanks: previous.tanks.map((tank) => ({
      ...tank,
      lastExecutionTrace: [...tank.lastExecutionTrace],
      registers: { ...tank.registers },
      program: tank.program,
    })),
    walls: new Set(previous.walls),
    mines: previous.mines.map((mine) => ({ ...mine })),
    stations: previous.stations.map((station) => ({ ...station })),
    effects: previous.effects.map((effect) => ({ ...effect })),
    log: [...previous.log],
    soundEvents: [],
  }
}

export function advanceGame(previous: GameState): GameState {
  if (previous.finished) {
    return previous
  }

  const state = cloneState(previous)

  if (countAliveTanks(state) <= 1) {
    finalizeGame(state)
    return state
  }

  const actingTankIndex = findNextAliveTank(state.tanks, state.turnIndex)
  if (actingTankIndex < 0) {
    state.lastActorId = null
    finalizeGame(state)
    return state
  }

  executeTankTurn(state, actingTankIndex)
  state.lastActorId = state.tanks[actingTankIndex]?.id ?? null

  state.turnIndex = (actingTankIndex + 1) % state.tanks.length
  if (state.turnIndex === 0) {
    state.round += 1
    if (state.round % 5 === 0) {
      moveStations(state)
    }
  }

  state.effects = state.effects
    .map((effect) => ({ ...effect, ttl: effect.ttl - 1 }))
    .filter((effect) => effect.ttl > 0)

  if (countAliveTanks(state) <= 1 || state.round > state.config.maxRounds) {
    finalizeGame(state)
  }

  return state
}

export function createCommandTemplate(type: CommandType): Command {
  switch (type) {
    case 'MOVER':
      return { id: createId('cmd'), type, dir: 'N' }
    case 'DISPARAR':
      return { id: createId('cmd'), type, dir: 'N', dirSource: 'VAL' }
    case 'COLOCAR_MINA':
      return { id: createId('cmd'), type }
    case 'BOMBA':
      return { id: createId('cmd'), type, dir: 'N', dirSource: 'VAL', dist: 2, distSource: 'VAL' }
    case 'RAD':
      return { id: createId('cmd'), type, dir: 'N' }
    case 'IF':
      return { id: createId('cmd'), type, condition: { kind: 'TRUE' } }
    case 'LABEL':
      return { id: createId('cmd'), type, label: 'LOOP' }
    case 'JUMP':
      return { id: createId('cmd'), type, label: 'LOOP', condition: { kind: 'TRUE' } }
    case 'ESPERA':
    default:
      return { id: createId('cmd'), type: 'ESPERA' }
  }
}

export function createDefaultConfig(): GameConfig {
  return {
    players: 4,
    gridSize: 10,
    passiveLimit: 8,
    maxRounds: 140,
    wallDensity: 0.09,
    stationCount: 2,
    tickMs: 700,
  }
}

function buildProgram(variant: number): Command[] {
  if (variant === 0) {
    const label = createCommandTemplate('LABEL')
    label.label = 'LOOP'

    const radar = createCommandTemplate('RAD')
    radar.dir = 'N'

    const conditionIf = createCommandTemplate('IF')
    conditionIf.condition = { kind: 'REGISTER_COMPARE', register: 'RAD', operator: '<', value: 0 }

    const shoot = createCommandTemplate('DISPARAR')
    shoot.dir = 'N'

    const move = createCommandTemplate('MOVER')
    move.dir = 'E'

    const jump = createCommandTemplate('JUMP')
    jump.label = 'LOOP'
    jump.condition = { kind: 'TRUE' }

    return [label, radar, conditionIf, shoot, move, jump]
  }

  if (variant === 1) {
    const label = createCommandTemplate('LABEL')
    label.label = 'TRAMPA'

    const mine = createCommandTemplate('COLOCAR_MINA')

    const move = createCommandTemplate('MOVER')
    move.dir = 'S'

    const radar = createCommandTemplate('RAD')
    radar.dir = 'E'

    const jumpIf = createCommandTemplate('JUMP')
    jumpIf.label = 'TRAMPA'
    jumpIf.condition = { kind: 'REGISTER_COMPARE', register: 'RAD', operator: '<', value: 0 }

    const shoot = createCommandTemplate('DISPARAR')
    shoot.dir = 'E'

    return [label, mine, move, radar, jumpIf, shoot]
  }

  if (variant === 2) {
    const loop = createCommandTemplate('LABEL')
    loop.label = 'BOMB'

    const ifDamaged = createCommandTemplate('IF')
    ifDamaged.condition = { kind: 'DAÑO' }

    const bomb = createCommandTemplate('BOMBA')
    bomb.dir = 'O'
    bomb.dist = 3
    bomb.distSource = 'VAL'

    const move = createCommandTemplate('MOVER')
    move.dir = 'N'

    const jump = createCommandTemplate('JUMP')
    jump.label = 'BOMB'
    jump.condition = { kind: 'TRUE' }

    return [loop, ifDamaged, bomb, move, jump]
  }

  const loop = createCommandTemplate('LABEL')
  loop.label = 'SCAN'

  const radar = createCommandTemplate('RAD')
  radar.dir = 'S'

  const ifPositive = createCommandTemplate('IF')
  ifPositive.condition = { kind: 'REGISTER_COMPARE', register: 'RAD', operator: '>', value: 0 }

  const move = createCommandTemplate('MOVER')
  move.dir = 'S'

  const shoot = createCommandTemplate('DISPARAR')
  shoot.dir = 'S'

  const jump = createCommandTemplate('JUMP')
  jump.label = 'SCAN'
  jump.condition = { kind: 'TRUE' }

  return [loop, radar, ifPositive, move, shoot, jump]
}

export function createDefaultPrograms(players: number): Command[][] {
  const safePlayers = clamp(players, 2, 6)
  const programs: Command[][] = []

  for (let index = 0; index < safePlayers; index += 1) {
    programs.push(buildProgram(index % 4))
  }

  return programs
}

export function normalizeProgramsForPlayers(programs: Command[][], players: number): Command[][] {
  const safePlayers = clamp(players, 2, 6)
  const normalized: Command[][] = programs.slice(0, safePlayers).map((program) => {
    if (program.length === 0) {
      return [createCommandTemplate('ESPERA')]
    }
    return program
  })

  for (let index = normalized.length; index < safePlayers; index += 1) {
    normalized.push(buildProgram(index % 4))
  }

  return normalized
}

export function createInitialGameState(config: GameConfig, programs: Command[][]): GameState {
  const safeConfig: GameConfig = {
    ...config,
    players: clamp(config.players, 2, 6),
    gridSize: clamp(config.gridSize, 6, 15),
    passiveLimit: clamp(config.passiveLimit, 0, 50),
  }

  const readyPrograms = normalizeProgramsForPlayers(programs, safeConfig.players)

  const preferredSpawns: Array<{ x: number; y: number }> = [
    { x: 0, y: 0 },
    { x: safeConfig.gridSize - 1, y: safeConfig.gridSize - 1 },
    { x: 0, y: safeConfig.gridSize - 1 },
    { x: safeConfig.gridSize - 1, y: 0 },
    { x: Math.floor(safeConfig.gridSize / 2), y: 0 },
    { x: Math.floor(safeConfig.gridSize / 2), y: safeConfig.gridSize - 1 },
  ]

  const occupied = new Set<string>()
  const positions: Array<{ x: number; y: number }> = []

  for (let index = 0; index < safeConfig.players; index += 1) {
    let position = preferredSpawns[index]

    if (
      !position ||
      !inBounds(safeConfig.gridSize, position.x, position.y) ||
      occupied.has(cellKey(position.x, position.y))
    ) {
      const randomPosition = pickRandomFreeCell(safeConfig.gridSize, occupied)
      position = randomPosition ?? { x: 0, y: 0 }
    }

    occupied.add(cellKey(position.x, position.y))
    positions.push(position)
  }

  const walls = new Set<string>()
  const wallsTarget = Math.floor(safeConfig.gridSize * safeConfig.gridSize * safeConfig.wallDensity)

  while (walls.size < wallsTarget) {
    const x = Math.floor(Math.random() * safeConfig.gridSize)
    const y = Math.floor(Math.random() * safeConfig.gridSize)
    const key = cellKey(x, y)

    if (!occupied.has(key)) {
      walls.add(key)
      occupied.add(key)
    }
  }

  const stations: Station[] = []

  for (let stationIndex = 0; stationIndex < safeConfig.stationCount; stationIndex += 1) {
    const stationPos = pickRandomFreeCell(safeConfig.gridSize, occupied)
    if (!stationPos) {
      break
    }

    stations.push({
      id: createId('station'),
      x: stationPos.x,
      y: stationPos.y,
      hp: 1,
    })

    occupied.add(cellKey(stationPos.x, stationPos.y))
  }

  const tanks: Tank[] = Array.from({ length: safeConfig.players }, (_, index) => ({
    id: createId('tank'),
    name: `T${index + 1}`,
    color: TANK_COLORS[index % TANK_COLORS.length],
    x: positions[index].x,
    y: positions[index].y,
    alive: true,
    health: 100,
    kills: 0,
    score: 0,
    bombsLeft: 2,
    minesLeft: 3,
    ip: 0,
    lastExecutedIp: 0,
    lastExecutionTrace: [0],
    lastCommandType: 'ESPERA',
    lastAction: 'LISTO',
    program: readyPrograms[index],
    registers: {
      RAD: 0,
      RAD_DIR: 'NONE',
      DANO_DIR: 'NONE',
      DIR_MOV: 'NONE',
      SALUD: 100,
    },
  }))

  return {
    config: safeConfig,
    tanks,
    walls,
    mines: [],
    stations,
    effects: [],
    round: 1,
    turnIndex: 0,
    lastActorId: null,
    finished: false,
    log: ['Partida iniciada.'],
    soundEvents: [],
  }
}

export function getDisplayScore(tank: Tank): number {
  if (tank.finalScore !== undefined) {
    return tank.finalScore
  }
  return tank.score + Math.max(0, Math.round(tank.health))
}

export function commandToText(command: Command): string {
  if (command.type === 'MOVER' || command.type === 'RAD') {
    return `${command.type}(${command.dir ?? 'N'})`
  }

  if (command.type === 'DISPARAR') {
    const dirText = command.dirSource === 'RAD_DIR' ? 'RAD_DIR' : command.dir ?? 'N'
    return `DISPARAR(${dirText})`
  }

  if (command.type === 'BOMBA') {
    const dirText = command.dirSource === 'RAD_DIR' ? 'RAD_DIR' : command.dir ?? 'N'
    const distText =
      command.distSource && command.distSource !== 'VAL'
        ? command.distSource === 'RAD'
          ? '|RAD|'
          : command.distSource
        : String(command.dist ?? 2)
    return `BOMBA(${dirText},${distText})`
  }

  if (command.type === 'LABEL') {
    return `LABEL ${command.label ?? 'LOOP'}`
  }

  if (command.type === 'JUMP') {
    const cond = conditionToText(command.condition)
    return `JUMP[${cond}, ${command.label ?? 'LOOP'}]`
  }

  if (command.type === 'IF') {
    return `IF(${conditionToText(command.condition)})`
  }

  if (command.type === 'COLOCAR_MINA') {
    return 'COLOCAR_MINA'
  }

  return 'ESPERA'
}

export function isActionCommand(type: CommandType): boolean {
  return ACTION_COMMANDS.has(type)
}

function conditionToText(condition: Condition | undefined): string {
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
