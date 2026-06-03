import {
  MAX_BOMBS_PER_TANK,
  MAX_GRID_SIZE,
  MAX_MAX_ROUNDS,
  MAX_MINES_PER_TANK,
  MAX_PASSIVE_LIMIT,
  MAX_PLAYERS,
  MIN_BOMBS_PER_TANK,
  MIN_GRID_SIZE,
  MIN_MAX_ROUNDS,
  MIN_MINES_PER_TANK,
  MIN_PASSIVE_LIMIT,
  MIN_PLAYERS,
  TANK_COLORS,
  MIN_SHOT_RANGE,
  MAX_SHOT_RANGE,
  MIN_RADAR_RANGE,
  MAX_RADAR_RANGE,
} from './_const'
import { cellKey, clamp, createId, pickRandomFreeCell } from './utils'
import type { Command, CommandType, CompareOperator, Direction, GameConfig, GameState, Station, Tank } from './types'

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
      return {
        id: createId('cmd'),
        type,
        condition: { kind: 'TRUE' },
        action: { type: 'ESPERA' },
      }
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
    bombsPerTank: 2,
    minesPerTank: 3,
    wallDensity: 0.09,
    stationCount: 2,
    tickMs: 700,
    shotRange: 3,
    radarRange: 5,
  }
}

function buildProgram(variant: number): Command[] {
  const buildMover = (dir: Direction): Command => ({
    id: createId('cmd'),
    type: 'MOVER',
    dir,
  })

  const buildDisparar = (dir: Direction): Command => ({
    id: createId('cmd'),
    type: 'DISPARAR',
    dir,
    dirSource: 'VAL',
  })

  const buildBomba = (dir: Direction, dist: number): Command => ({
    id: createId('cmd'),
    type: 'BOMBA',
    dir,
    dirSource: 'VAL',
    dist,
    distSource: 'VAL',
  })

  const buildMina = (): Command => ({
    id: createId('cmd'),
    type: 'COLOCAR_MINA',
  })

  const buildEspera = (): Command => ({
    id: createId('cmd'),
    type: 'ESPERA',
  })

  const buildIf = (
    dir: Direction,
    operator: CompareOperator,
    value: number,
    action: Command
  ): Command => ({
    id: createId('cmd'),
    type: 'IF',
    condition: {
      kind: 'REGISTER_COMPARE',
      register: 'RAD',
      operator,
      value,
      dir,
    },
    action: {
      type: action.type,
      dir: action.dir,
      dirSource: action.dirSource,
      dist: action.dist,
      distSource: action.distSource,
    },
  })

  if (variant === 0) {
    return [
      buildMover('N'),
      buildIf('E', '<', -1, buildMina()),
      buildDisparar('S'),
      buildBomba('O', 3),
      buildMina(),
      buildEspera(),
      buildMover('E'),
      buildIf('N', '>', 0, buildDisparar('N')),
      buildMover('S'),
      buildIf('S', '=', -2, buildMover('O')),
      buildDisparar('O'),
      buildMover('O'),
      buildBomba('E', 2),
      buildEspera(),
      buildMover('N'),
    ]
  }

  if (variant === 1) {
    return [
      buildMover('S'),
      buildIf('O', '<', -2, buildMover('S')),
      buildDisparar('N'),
      buildBomba('E', 3),
      buildMina(),
      buildEspera(),
      buildMover('O'),
      buildIf('S', '>', 0, buildDisparar('S')),
      buildMover('N'),
      buildIf('N', '=', -1, buildMina()),
      buildDisparar('E'),
      buildMover('E'),
      buildBomba('O', 2),
      buildEspera(),
      buildMover('S'),
    ]
  }

  if (variant === 2) {
    return [
      buildMover('E'),
      buildIf('S', '<', -1, buildMina()),
      buildDisparar('O'),
      buildBomba('N', 2),
      buildMina(),
      buildEspera(),
      buildMover('N'),
      buildIf('E', '>', 0, buildDisparar('E')),
      buildMover('O'),
      buildIf('O', '=', -2, buildMover('N')),
      buildDisparar('N'),
      buildMover('S'),
      buildBomba('S', 3),
      buildEspera(),
      buildMover('E'),
    ]
  }

  // variant === 3
  return [
    buildMover('O'),
    buildIf('N', '<', -2, buildMover('O')),
    buildDisparar('E'),
    buildBomba('S', 3),
    buildMina(),
    buildEspera(),
    buildMover('S'),
    buildIf('O', '>', 0, buildDisparar('O')),
    buildMover('E'),
    buildIf('E', '=', -1, buildMina()),
    buildDisparar('S'),
    buildMover('N'),
    buildBomba('N', 2),
    buildEspera(),
    buildMover('O'),
  ]
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

function createRandomWallSegments(size: number): Array<Array<{ x: number; y: number }>> {
  const segments: Array<Array<{ x: number; y: number }>> = []
  const spacing = 4
  const anchorOffsets: Array<{ x: number; y: number }> = [
    { x: 0, y: 0 },
    { x: 2, y: 2 },
    { x: 0, y: 2 },
    { x: 2, y: 0 },
  ]

  const anchors: Array<{ x: number; y: number }> = []

  for (const { x: offsetX, y: offsetY } of anchorOffsets) {
    for (let y = offsetY; y < size; y += spacing) {
      for (let x = offsetX; x < size; x += spacing) {
        anchors.push({ x, y })
      }
    }
  }

  for (let index = anchors.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1))
    ;[anchors[index], anchors[swapIndex]] = [anchors[swapIndex], anchors[index]]
  }

  let nextOrientation: 'H' | 'V' = Math.random() < 0.5 ? 'H' : 'V'

  for (const anchor of anchors) {
    const horizontal =
      anchor.x <= size - 3
        ? [
            { x: anchor.x, y: anchor.y },
            { x: anchor.x + 1, y: anchor.y },
            { x: anchor.x + 2, y: anchor.y },
          ]
        : null

    const vertical =
      anchor.y <= size - 3
        ? [
            { x: anchor.x, y: anchor.y },
            { x: anchor.x, y: anchor.y + 1 },
            { x: anchor.x, y: anchor.y + 2 },
          ]
        : null

    if (!horizontal && !vertical) {
      continue
    }

    if (nextOrientation === 'H') {
      const selected = horizontal ?? vertical
      if (selected) {
        segments.push(selected)
        nextOrientation = selected === horizontal ? 'V' : 'H'
      }
      continue
    }

    const selected = vertical ?? horizontal
    if (selected) {
      segments.push(selected)
      nextOrientation = selected === vertical ? 'H' : 'V'
    }
  }

  return segments
}

export function createInitialGameState(config: GameConfig, programs: Command[][]): GameState {
  const safeConfig: GameConfig = {
    ...config,
    players: clamp(config.players, MIN_PLAYERS, MAX_PLAYERS),
    gridSize: clamp(config.gridSize, MIN_GRID_SIZE, MAX_GRID_SIZE),
    passiveLimit: clamp(config.passiveLimit, MIN_PASSIVE_LIMIT, MAX_PASSIVE_LIMIT),
    maxRounds: clamp(config.maxRounds, MIN_MAX_ROUNDS, MAX_MAX_ROUNDS),
    bombsPerTank: clamp(config.bombsPerTank, MIN_BOMBS_PER_TANK, MAX_BOMBS_PER_TANK),
    minesPerTank: clamp(config.minesPerTank, MIN_MINES_PER_TANK, MAX_MINES_PER_TANK),
    shotRange: clamp(config.shotRange ?? 3, MIN_SHOT_RANGE, MAX_SHOT_RANGE),
    radarRange: clamp(config.radarRange ?? 5, MIN_RADAR_RANGE, MAX_RADAR_RANGE),
  }

  const readyPrograms = normalizeProgramsForPlayers(programs, safeConfig.players)

  const totalCells = safeConfig.gridSize * safeConfig.gridSize
  const maxWallsByCapacity = Math.max(0, totalCells - safeConfig.players - safeConfig.stationCount)
  const requestedWallCells = Math.floor(totalCells * safeConfig.wallDensity)
  const wallsTarget = Math.min(requestedWallCells, maxWallsByCapacity)
  const wallSegmentsTarget = Math.floor(wallsTarget / 3)

  const walls = new Set<string>()
  const occupied = new Set<string>()
  const wallSegments = createRandomWallSegments(safeConfig.gridSize)

  for (const segment of wallSegments) {
    if (walls.size >= wallSegmentsTarget * 3) {
      break
    }

    const canPlace = segment.every(({ x, y }) => !occupied.has(cellKey(x, y)))
    if (!canPlace) {
      continue
    }

    segment.forEach(({ x, y }) => {
      const key = cellKey(x, y)
      walls.add(key)
      occupied.add(key)
    })
  }

  const positions: Array<{ x: number; y: number }> = []

  for (let index = 0; index < safeConfig.players; index += 1) {
    const randomPosition = pickRandomFreeCell(safeConfig.gridSize, occupied)
    const position = randomPosition ?? { x: index % safeConfig.gridSize, y: Math.floor(index / safeConfig.gridSize) }

    occupied.add(cellKey(position.x, position.y))
    positions.push(position)
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
    bombsLeft: safeConfig.bombsPerTank,
    minesLeft: safeConfig.minesPerTank,
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
