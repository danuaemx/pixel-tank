import {
  commandToText,
  createCommandTemplate,
  DIRECTIONS,
  type BombDistanceSource,
  type Command,
  type CommandType,
  type CompareOperator,
  type Condition,
  type ConditionKind,
  type Direction,
  type GameConfig,
  type NumericRegister,
  type ShootDirectionSource,
} from '../../game'
import { PixelIcon } from '../../components/PixelIcon'
import {
  COMMAND_LIBRARY,
  COMPARE_OPERATORS,
  CONDITION_OPTIONS,
  DIST_SOURCE_OPTIONS,
  NAV_ICONS,
  REGISTER_OPTIONS,
  SHOOT_DIRECTION_OPTIONS,
} from '../_const'
import { PixelSelect } from '../components/PixelSelect'
import { createDefaultCondition, getConditionForEditor } from '../utils'
import type { DragPayload } from '../types'

type ProgramEditorScreenProps = {
  config: GameConfig
  selectedTank: number
  currentProgram: Command[]
  showProgramTips: boolean
  recentlyAddedCommandId: string | null
  dragPayload: DragPayload | null
  programAreaRef: React.RefObject<HTMLDivElement | null>
  setShowProgramTips: (value: boolean) => void
  setSelectedTank: (index: number) => void
  setDragPayload: (payload: DragPayload | null) => void
  addCommandByClick: (type: CommandType) => void
  moveCommandUp: (index: number) => void
  moveCommandDown: (index: number, total: number) => void
  removeCommand: (index: number) => void
  handleDropAt: (index: number) => void
  patchCommand: (index: number, updater: (command: Command) => void) => void
  getCondition: (command: Command) => Condition
  getIfDependencyDepth: (program: Command[], index: number) => number
  renderProgramField: (label: string, control: React.ReactNode, className?: string) => React.ReactNode
  onBackToConfig: () => void
  onStartSimulation: () => void
  onBackToMenu: () => void
}

export function ProgramEditorScreen({
  config,
  selectedTank,
  currentProgram,
  showProgramTips,
  recentlyAddedCommandId,
  dragPayload,
  programAreaRef,
  setShowProgramTips,
  setSelectedTank,
  setDragPayload,
  addCommandByClick,
  moveCommandUp,
  moveCommandDown,
  removeCommand,
  handleDropAt,
  patchCommand,
  getCondition,
  getIfDependencyDepth,
  renderProgramField,
  onBackToConfig,
  onStartSimulation,
  onBackToMenu,
}: ProgramEditorScreenProps) {
  return (
    <section className={`panel editor-screen ${showProgramTips ? '' : 'tips-hidden'}`}>
      <div className="program-top-bar">
        <h2 className="program-top-title">Programador de tanques</h2>

        <div className="program-top-controls">
          <div className="program-top-actions">
            <button className="pixel-btn program-icon-btn" title="Volver a configuración" aria-label="Volver a configuración" onClick={onBackToConfig}>
              <PixelIcon color="#064e3b" grid={NAV_ICONS.back} />
            </button>
            <button className="pixel-btn program-icon-btn" title="Iniciar simulación" aria-label="Iniciar simulación" onClick={onStartSimulation}>
              <PixelIcon color="#064e3b" grid={NAV_ICONS.start} />
            </button>
            <button className="pixel-btn program-icon-btn" title="Volver al menú" aria-label="Volver al menú" onClick={onBackToMenu}>
              <PixelIcon color="#064e3b" grid={NAV_ICONS.menu} />
            </button>
          </div>

          <label className="tips-toggle" title={showProgramTips ? 'Ocultar tips' : 'Mostrar tips'}>
            <input
              type="checkbox"
              checked={showProgramTips}
              aria-label="Mostrar u ocultar tips del editor"
              onChange={(event) => setShowProgramTips(event.target.checked)}
            />
            <span className="tips-toggle-track">
              <span className="tips-toggle-thumb" />
            </span>
            <span className="tips-toggle-icon">
              <PixelIcon color={showProgramTips ? '#fcd34d' : '#94a3b8'} grid={NAV_ICONS.tips} />
            </span>
          </label>
        </div>
      </div>

      <div className="tank-tabs">
        {Array.from({ length: config.players }, (_, index) => {
          const selected = index === selectedTank
          return (
            <button
              key={`tab-${index + 1}`}
              className={`tank-tab ${selected ? 'active' : ''}`}
              onClick={() => setSelectedTank(index)}
            >
              T{index + 1}
            </button>
          )
        })}
      </div>

      <div className="editor-layout">
        <div className="palette">
          <h3>Comandos</h3>
          <ul>
            {COMMAND_LIBRARY.map((item) => (
              <li key={item.type} className="palette-item">
                <div className="palette-header">
                  <span className="palette-icon">
                    <PixelIcon color={item.logo.color} grid={item.logo.grid} />
                  </span>
                  <span className="palette-title">{item.type}</span>
                </div>
                <div className="palette-actions">
                  <button
                    className="small-btn palette-add-btn"
                    type="button"
                    title={`Agregar ${item.type}`}
                    aria-label={`Agregar ${item.type}`}
                    onClick={() => addCommandByClick(item.type)}
                  >
                    <PixelIcon color="#064e3b" grid={NAV_ICONS.add} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="program-area" ref={programAreaRef}>
          <h3>Programa de T{selectedTank + 1}</h3>

          <ul className="program-list">
            {currentProgram.map((command, index) => {
              const condition = getCondition(command)
              const bombDistSource = command.distSource ?? 'VAL'
              const ifDepth = Math.min(4, getIfDependencyDepth(currentProgram, index))
              const closesPreviousIf = currentProgram[index - 1]?.type === 'IF'

              return (
                <li
                  key={command.id}
                  className={[
                    'program-row',
                    command.id === recentlyAddedCommandId ? 'is-new-line' : '',
                    ifDepth > 0 ? `if-depth-${ifDepth}` : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  draggable
                  onDragStart={() => setDragPayload({ kind: 'program', index })}
                  onDragEnd={() => setDragPayload(null)}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={(event) => {
                    event.preventDefault()
                    const targetIndex =
                      dragPayload?.kind === 'program' && dragPayload.index < index ? index + 1 : index
                    handleDropAt(targetIndex)
                  }}
                >
                  {ifDepth > 0 && (
                    <div className="if-guides" aria-hidden="true">
                      {Array.from({ length: ifDepth }, (_, guideIndex) => (
                        <span key={`${command.id}-guide-${guideIndex}`} className="if-guide-line" />
                      ))}
                    </div>
                  )}

                  <div className="row-controls compact-controls">
                    <div className="row-topline">
                      <span className="row-num">{index + 1}</span>
                      <div className="row-move">
                        <button
                          className="small-btn row-move-btn"
                          type="button"
                          title="Subir línea"
                          disabled={index === 0}
                          onClick={() => moveCommandUp(index)}
                        >
                          ↑
                        </button>
                        <button
                          className="small-btn row-move-btn"
                          type="button"
                          title="Bajar línea"
                          disabled={index === currentProgram.length - 1}
                          onClick={() => moveCommandDown(index, currentProgram.length)}
                        >
                          ↓
                        </button>
                      </div>
                      <span className="row-command-chip">{command.type}</span>
                      <div className="code-preview code-inline">{commandToText(command)}</div>
                      <button
                        className="small-btn danger row-delete"
                        type="button"
                        title="Quitar línea"
                        onClick={() => removeCommand(index)}
                      >
                        X
                      </button>
                    </div>

                    <div className="row-detailline">
                      {renderProgramField(
                        'TIPO',
                        <PixelSelect
                          title="Tipo"
                          value={command.type}
                          options={COMMAND_LIBRARY.map((item) => ({ value: item.type, label: item.type }))}
                          onChange={(selectedType) => {
                            const nextType = selectedType as CommandType
                            patchCommand(index, (next) => {
                              const reset = createCommandTemplate(nextType)
                              next.type = reset.type
                              next.dir = reset.dir
                              next.dirSource = reset.dirSource
                              next.dist = reset.dist
                              next.distSource = reset.distSource
                              next.label = reset.label
                              next.condition = reset.condition
                            })
                          }}
                        />,
                      )}

                      {(command.type === 'MOVER' || command.type === 'RAD') && (
                        renderProgramField(
                          'DIR',
                          <PixelSelect
                            title="DIR"
                            value={command.dir ?? 'N'}
                            options={DIRECTIONS.map((dir) => ({ value: dir, label: dir }))}
                            onChange={(selectedDir) => {
                              const dir = selectedDir as Direction
                              patchCommand(index, (next) => {
                                next.dir = dir
                              })
                            }}
                          />,
                        )
                      )}

                      {command.type === 'DISPARAR' &&
                        renderProgramField(
                          'DIR',
                          <PixelSelect
                            title="DIR"
                            value={command.dirSource === 'RAD_DIR' ? 'RAD_DIR' : command.dir ?? 'N'}
                            options={SHOOT_DIRECTION_OPTIONS.map((option) => ({ value: option, label: option }))}
                            onChange={(value) => {
                              const selected = value as Direction | 'RAD_DIR'
                              patchCommand(index, (next) => {
                                if (selected === 'RAD_DIR') {
                                  next.dirSource = selected as ShootDirectionSource
                                  return
                                }

                                next.dir = selected
                                next.dirSource = 'VAL'
                              })
                            }}
                          />,
                        )}

                      {command.type === 'BOMBA' && (
                        <>
                          {renderProgramField(
                            'DIR',
                            <PixelSelect
                              title="DIR"
                              value={command.dirSource === 'RAD_DIR' ? 'RAD_DIR' : command.dir ?? 'N'}
                              options={SHOOT_DIRECTION_OPTIONS.map((option) => ({ value: option, label: option }))}
                              onChange={(value) => {
                                const selected = value as Direction | 'RAD_DIR'
                                patchCommand(index, (next) => {
                                  if (selected === 'RAD_DIR') {
                                    next.dirSource = selected as ShootDirectionSource
                                    return
                                  }

                                  next.dir = selected
                                  next.dirSource = 'VAL'
                                })
                              }}
                            />,
                          )}

                          {renderProgramField(
                            'DIST',
                            <PixelSelect
                              title="Fuente de DIST"
                              value={bombDistSource}
                              options={DIST_SOURCE_OPTIONS.map((source) => ({
                                value: source,
                                label: source === 'RAD' ? '|RAD|' : source,
                              }))}
                              onChange={(value) => {
                                const distSource = value as BombDistanceSource
                                patchCommand(index, (next) => {
                                  next.distSource = distSource
                                })
                              }}
                            />,
                          )}

                          {bombDistSource === 'VAL' && (
                            renderProgramField(
                              'VAL',
                              <div className="field-inline-control">
                                <input
                                  className="symbol-input symbol-input-sm"
                                  title="DIST"
                                  type="number"
                                  min={1}
                                  max={config.gridSize}
                                  value={command.dist ?? 2}
                                  onChange={(event) => {
                                    const parsed = Number(event.target.value)
                                    const safeParsed = Number.isFinite(parsed) ? parsed : 1
                                    const dist = Math.min(config.gridSize, Math.max(1, safeParsed))
                                    patchCommand(index, (next) => {
                                      next.dist = dist
                                    })
                                  }}
                                />
                                <button
                                  className="small-btn field-quick-btn"
                                  type="button"
                                  title="Usar valor absoluto de RAD"
                                  onClick={() => {
                                    patchCommand(index, (next) => {
                                      next.distSource = 'RAD'
                                    })
                                  }}
                                >
                                  |RAD|
                                </button>
                              </div>,
                              'field-val',
                            )
                          )}
                        </>
                      )}

                      {command.type === 'LABEL' && (
                        renderProgramField(
                          'LABEL',
                          <input
                            className="symbol-input"
                            title="Nombre de la etiqueta"
                            type="text"
                            value={command.label ?? 'LOOP'}
                            onChange={(event) => {
                              patchCommand(index, (next) => {
                                next.label = event.target.value.toUpperCase()
                              })
                            }}
                          />,
                        )
                      )}

                      {(command.type === 'IF' || command.type === 'JUMP') && (
                        <>
                          {renderProgramField(
                            'COND',
                            <PixelSelect
                              title="Condición"
                              value={condition.kind}
                              options={CONDITION_OPTIONS.map((option) => ({
                                value: option.kind,
                                label: option.label,
                              }))}
                              onChange={(value) => {
                                const kind = value as ConditionKind
                                patchCommand(index, (next) => {
                                  next.condition = createDefaultCondition(kind)
                                })
                              }}
                            />,
                          )}

                          {condition.kind === 'REGISTER_COMPARE' && (
                            <>
                              {renderProgramField(
                                'REG',
                                <PixelSelect
                                  title="Registro"
                                  value={condition.register ?? 'RAD'}
                                  options={REGISTER_OPTIONS.map((register) => ({
                                    value: register,
                                    label: register,
                                  }))}
                                  onChange={(value) => {
                                    const register = value as NumericRegister
                                    patchCommand(index, (next) => {
                                      const current = getConditionForEditor(next.condition)
                                      next.condition = {
                                        ...(current.kind === 'REGISTER_COMPARE'
                                          ? current
                                          : createDefaultCondition('REGISTER_COMPARE')),
                                        register,
                                      }
                                    })
                                  }}
                                />,
                              )}

                              {renderProgramField(
                                'OP',
                                <PixelSelect
                                  title="Operador"
                                  value={condition.operator ?? '>'}
                                  options={COMPARE_OPERATORS.map((operator) => ({
                                    value: operator,
                                    label: operator,
                                  }))}
                                  onChange={(value) => {
                                    const operator = value as CompareOperator
                                    patchCommand(index, (next) => {
                                      const current = getConditionForEditor(next.condition)
                                      next.condition = {
                                        ...(current.kind === 'REGISTER_COMPARE'
                                          ? current
                                          : createDefaultCondition('REGISTER_COMPARE')),
                                        operator,
                                      }
                                    })
                                  }}
                                />,
                              )}

                              {renderProgramField(
                                'VAL',
                                <input
                                  className="symbol-input symbol-input-sm"
                                  title="Valor"
                                  type="number"
                                  value={condition.value ?? 0}
                                  onChange={(event) => {
                                    const parsed = Number(event.target.value)
                                    const value = Number.isFinite(parsed) ? parsed : 0
                                    patchCommand(index, (next) => {
                                      const current = getConditionForEditor(next.condition)
                                      next.condition = {
                                        ...(current.kind === 'REGISTER_COMPARE'
                                          ? current
                                          : createDefaultCondition('REGISTER_COMPARE')),
                                        value,
                                      }
                                    })
                                  }}
                                />,
                                'field-val',
                              )}
                            </>
                          )}

                          {condition.kind === 'DIR_MOV_EQ' && (
                            renderProgramField(
                              'DIRC',
                              <PixelSelect
                                title="DIR"
                                value={condition.dir ?? 'N'}
                                options={DIRECTIONS.map((dir) => ({ value: dir, label: dir }))}
                                onChange={(value) => {
                                  const dir = value as Direction
                                  patchCommand(index, (next) => {
                                    const current = getConditionForEditor(next.condition)
                                    next.condition = {
                                      ...(current.kind === 'DIR_MOV_EQ'
                                        ? current
                                        : createDefaultCondition('DIR_MOV_EQ')),
                                      dir,
                                    }
                                  })
                                }}
                              />,
                            )
                          )}
                        </>
                      )}

                      {command.type === 'JUMP' && (
                        renderProgramField(
                          'LABEL',
                          <input
                            className="symbol-input"
                            title="Línea o LABEL a saltar"
                            type="text"
                            value={command.label ?? 'LOOP'}
                            onChange={(event) => {
                              patchCommand(index, (next) => {
                                next.label = event.target.value.toUpperCase()
                              })
                            }}
                          />,
                        )
                      )}
                    </div>

                    {closesPreviousIf && (
                      <div className="if-end-marker" aria-label="ENDIF automático">
                        <span className="if-end-line" />
                        <span>ENDIF</span>
                      </div>
                    )}
                  </div>
                </li>
              )
            })}
          </ul>
        </div>
      </div>
    </section>
  )
}
