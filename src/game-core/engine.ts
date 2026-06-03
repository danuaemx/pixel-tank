import { DIR_VECTORS } from './_const'
import {
  cellKey,
  clamp,
  createId,
  evaluateCondition,
  getMineAt,
  getRadReading,
  getStationAt,
  getTankAt,
  inBounds,
  nextIndex,
  opposite,
  pickRandomFreeCell,
  resolveBombDistance,
  resolveCommandDirection,
} from './utils'
import type {
  Command,
  Direction,
  EffectKind,
  GameState,
  RegisterDirection,
  SoundKey,
  Tank,
} from './types'

type ExplosionKind = 'explosion' | 'explosion-shot' | 'explosion-mine' | 'explosion-bomb'

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

function damageStationsInArea(
  state: GameState,
  x: number,
  y: number,
  sourceIndex?: number,
  explosionKind: ExplosionKind = 'explosion',
): void {
  const stationIndex = getStationAt(state, x, y)
  if (stationIndex < 0) {
    return
  }

  state.stations[stationIndex].hp -= 1

  if (state.stations[stationIndex].hp <= 0) {
    const destroyed = state.stations.splice(stationIndex, 1)[0]
    pushLog(state, `Estación en (${destroyed.x},${destroyed.y}) destruida.`)
    addEffect(state, explosionKind, destroyed.x, destroyed.y, 2)

    if (sourceIndex !== undefined && sourceIndex >= 0) {
      const attacker = state.tanks[sourceIndex]
      if (attacker && attacker.alive) {
        attacker.score += 300
        healTank(state, sourceIndex, 20, 'destruir estación')
      }
    }
  }
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

function moveStations(state: GameState): void {
  if (state.stations.length === 0) {
    return
  }

  const occupied = createOccupiedSet(state)

  state.stations.forEach((station) => {
    // Quitamos la estación actual del conjunto para poder reubicarla sin bloquearse a sí misma.
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
    addEffect(state, 'explosion-mine', tank.x, tank.y, 3)
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
  const range = state.config.shotRange ?? 3
  pushSound(state, 'shoot')

  for (let distance = 1; distance <= range; distance += 1) {
    const x = shooter.x + vector.x * distance
    const y = shooter.y + vector.y * distance

    if (!inBounds(state.config.gridSize, x, y)) {
      break
    }

    addEffect(state, 'shot', x, y, 2)

    if (state.walls.has(cellKey(x, y))) {
      break
    }

    const stationIndex = getStationAt(state, x, y)
    if (stationIndex >= 0) {
      damageStationsInArea(state, x, y, tankIndex, 'explosion-shot')
      break
    }

    const mineIndex = getMineAt(state, x, y)
    if (mineIndex >= 0) {
      state.mines.splice(mineIndex, 1)
      addEffect(state, 'explosion-shot', x, y, 2)
      break
    }

    const hitTankIndex = getTankAt(state, x, y, shooter.id)
    if (hitTankIndex >= 0) {
      addEffect(state, 'explosion-shot', x, y, 2)
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

  // La bomba avanza casilla a casilla y se detiene en el borde del mapa.
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
        addEffect(state, 'explosion-bomb', x, y, chebyshev <= 1 ? 3 : 2)
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
  // La explosión afecta un cuadrado 5x5 alrededor del impacto, con intensidad por distancia Chebyshev.
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
      damageStationsInArea(state, x, y, tankIndex, 'explosion-bomb')
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

  const passiveCount = 0
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
      case 'RAD': {
        const dir = command.dir ?? 'N'
        tank.registers.RAD = getRadReading(state, tank, dir)
        tank.registers.RAD_DIR = dir
        tank.ip = nextIndex(tank.ip, program.length, 1)
        didAction = true
        break
      }
      case 'IF': {
        const conditionResult = evaluateCondition(command.condition, tank, state)
        if (conditionResult && command.action) {
          switch (command.action.type) {
            case 'MOVER': {
              performMove(state, tankIndex, command.action.dir ?? 'N')
              didAction = true
              break
            }
            case 'DISPARAR': {
              const shootDir = resolveCommandDirection(command.action as Command, tank)
              performShoot(state, tankIndex, shootDir)
              didAction = true
              break
            }
            case 'COLOCAR_MINA': {
              performMinePlacement(state, tankIndex)
              didAction = true
              break
            }
            case 'BOMBA': {
              const bombDir = resolveCommandDirection(command.action as Command, tank)
              const distance = resolveBombDistance(command.action as Command, tank, state.config.gridSize)
              performBomb(state, tankIndex, bombDir, distance)
              didAction = true
              break
            }
            case 'RAD': {
              const dir = command.action.dir ?? 'N'
              tank.registers.RAD = getRadReading(state, tank, dir)
              tank.registers.RAD_DIR = dir
              didAction = true
              break
            }
            case 'ESPERA':
            default: {
              tank.lastAction = 'ESPERA'
              didAction = true
              break
            }
          }
        }
        if (command.action) {
          tank.ip = nextIndex(tank.ip, program.length, 1)
        } else {
          tank.ip = nextIndex(tank.ip, program.length, conditionResult ? 1 : 2)
        }
        didAction = true
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
      // Si el programa solo produce saltos o comprobaciones, forzamos una salida para evitar bucles infinitos.
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
