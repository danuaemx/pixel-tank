import { DIRECTIONS } from '../game'
import type {
  BombDistanceSource,
  CommandType,
  CompareOperator,
  ConditionKind,
  Direction,
  NumericRegister,
} from '../game'

export const DEFAULT_UI_FONT_SIZE = 17
export const MIN_UI_FONT_SIZE = 5
export const MAX_UI_FONT_SIZE = 24

export const DEFAULT_MASTER_VOLUME = 170
export const MIN_MASTER_VOLUME = 30
export const MAX_MASTER_VOLUME = 320

export const NAV_ICONS = {
  quick: ['#    ', '##   ', '###  ', '##   ', '#    '],
  config: [' ### ', '# # #', ' ### ', '# # #', ' ### '],
  program: ['#####', '#   #', '#####', '#   #', '#####'],
  tutorial: ['#### ', '#   #', '#### ', '#   #', '#   #'],
  credits: ['  #  ', '# # #', ' ### ', '# # #', '  #  '],
  add: ['  #  ', '  #  ', '#####', '  #  ', '  #  '],
  back: [' #    ', '##    ', '##### ', '##    ', ' #    '],
  save: ['#####', '#   #', '# # #', '#   #', '#####'],
  load: ['#### ', '#   #', '###  ', '# #  ', '###  '],
  cancel: ['#   #', ' # # ', '  #  ', ' # # ', '#   #'],
  restart: [' ### ', '#   #', '## ##', '#   #', ' ### '],
  menu: ['#####', '# # #', '#   #', '# # #', '#####'],
  start: ['#    ', '##   ', '###  ', '##   ', '#    '],
  tips: ['  #  ', ' ### ', '#####', ' ### ', '  #  '],
}

export type CommandLibraryItem = {
  type: CommandType
  desc: string
  logo: {
    color: string
    grid: string[]
  }
}

export const COMMAND_LIBRARY: CommandLibraryItem[] = [
  {
    type: 'MOVER',
    desc: 'Mueve casilla en dirección.',
    logo: {
      color: '#38bdf8',
      grid: ['  #  ', ' ### ', '#####', ' ### ', '  #  ', '  #  ', '  #  '],
    },
  },
  {
    type: 'DISPARAR',
    desc: 'Ataque instantáneo línea recta.',
    logo: {
      color: '#f87171',
      grid: [' ### ', '#####', ' # # ', ' # # ', '  #  ', '  #  ', '  #  '],
    },
  },
  {
    type: 'COLOCAR_MINA',
    desc: 'Deja mina en casilla (daño 40).',
    logo: {
      color: '#facc15',
      grid: ['  #  ', ' ### ', '#####', ' ### ', '  #  '],
    },
  },
  {
    type: 'BOMBA',
    desc: 'Radial 3x3 a distancia.',
    logo: {
      color: '#ef4444',
      grid: ['#   #', ' # # ', '  #  ', ' ### ', '#####', ' ### ', '  #  '],
    },
  },
  {
    type: 'RAD',
    desc: 'Radar (- tanque, + estación).',
    logo: {
      color: '#4ade80',
      grid: ['  #  ', ' # # ', '#   #', '  #  ', '  #  ', '  #  ', ' ### '],
    },
  },
  {
    type: 'IF',
    desc: 'Si falla, salta línea.',
    logo: {
      color: '#a78bfa',
      grid: [' ### ', '#   #', '   # ', '  #  ', '     ', '  #  ', '  #  '],
    },
  },
  {
    type: 'ESPERA',
    desc: 'Sin acción.',
    logo: {
      color: '#94a3b8',
      grid: ['#####', ' # # ', '  #  ', ' # # ', '#####'],
    },
  },
]

export const CONDITION_OPTIONS: Array<{ kind: ConditionKind; label: string }> = [
  { kind: 'TRUE', label: 'TRUE' },
  { kind: 'REGISTER_COMPARE', label: 'REGISTRO OP VALOR' },
  { kind: 'DAÑO', label: 'DAÑO_DIR != NONE' },
  { kind: 'DIR_MOV_EQ', label: 'DIR_MOV == dir' },
]

export const REGISTER_OPTIONS: NumericRegister[] = ['RAD', 'SALUD']
export const COMPARE_OPERATORS: CompareOperator[] = ['<=', '<', '>', '>=', '==']
export const DIST_SOURCE_OPTIONS: BombDistanceSource[] = ['VAL', 'RAD', 'SALUD']
export const SHOOT_DIRECTION_OPTIONS: Array<Direction | 'RAD_DIR'> = [...DIRECTIONS, 'RAD_DIR']
