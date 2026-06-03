// Este archivo define los tipos utilizados en el juego de tanques.

export type Direction = 'N' | 'S' | 'E' | 'O'
export type RegisterDirection = Direction | 'NONE'

export type CommandType =
  | 'MOVER'
  | 'DISPARAR'
  | 'COLOCAR_MINA'
  | 'BOMBA'
  | 'RAD'
  | 'IF'
  | 'ESPERA'

export type NumericRegister = 'RAD' | 'SALUD'
export type CompareOperator = '<' | '>' | '='
export type BombDistanceSource = 'VAL' | NumericRegister
export type ShootDirectionSource = 'VAL' | 'RAD_DIR'

export type ConditionKind =
  | 'TRUE'
  | 'REGISTER_COMPARE'
  | 'DAÑO'
  | 'DIR_MOV_EQ'

export type SoundKey =
  | 'move'
  | 'shoot'
  | 'mine'
  | 'bomb'
  | 'hit'
  | 'heal'
  | 'collision'
  | 'win'

export interface Condition {
  kind: ConditionKind
  register?: NumericRegister
  operator?: CompareOperator
  value?: number
  dir?: Direction
}

export interface Command {
  id: string
  type: CommandType
  dir?: Direction
  dirSource?: ShootDirectionSource
  dist?: number
  distSource?: BombDistanceSource
  condition?: Condition
  action?: {
    type: CommandType
    dir?: Direction
    dirSource?: ShootDirectionSource
    dist?: number
    distSource?: BombDistanceSource
  }
}

export interface TankRegisters {
  RAD: number
  RAD_DIR: RegisterDirection
  DANO_DIR: RegisterDirection
  DIR_MOV: RegisterDirection
  SALUD: number
}

export interface Tank {
  id: string
  name: string
  color: string
  x: number
  y: number
  alive: boolean
  health: number
  kills: number
  score: number
  finalScore?: number
  bombsLeft: number
  minesLeft: number
  ip: number
  lastExecutedIp: number
  lastExecutionTrace: number[]
  lastCommandType: CommandType
  lastAction: string
  program: Command[]
  registers: TankRegisters
}

export interface Mine {
  id: string
  x: number
  y: number
  ownerId: string
}

export interface Station {
  id: string
  x: number
  y: number
  hp: number
}

export type EffectKind =
  | 'move'
  | 'shot'
  | 'explosion'
  | 'explosion-shot'
  | 'explosion-mine'
  | 'explosion-bomb'
  | 'heal'
  | 'mine'
  | 'hit'

export interface Effect {
  id: string
  x: number
  y: number
  kind: EffectKind
  ttl: number
}

export interface GameConfig {
  players: number
  gridSize: number
  passiveLimit: number
  maxRounds: number
  bombsPerTank: number
  minesPerTank: number
  wallDensity: number
  stationCount: number
  tickMs: number
  shotRange: number
  radarRange: number
}

export interface GameState {
  config: GameConfig
  tanks: Tank[]
  walls: Set<string>
  mines: Mine[]
  stations: Station[]
  effects: Effect[]
  round: number
  turnIndex: number
  lastActorId: string | null
  finished: boolean
  winnerId?: string
  log: string[]
  soundEvents: SoundKey[]
}
