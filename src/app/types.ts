import type { MusicTheme } from '../audio'
import type { CommandType } from '../game'

export type Screen = 'menu' | 'tutorial' | 'credits' | 'config' | 'program' | 'game'
export type MenuConfirmSource = Exclude<Screen, 'menu'>
export type GameMusicTheme = Extract<MusicTheme, 'game' | 'quick'>

export type DragPayload =
  | {
      kind: 'palette'
      commandType: CommandType
    }
  | {
      kind: 'program'
      index: number
    }
