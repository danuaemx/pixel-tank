import { commandToText } from './format'
import { createCommandTemplate } from './setup'
import type { Command, CommandType, Condition, Direction, CompareOperator, NumericRegister } from './types'

type ParsedProgramFile = {
  players: number
  programs: (Command[] | undefined)[]
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

  if (normalized.startsWith('DIR_MOV == ') || normalized.startsWith('DIR_MOV = ')) {
    const prefix = normalized.startsWith('DIR_MOV == ') ? 'DIR_MOV == ' : 'DIR_MOV = '
    return { kind: 'DIR_MOV_EQ', dir: parseDirectionToken(normalized.slice(prefix.length)) as 'N' | 'S' | 'E' | 'O' }
  }

  const match = normalized.match(/^(RADAR\((N|S|E|O)\)|RAD|SALUD)\s*(<=|<|>|>=|==|=)\s*(-?\d+)$/)
  if (match) {
    const regToken = match[1]
    let register: NumericRegister = 'RAD'
    let dir: Direction | undefined = undefined

    if (regToken.startsWith('RADAR')) {
      register = 'RAD'
      dir = parseDirectionToken(match[2]) as Direction
    } else {
      register = regToken as NumericRegister
    }

    const operatorStr = match[3]
    let operator: CompareOperator = '='
    if (operatorStr === '==' || operatorStr === '=') {
      operator = '='
    } else if (operatorStr === '<=' || operatorStr === '<') {
      operator = '<'
    } else if (operatorStr === '>=' || operatorStr === '>') {
      operator = '>'
    }

    return {
      kind: 'REGISTER_COMPARE',
      register,
      operator,
      value: Number(match[4]),
      dir,
    }
  }

  throw new Error(`Condición inválida: ${text}`)
}

function parseCommandLine(line: string): Command {
  const normalized = normalizeProgramLine(line)

  if (normalized === 'ESPERAR' || normalized === 'ESPERA') {
    return createCommandTemplate('ESPERA')
  }

  if (normalized === 'MINA' || normalized === 'COLOCAR_MINA') {
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

  const inlineIfMatch = normalized.match(/^IF\((.+)\)\s*:\s*(.+)$/i)
  if (inlineIfMatch) {
    const command = createCommandTemplate('IF')
    command.condition = parseCondition(inlineIfMatch[1])

    const actionText = inlineIfMatch[2].trim()
    const parsedAction = parseCommandLine(actionText)

    command.action = {
      type: parsedAction.type,
      dir: parsedAction.dir,
      dirSource: parsedAction.dirSource,
      dist: parsedAction.dist,
      distSource: parsedAction.distSource,
    }
    return command
  }

  const ifMatch = normalized.match(/^IF\((.*)\)$/i)
  if (ifMatch) {
    const command = createCommandTemplate('IF')
    command.condition = parseCondition(ifMatch[1])
    delete command.action
    return command
  }

  throw new Error(`Comando inválido: ${line}`)
}

export function serializeProgramsToText(programs: Command[][], players: number): string {
  if (programs.length === 1) {
    const lines: string[] = []
    programs[0].forEach((command) => {
      lines.push(commandToText(command))
    })
    return lines.join('\n').trimEnd() + '\n'
  }

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
  const programs: (Command[] | undefined)[] = []
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
      const tankIndex = Number(tankMatch[1]) - 1
      currentProgram = []
      programs[tankIndex] = currentProgram
      continue
    }

    if (!currentProgram) {
      currentProgram = []
      programs[0] = currentProgram
    }

    currentProgram.push(parseCommandLine(line))
  }

  const safePlayers = Number.isFinite(players) ? Math.max(2, Math.min(6, Math.round(players))) : fallbackPlayers
  return {
    players: safePlayers,
    programs,
  }
}
