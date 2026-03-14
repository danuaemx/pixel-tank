import type { CommandType, Direction } from './types'

export const MIN_PLAYERS = 2
export const MAX_PLAYERS = 6
export const MIN_GRID_SIZE = 6
export const MAX_GRID_SIZE = 15
export const MIN_PASSIVE_LIMIT = 0
export const MAX_PASSIVE_LIMIT = 50

export const DIRECTIONS: Direction[] = ['N', 'S', 'E', 'O']

export const DIR_SYMBOLS: Record<Direction, string> = {
  N: '↑',
  S: '↓',
  E: '→',
  O: '←',
}

export const DIR_VECTORS: Record<Direction, { x: number; y: number }> = {
  N: { x: 0, y: -1 },
  S: { x: 0, y: 1 },
  E: { x: 1, y: 0 },
  O: { x: -1, y: 0 },
}

export const ACTION_COMMANDS = new Set<CommandType>([
  'MOVER',
  'DISPARAR',
  'COLOCAR_MINA',
  'BOMBA',
  'ESPERA',
])

export const TANK_COLORS = ['#ef4444', '#3b82f6', '#22c55e', '#eab308', '#f97316', '#a855f7']
