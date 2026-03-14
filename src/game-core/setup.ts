import {
  MAX_GRID_SIZE,
  MAX_PASSIVE_LIMIT,
  MAX_PLAYERS,
  MIN_GRID_SIZE,
  MIN_PASSIVE_LIMIT,
  MIN_PLAYERS,
  TANK_COLORS,
} from './_const'
import { cellKey, clamp, createId, inBounds, pickRandomFreeCell } from './utils'
import type { Command, CommandType, GameConfig, GameState, Station, Tank } from './types'

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
  const safePlayers = clamp(players, MIN_PLAYERS, MAX_PLAYERS)
  const programs: Command[][] = []

  for (let index = 0; index < safePlayers; index += 1) {
    programs.push(buildProgram(index % 4))
  }

  return programs
}

export function normalizeProgramsForPlayers(programs: Command[][], players: number): Command[][] {
  const safePlayers = clamp(players, MIN_PLAYERS, MAX_PLAYERS)
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
    players: clamp(config.players, MIN_PLAYERS, MAX_PLAYERS),
    gridSize: clamp(config.gridSize, MIN_GRID_SIZE, MAX_GRID_SIZE),
    passiveLimit: clamp(config.passiveLimit, MIN_PASSIVE_LIMIT, MAX_PASSIVE_LIMIT),
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
