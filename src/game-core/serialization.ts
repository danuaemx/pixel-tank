import { commandToText } from './format'
import { createCommandTemplate } from './setup'
import type { Command, CommandType, Condition } from './types'

type ParsedProgramFile = {
  players: number
  programs: Command[][]
}

function normalizeProgramLine(line: string): string {
  return line.trim()
}

function parseDirectionToken(value: string): 'N' | 'S' | 'E' | 'O' | 'RAD_DIR' {
  const normalized = value.trim().toUpperCase()
  if (normalized === 'RAD_DIR') {
    return 'RAD_DIR'
  }

  if (normalized === 'N' || normalized === 'S' || normalized === 'E' || normalized === 'O') {
    return normalized
  }

  throw new Error(`Dirección inválida: ${value}`)
}

function parseCondition(text: string): Condition {
  const normalized = text.trim().toUpperCase()

  if (normalized === 'TRUE') {
    return { kind: 'TRUE' }
  }

  if (normalized === 'DAÑO_DIR != NONE') {
    return { kind: 'DAÑO' }
  }

  if (normalized.startsWith('DIR_MOV == ')) {
    return { kind: 'DIR_MOV_EQ', dir: parseDirectionToken(normalized.slice('DIR_MOV == '.length)) as 'N' | 'S' | 'E' | 'O' }
  }

  const match = normalized.match(/^(RAD|SALUD)\s*(<=|<|>|>=|==)\s*(-?\d+)$/)
  if (match) {
    return {
      kind: 'REGISTER_COMPARE',
      register: match[1] as 'RAD' | 'SALUD',
      operator: match[2] as '<=' | '<' | '>' | '>=' | '==',
      value: Number(match[3]),
    }
  }

  throw new Error(`Condición inválida: ${text}`)
}

function parseCommandLine(line: string): Command {
  const normalized = normalizeProgramLine(line)

  if (normalized === 'ESPERA') {
    return createCommandTemplate('ESPERA')
  }

  if (normalized === 'COLOCAR_MINA') {
    return createCommandTemplate('COLOCAR_MINA')
  }

  const moveMatch = normalized.match(/^(MOVER|RAD)\((N|S|E|O)\)$/i)
  if (moveMatch) {
    const command = createCommandTemplate(moveMatch[1].toUpperCase() as CommandType)
    command.dir = parseDirectionToken(moveMatch[2]) as 'N' | 'S' | 'E' | 'O'
    return command
  }

  const shootMatch = normalized.match(/^DISPARAR\((N|S|E|O|RAD_DIR)\)$/i)
  if (shootMatch) {
    const command = createCommandTemplate('DISPARAR')
    if (shootMatch[1].toUpperCase() === 'RAD_DIR') {
      command.dirSource = 'RAD_DIR'
    } else {
      command.dir = parseDirectionToken(shootMatch[1]) as 'N' | 'S' | 'E' | 'O'
      command.dirSource = 'VAL'
    }
    return command
  }

  const bombMatch = normalized.match(/^BOMBA\((N|S|E|O|RAD_DIR),\s*(.+)\)$/i)
  if (bombMatch) {
    const command = createCommandTemplate('BOMBA')
    const directionToken = bombMatch[1].toUpperCase()

    if (directionToken === 'RAD_DIR') {
      command.dirSource = 'RAD_DIR'
    } else {
      command.dir = parseDirectionToken(directionToken) as 'N' | 'S' | 'E' | 'O'
      command.dirSource = 'VAL'
    }

    const distanceToken = bombMatch[2].trim().toUpperCase()
    if (distanceToken === '|RAD|') {
      command.distSource = 'RAD'
    } else if (distanceToken === 'SALUD') {
      command.distSource = 'SALUD'
    } else {
      const parsedDistance = Number(distanceToken)
      if (!Number.isFinite(parsedDistance)) {
        throw new Error(`Distancia inválida: ${bombMatch[2]}`)
      }

      command.dist = parsedDistance
      command.distSource = 'VAL'
    }

    return command
  }

  const ifMatch = normalized.match(/^IF\((.*)\)$/i)
  if (ifMatch) {
    const command = createCommandTemplate('IF')
    command.condition = parseCondition(ifMatch[1])
    return command
  }

  throw new Error(`Comando inválido: ${line}`)
}

export function serializeProgramsToText(programs: Command[][], players: number): string {
  const lines: string[] = [`JUGADORES ${players}`]

  programs.forEach((program, index) => {
    lines.push(`TANQUE ${index + 1}`)
    program.forEach((command) => {
      lines.push(commandToText(command))
    })
    lines.push('')
  })

  return lines.join('\n').trimEnd() + '\n'
}

export function parseProgramsFromText(text: string, fallbackPlayers: number): ParsedProgramFile {
  const lines = text.split(/\r?\n/)
  let players = fallbackPlayers
  const programs: Command[][] = []
  let currentProgram: Command[] | null = null

  for (let rawLineIndex = 0; rawLineIndex < lines.length; rawLineIndex += 1) {
    const rawLine = lines[rawLineIndex]
    const line = rawLine.trim()

    if (line.length === 0 || line.startsWith('#')) {
      continue
    }

    const playersMatch = line.match(/^JUGADORES\s+(\d+)$/i)
    if (playersMatch) {
      players = Number(playersMatch[1])
      continue
    }

    const tankMatch = line.match(/^TANQUE\s+(\d+)$/i)
    if (tankMatch) {
      currentProgram = []
      programs.push(currentProgram)
      continue
    }

    if (!currentProgram) {
      throw new Error(`La rutina debe comenzar con una sección TANQUE. Línea ${rawLineIndex + 1}.`)
    }

    currentProgram.push(parseCommandLine(line))
  }

  const safePlayers = Number.isFinite(players) ? Math.max(2, Math.min(6, Math.round(players))) : fallbackPlayers
  return {
    players: safePlayers,
    programs,
  }
}
