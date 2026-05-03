import { ACTION_COMMANDS } from './_const'
import { conditionToText } from './utils'
import type { Command, CommandType, Tank } from './types'

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
