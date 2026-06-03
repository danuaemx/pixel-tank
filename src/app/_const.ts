import type { ElementType } from 'react'
import { DIRECTIONS } from '../game'
import { COMMAND_LOGOS } from '../components/game-screen/_const'
import {
  IconBolt,
  IconSettings,
  IconCode,
  IconBook,
  IconStar,
  IconPlus,
  IconArrowLeft,
  IconDeviceFloppy,
  IconFolderDown,
  IconX,
  IconRefresh,
  IconMenu2,
  IconBulb,
} from '@tabler/icons-react'
import type {
  BombDistanceSource,
  CommandType,
  CompareOperator,
  ConditionKind,
  Direction,
  NumericRegister,
} from '../game'

export const DEFAULT_UI_FONT_SIZE = 18
export const MIN_UI_FONT_SIZE = 5
export const MAX_UI_FONT_SIZE = 24

export const DEFAULT_MASTER_VOLUME = 170
export const MIN_MASTER_VOLUME = 30
export const MAX_MASTER_VOLUME = 320
export const MASTER_VOLUME_DISPLAY_REFERENCE = 315
export const MASTER_VOLUME_DISPLAY_MAX = 60

export const NAV_ICONS = {
  quick: IconBolt,
  config: IconSettings,
  program: IconCode,
  tutorial: IconBook,
  credits: IconStar,
  add: IconPlus,
  back: IconArrowLeft,
  save: IconDeviceFloppy,
  load: IconFolderDown,
  cancel: IconX,
  restart: IconRefresh,
  menu: IconMenu2,
  start: IconBolt,
  tips: IconBulb,
}

export type CommandLibraryItem = {
  type: CommandType
  desc: string
  logo: {
    color: string
    icon: ElementType
  }
}

export const COMMAND_LIBRARY: CommandLibraryItem[] = [
  {
    type: 'MOVER',
    desc: 'Mueve casilla en dirección.',
    logo: COMMAND_LOGOS.MOVER,
  },
  {
    type: 'DISPARAR',
    desc: 'Ataque instantáneo línea recta.',
    logo: COMMAND_LOGOS.DISPARAR,
  },
  {
    type: 'COLOCAR_MINA',
    desc: 'Deja mina en casilla (daño 40).',
    logo: COMMAND_LOGOS.COLOCAR_MINA,
  },
  {
    type: 'BOMBA',
    desc: 'Radial 3x3 a distancia.',
    logo: COMMAND_LOGOS.BOMBA,
  },
  {
    type: 'RAD',
    desc: 'Radar (- tanque, + estación).',
    logo: COMMAND_LOGOS.RAD,
  },
  {
    type: 'IF',
    desc: 'Si falla, salta línea.',
    logo: COMMAND_LOGOS.IF,
  },
  {
    type: 'ESPERA',
    desc: 'Sin acción.',
    logo: COMMAND_LOGOS.ESPERA,
  },
]

export const CONDITION_OPTIONS: Array<{ kind: ConditionKind; label: string }> = [
  { kind: 'TRUE', label: 'TRUE' },
  { kind: 'REGISTER_COMPARE', label: 'REGISTRO OP VALOR' },
  { kind: 'DAÑO', label: 'DAÑO_DIR != NONE' },
  { kind: 'DIR_MOV_EQ', label: 'DIR_MOV = dir' },
]

export const REGISTER_OPTIONS: NumericRegister[] = ['RAD', 'SALUD']
export const COMPARE_OPERATORS: CompareOperator[] = ['<', '>', '=']
export const DIST_SOURCE_OPTIONS: BombDistanceSource[] = ['VAL', 'RAD', 'SALUD']
export const SHOOT_DIRECTION_OPTIONS: Array<Direction | 'RAD_DIR'> = [...DIRECTIONS, 'RAD_DIR']
