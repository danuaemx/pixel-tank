import type { ElementType } from 'react'
import type { CommandType } from '../../game'
import {
  IconBolt,
  IconCode,
  IconPlayerPlay,
  IconRefresh,
  IconHome2,
  IconGauge,
  IconListDetails,
  IconHeart,
  IconBulb,
  IconX,
  IconPlus,
  IconTag,
  IconNavigation,
  IconTargetArrow,
  IconBomb,
  IconRadar2,
  IconGitBranch,
  IconClockPause,
} from '@tabler/icons-react'

export type PixelLogo = { color: string; icon: ElementType }

export const CONTROL_ICONS = {
  auto: IconBolt,
  manual: IconCode,
  step: IconPlayerPlay,
  restart: IconRefresh,
  menu: IconHome2,
  speed: IconGauge,
  passive: IconListDetails,
}

export const SUMMARY_ICONS = {
  round: IconHeart,
  turn: IconBulb,
  alive: IconX,
  mines: IconPlus,
  stations: IconPlus,
  leader: IconTag,
}

export const COMMAND_LOGOS: Record<CommandType, PixelLogo> = {
  MOVER: {
    color: '#38bdf8',
    icon: IconNavigation,
  },
  DISPARAR: {
    color: '#f87171',
    icon: IconTargetArrow,
  },
  COLOCAR_MINA: {
    color: '#facc15',
    icon: IconBulb,
  },
  BOMBA: {
    color: '#ef4444',
    icon: IconBomb,
  },
  RAD: {
    color: '#4ade80',
    icon: IconRadar2,
  },
  IF: {
    color: '#a78bfa',
    icon: IconGitBranch,
  },
  ESPERA: {
    color: '#94a3b8',
    icon: IconClockPause,
  },
}

export const SCORE_STAT_ICONS = {
  health: { color: '#fcd34d', icon: IconHeart },
  kills: { color: '#ef4444', icon: IconX },
  bombs: { color: '#ef4444', icon: IconBomb },
  mines: { color: '#facc15', icon: IconBulb },
  rad: { color: '#4ade80', icon: IconRadar2 },
  radDir: { color: '#22d3ee', icon: IconRadar2 },
  danoDir: { color: '#f87171', icon: IconTargetArrow },
  dirMov: { color: '#60a5fa', icon: IconNavigation },
  score: { color: '#a78bfa', icon: IconGitBranch },
}
