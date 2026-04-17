import type { CommandType } from '../../game'

export type PixelLogo = { color: string; grid: string[] }

export const CONTROL_ICONS = {
  auto: ['#    ', '##   ', '###  ', '##   ', '#    '],
  manual: ['#####', '#   #', '#####', '#   #', '#####'],
  pause: ['# #', '# #', '# #', '# #', '# #'],
  step: ['#  # ', '## # ', '#### ', '## # ', '#  # '],
  restart: [' ### ', '#   #', '## ##', '#   #', ' ### '],
  menu: ['#####', '     ', '#####', '     ', '#####'],
  speed: ['#  # ', '## ##', '#####', '## ##', '#  # '],
  passive: ['#   #', '#####', '# # #', '#####', '#   #'],
}

export const SUMMARY_ICONS = {
  round: [' ### ', '#   #', '# # #', '#   #', ' ### '],
  turn: ['  #  ', ' ### ', '#####', ' ### ', '  #  '],
  alive: [' ### ', '#####', ' ### ', ' ### ', ' # # '],
  mines: ['  #  ', ' ### ', '#####', ' ### ', '  #  '],
  stations: ['  #  ', '  #  ', '#####', '  #  ', '  #  '],
  leader: [' ### ', '# # #', '# # #', '# # #', ' ### '],
}

export const COMMAND_LOGOS: Record<CommandType, PixelLogo> = {
  MOVER: {
    color: '#38bdf8',
    grid: ['  #  ', ' ### ', '#####', ' ### ', '  #  ', '  #  ', '  #  '],
  },
  DISPARAR: {
    color: '#f87171',
    grid: [' ### ', '#####', ' # # ', ' # # ', '  #  ', '  #  ', '  #  '],
  },
  COLOCAR_MINA: {
    color: '#facc15',
    grid: ['  #  ', ' ### ', '#####', ' ### ', '  #  '],
  },
  BOMBA: {
    color: '#ef4444',
    grid: ['#   #', ' # # ', '  #  ', ' ### ', '#####', ' ### ', '  #  '],
  },
  RAD: {
    color: '#4ade80',
    grid: ['  #  ', ' # # ', '#   #', '  #  ', '  #  ', '  #  ', ' ### '],
  },
  IF: {
    color: '#a78bfa',
    grid: [' ### ', '#   #', '   # ', '  #  ', '     ', '  #  ', '  #  '],
  },
  ESPERA: {
    color: '#94a3b8',
    grid: ['#####', ' # # ', '  #  ', ' # # ', '#####'],
  },
  LABEL: {
    color: '#f472b6',
    grid: ['#### ', '#   #', '#### ', '#    ', '#    '],
  },
  JUMP: {
    color: '#fb923c',
    grid: [' ### ', '#   #', '    #', '  ## ', ' #   ', '#### '],
  },
}

export const SCORE_STAT_ICONS = {
  health: { color: '#ef4444', grid: [' ### ', '#####', ' ### ', ' ### ', ' # # '] },
  kills: { color: '#ef4444', grid: ['#   #', ' # # ', '  #  ', ' # # ', '#   #'] },
  bombs: {
    color: '#ef4444',
    grid: ['#   #', ' # # ', '  #  ', ' ### ', '#####', ' ### ', '  #  '],
  },
  mines: { color: '#facc15', grid: ['  #  ', ' ### ', '#####', ' ### ', '  #  '] },
  rad: {
    color: '#4ade80',
    grid: ['  #  ', ' # # ', '#   #', '  #  ', '  #  ', '  #  ', ' ### '],
  },
  radDir: { color: '#22d3ee', grid: [' ### ', '#   #', '# # #', '#   #', ' ### '] },
  danoDir: { color: '#38bdf8', grid: ['  #  ', ' # # ', '  #  ', '  #  ', '  #  '] },
  dirMov: {
    color: '#a78bfa',
    grid: ['  #  ', ' ### ', '#####', ' ### ', '  #  ', '  #  ', '  #  '],
  },
  score: { color: '#fcd34d', grid: [' ### ', ' # # ', ' ### ', '  #  ', '  #  '] },
}
