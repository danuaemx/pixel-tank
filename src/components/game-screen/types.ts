import type { GameState, Tank } from '../../game'
import type { BoardInfo } from './helpers'

export type GameScreenProps = {
  gameState: GameState | null
  running: boolean
  animatePassiveLines: boolean
  onToggleRunning: () => void
  onAnimatePassiveLinesChange: (enabled: boolean) => void
  onRunSingleStep: () => void
  onRestart: () => void
  onBackToMenu: () => void
  onTickMsChange: (tickMs: number) => void
}

export type SummaryBarProps = {
  gameState: GameState
  running: boolean
  animatePassiveLines: boolean
  aliveTanks: number
  currentTurn: number
  leader: Tank | undefined
  onToggleRunning: () => void
  onAnimatePassiveLinesChange: (enabled: boolean) => void
  onRunSingleStep: () => void
  onRestart: () => void
  onBackToMenu: () => void
  onTickMsChange: (tickMs: number) => void
}

export type BoardProps = {
  gameState: GameState
  boardInfo: BoardInfo
}

export type SidebarProps = {
  gameState: GameState
  animatePassiveLines: boolean
  animatedLineByTankId: Record<string, number>
}
