import { useRef } from 'react'
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
import { GameIcon } from '../../components/GameIcon'
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

const isTauri = typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window

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
  removeCommand: (index: number) => void
  handleDropAt: (index: number) => void
  patchCommand: (index: number, updater: (command: Command) => void) => void
  getCondition: (command: Command) => Condition
  getIfDependencyDepth: (program: Command[], index: number) => number
  renderProgramField: (label: string, control: React.ReactNode, className?: string) => React.ReactNode
  onExportPrograms: () => void
  onImportPrograms: (text?: string) => void
  onClearProgram: () => void
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
  removeCommand,
  handleDropAt,
  patchCommand,
  getCondition,
  getIfDependencyDepth,
  renderProgramField,
  onExportPrograms,
  onImportPrograms,
  onClearProgram,
  onBackToConfig,
  onStartSimulation,
  onBackToMenu,
}: ProgramEditorScreenProps) {
  const importInputRef = useRef<HTMLInputElement | null>(null)

  const formatCommandTypeLabel = (type: CommandType): string => {
    const labels: Record<CommandType, string> = {
      MOVER: 'Mover',
      DISPARAR: 'Disparar',
      COLOCAR_MINA: 'Colocar_mina',
      BOMBA: 'Bomba',
      RAD: 'Radar',
      IF: 'If',
      ESPERA: 'Espera',
    }

    return labels[type]
  }

  const formatConditionLabel = (kind: ConditionKind): string => {
    const labels: Record<ConditionKind, string> = {
      TRUE: 'Siempre',
      REGISTER_COMPARE: 'Registro operador valor',
      DAÑO: 'Daño_dir distinto de none',
      DIR_MOV_EQ: 'Dir_mov igual a dir',
    }

    return labels[kind]
  }

  const formatRegisterLabel = (register: NumericRegister): string => {
    return register === 'RAD' ? 'Radar' : 'Salud'
  }

  const formatDirectionLabel = (direction: Direction | 'RAD_DIR'): string => {
    if (direction === 'RAD_DIR') {
      return 'Radar_dir'
    }

    if (direction === 'N') {
      return 'Norte'
    }

    if (direction === 'S') {
      return 'Sur'
    }

    if (direction === 'E') {
      return 'Este'
    }

    return 'Oeste'
  }

  const formatCodePreview = (text: string): string => {
    return text
      .replaceAll('COLOCAR_MINA', 'Colocar_mina')
      .replaceAll('DISPARAR', 'Disparar')
      .replaceAll('RAD_DIR', 'Radar_dir')
      .replaceAll('DAÑO_DIR', 'Daño_dir')
      .replaceAll('DIR_MOV', 'Dir_mov')
      .replaceAll('MOVER', 'Mover')
      .replaceAll('BOMBA', 'Bomba')
      .replaceAll('ESPERA', 'Espera')
      .replaceAll('SALUD', 'Salud')
      .replaceAll('TRUE', 'True')
      .replaceAll('NONE', 'None')
      .replaceAll('RAD', 'Radar')
      .replaceAll('IF', 'If')
  }

  const triggerImport = (): void => {
    importInputRef.current?.click()
  }

  return (
    <section className={`panel editor-screen ${showProgramTips ? '' : 'tips-hidden'}`}>
      <div className="program-top-bar">
        <h2 className="program-top-title">Programador de tanques</h2>

        <div className="program-top-controls">
          <div className="program-top-actions">
            <button className="pixel-btn program-icon-btn" title="Volver a configuración" aria-label="Volver a configuración" onClick={onBackToConfig}>
              <GameIcon color="#064e3b" icon={NAV_ICONS.back} />
              <span className="program-icon-label">Config</span>
            </button>
            <button
              className="pixel-btn danger btn-with-icon"
              type="button"
              title="Limpiar solo este tanque"
              aria-label="Limpiar solo este tanque"
              onClick={onClearProgram}
            >
              <span className="btn-icon">
                <GameIcon color="#ffffff" icon={NAV_ICONS.cancel} />
              </span>
              Limpiar
            </button>
            <button className="small-btn btn-with-icon" type="button" title="Guardar tanque en TXT" aria-label="Guardar tanque en TXT" onClick={onExportPrograms}>
              <span className="btn-icon">
                <GameIcon color="#1f2937" icon={NAV_ICONS.save} />
              </span>
              Guardar
            </button>
            <button className="small-btn btn-with-icon" type="button" title="Cargar tanque desde TXT" aria-label="Cargar tanque desde TXT" onClick={isTauri ? () => onImportPrograms() : triggerImport}>
              <span className="btn-icon">
                <GameIcon color="#1f2937" icon={NAV_ICONS.load} />
              </span>
              Cargar
            </button>
            <button className="pixel-btn program-icon-btn program-start-btn" title="Iniciar simulación" aria-label="Iniciar simulación" onClick={onStartSimulation}>
              <GameIcon color="#064e3b" icon={NAV_ICONS.start} />
              <span className="program-icon-label">Jugar</span>
            </button>
            <button className="pixel-btn program-icon-btn" title="Volver al menú" aria-label="Volver al menú" onClick={onBackToMenu}>
              <GameIcon color="#064e3b" icon={NAV_ICONS.menu} />
              <span className="program-icon-label">Menú</span>
            </button>
          </div>

          <input
            ref={importInputRef}
            type="file"
            accept=".txt,text/plain"
            style={{ display: 'none' }}
            onChange={async (event) => {
              const file = event.target.files?.[0]
              event.target.value = ''

              if (!file) {
                return
              }

              try {
                const text = await file.text()
                onImportPrograms(text)
              } catch (error) {
                const message = error instanceof Error ? error.message : 'No se pudo leer el archivo.'
                window.alert(message)
              }
            }}
          />

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
              <GameIcon color={showProgramTips ? '#fcd34d' : '#94a3b8'} icon={NAV_ICONS.tips} />
            </span>
          </label>
        </div>
      </div>

      <div className="editor-layout">
        <div className="palette">
            <h3>Comandos</h3>
            <ul>
              {COMMAND_LIBRARY.map((item) => (
                <li
                  key={item.type}
                  className="palette-item"
                  draggable
                  onDragStart={(event) => {
                    event.dataTransfer.effectAllowed = 'copy'
                    event.dataTransfer.setData('text/plain', item.type)
                    setDragPayload({ kind: 'palette', commandType: item.type })
                  }}
                  onDragEnd={() => setDragPayload(null)}
                >
                  <div className="palette-header">
                    <span className="palette-icon">
                      <GameIcon color={item.logo.color} icon={item.logo.icon} />
                    </span>
                    <span className="palette-title">{formatCommandTypeLabel(item.type)}</span>
                  </div>
                  <div className="palette-actions">
                    <button
                      className="small-btn palette-add-btn"
                      type="button"
                      title={`Agregar ${formatCommandTypeLabel(item.type)}`}
                      aria-label={`Agregar ${formatCommandTypeLabel(item.type)}`}
                      onClick={() => addCommandByClick(item.type)}
                    >
                      <GameIcon color="#064e3b" icon={NAV_ICONS.add} />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
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

        <div className="program-area" ref={programAreaRef}>
          <h3>Programa de T{selectedTank + 1}</h3>

          <ul className="program-list">
            {currentProgram.length === 0 && (
              <li
                className="program-drop-placeholder"
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => {
                  event.preventDefault()
                  handleDropAt(0)
                }}
              >
                Arrastra un comando aquí
              </li>
            )}

            {currentProgram.map((command, index) => {
              const condition = getCondition(command)
              const bombDistSource = command.distSource ?? 'VAL'
              const ifDepth = Math.min(4, getIfDependencyDepth(currentProgram, index))

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
                  onDragStart={(event) => {
                    event.dataTransfer.effectAllowed = 'move'
                    event.dataTransfer.setData('text/plain', String(index))
                    setDragPayload({ kind: 'program', index })
                  }}
                  onDragEnd={() => setDragPayload(null)}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={(event) => {
                    event.preventDefault()
                    event.stopPropagation()
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
                      <span className="row-command-chip">{formatCommandTypeLabel(command.type)}</span>
                      <div className="code-preview code-inline">{formatCodePreview(commandToText(command))}</div>
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
                        'Tipo',
                        <PixelSelect
                          title="Tipo"
                          value={command.type}
                          options={COMMAND_LIBRARY.map((item) => ({
                            value: item.type,
                            label: formatCommandTypeLabel(item.type),
                          }))}
                          onChange={(selectedType) => {
                            const nextType = selectedType as CommandType
                            patchCommand(index, (next) => {
                              const reset = createCommandTemplate(nextType)
                              next.type = reset.type
                              next.dir = reset.dir
                              next.dirSource = reset.dirSource
                              next.dist = reset.dist
                              next.distSource = reset.distSource
                              next.condition = reset.condition
                            })
                          }}
                        />,
                      )}

                      {(command.type === 'MOVER' || command.type === 'RAD') && (
                        renderProgramField(
                          'DIR',
                          <PixelSelect
                            title="Dirección"
                            value={command.dir ?? 'N'}
                            options={DIRECTIONS.map((dir) => ({ value: dir, label: formatDirectionLabel(dir) }))}
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
                            title="Dirección"
                            value={command.dirSource === 'RAD_DIR' ? 'RAD_DIR' : command.dir ?? 'N'}
                            options={SHOOT_DIRECTION_OPTIONS.map((option) => ({
                              value: option,
                              label: formatDirectionLabel(option),
                            }))}
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
                              title="Dirección"
                              value={command.dirSource === 'RAD_DIR' ? 'RAD_DIR' : command.dir ?? 'N'}
                              options={SHOOT_DIRECTION_OPTIONS.map((option) => ({
                                value: option,
                                label: formatDirectionLabel(option),
                              }))}
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
                            'Dist',
                            <PixelSelect
                              title="Fuente de DIST"
                              value={bombDistSource}
                              options={DIST_SOURCE_OPTIONS.map((source) => ({
                                value: source,
                                label: source === 'VAL' ? 'Val' : source === 'RAD' ? '|Radar|' : 'Salud',
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
                              'Val',
                              <div className="field-inline-control">
                                <input
                                  className="symbol-input symbol-input-sm"
                                  title="Dist"
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
                                  title="Usar valor absoluto de Radar"
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

                      {command.type === 'IF' && (
                        <>
                          {renderProgramField(
                            'Cond',
                            <PixelSelect
                              title="Condición"
                              value={condition.kind}
                              options={CONDITION_OPTIONS.map((option) => ({
                                value: option.kind,
                                label: formatConditionLabel(option.kind),
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
                                'Reg',
                                <PixelSelect
                                  title="Registro"
                                  value={condition.register ?? 'RAD'}
                                  options={REGISTER_OPTIONS.map((register) => ({
                                    value: register,
                                    label: formatRegisterLabel(register),
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
                                        dir: undefined,
                                      }
                                    })
                                  }}
                                />,
                              )}

                              {condition.register === 'RAD' && (
                                renderProgramField(
                                  'DIR',
                                  <PixelSelect
                                    title="Dir de Radar"
                                    value={condition.dir ?? 'NONE'}
                                    options={[
                                      { value: 'NONE', label: 'General' },
                                      ...DIRECTIONS.map((dir) => ({ value: dir, label: formatDirectionLabel(dir) })),
                                    ]}
                                    onChange={(value) => {
                                      const dir = value === 'NONE' ? undefined : (value as Direction)
                                      patchCommand(index, (next) => {
                                        const current = getConditionForEditor(next.condition)
                                        next.condition = {
                                          ...(current.kind === 'REGISTER_COMPARE'
                                            ? current
                                            : createDefaultCondition('REGISTER_COMPARE')),
                                          dir,
                                        }
                                      })
                                    }}
                                  />,
                                )
                              )}

                              {renderProgramField(
                                'Op',
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
                                'Val',
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
                              'Dirc',
                              <PixelSelect
                                title="Dirección"
                                value={condition.dir ?? 'N'}
                                options={DIRECTIONS.map((dir) => ({ value: dir, label: formatDirectionLabel(dir) }))}
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

                          {/* Nested Action Type Selector */}
                          {renderProgramField(
                            'Acción',
                            <PixelSelect
                              title="Acción a realizar"
                              value={command.action?.type ?? 'ESPERA'}
                              options={COMMAND_LIBRARY.filter(item => item.type !== 'IF').map((item) => ({
                                value: item.type,
                                label: formatCommandTypeLabel(item.type),
                              }))}
                              onChange={(selectedType) => {
                                const nextType = selectedType as CommandType
                                patchCommand(index, (next) => {
                                  if (!next.action) {
                                    next.action = { type: 'ESPERA' }
                                  }
                                  const reset = createCommandTemplate(nextType)
                                  next.action.type = reset.type
                                  next.action.dir = reset.dir
                                  next.action.dirSource = reset.dirSource
                                  next.action.dist = reset.dist
                                  next.action.distSource = reset.distSource
                                })
                              }}
                            />,
                          )}

                          {/* Nested Action Fields */}
                          {command.action && (command.action.type === 'MOVER' || command.action.type === 'RAD') && (
                            renderProgramField(
                              'DIR',
                              <PixelSelect
                                title="Dirección"
                                value={command.action.dir ?? 'N'}
                                options={DIRECTIONS.map((dir) => ({ value: dir, label: formatDirectionLabel(dir) }))}
                                onChange={(selectedDir) => {
                                  const dir = selectedDir as Direction
                                  patchCommand(index, (next) => {
                                    if (next.action) next.action.dir = dir
                                  })
                                }}
                              />,
                            )
                          )}

                          {command.action && command.action.type === 'DISPARAR' && (
                            renderProgramField(
                              'DIR',
                              <PixelSelect
                                title="Dirección"
                                value={command.action.dirSource === 'RAD_DIR' ? 'RAD_DIR' : command.action.dir ?? 'N'}
                                options={SHOOT_DIRECTION_OPTIONS.map((option) => ({
                                  value: option,
                                  label: formatDirectionLabel(option),
                                }))}
                                onChange={(value) => {
                                  const selected = value as Direction | 'RAD_DIR'
                                  patchCommand(index, (next) => {
                                    if (next.action) {
                                      if (selected === 'RAD_DIR') {
                                        next.action.dirSource = selected as ShootDirectionSource
                                      } else {
                                        next.action.dir = selected
                                        next.action.dirSource = 'VAL'
                                      }
                                    }
                                  })
                                }}
                              />,
                            )
                          )}

                          {command.action && command.action.type === 'BOMBA' && (
                            <>
                              {renderProgramField(
                                'DIR',
                                <PixelSelect
                                  title="Dirección"
                                  value={command.action.dirSource === 'RAD_DIR' ? 'RAD_DIR' : command.action.dir ?? 'N'}
                                  options={SHOOT_DIRECTION_OPTIONS.map((option) => ({
                                    value: option,
                                    label: formatDirectionLabel(option),
                                  }))}
                                  onChange={(value) => {
                                    const selected = value as Direction | 'RAD_DIR'
                                    patchCommand(index, (next) => {
                                      if (next.action) {
                                        if (selected === 'RAD_DIR') {
                                          next.action.dirSource = selected as ShootDirectionSource
                                        } else {
                                          next.action.dir = selected
                                          next.action.dirSource = 'VAL'
                                        }
                                      }
                                    })
                                  }}
                                />,
                              )}

                              {renderProgramField(
                                'Dist',
                                <PixelSelect
                                  title="Fuente de DIST"
                                  value={command.action.distSource ?? 'VAL'}
                                  options={DIST_SOURCE_OPTIONS.map((source) => ({
                                    value: source,
                                    label: source === 'VAL' ? 'Val' : source === 'RAD' ? '|Radar|' : 'Salud',
                                  }))}
                                  onChange={(value) => {
                                    const distSource = value as BombDistanceSource
                                    patchCommand(index, (next) => {
                                      if (next.action) next.action.distSource = distSource
                                    })
                                  }}
                                />,
                              )}

                              {(command.action.distSource ?? 'VAL') === 'VAL' && (
                                renderProgramField(
                                  'Val',
                                  <div className="field-inline-control">
                                    <input
                                      className="symbol-input symbol-input-sm"
                                      title="Dist"
                                      type="number"
                                      min={1}
                                      max={config.gridSize}
                                      value={command.action.dist ?? 2}
                                      onChange={(event) => {
                                        const parsed = Number(event.target.value)
                                        const safeParsed = Number.isFinite(parsed) ? parsed : 1
                                        const dist = Math.min(config.gridSize, Math.max(1, safeParsed))
                                        patchCommand(index, (next) => {
                                          if (next.action) next.action.dist = dist
                                        })
                                      }}
                                    />
                                    <button
                                      className="small-btn field-quick-btn"
                                      type="button"
                                      title="Usar valor absoluto de Radar"
                                      onClick={() => {
                                        patchCommand(index, (next) => {
                                          if (next.action) next.action.distSource = 'RAD'
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

                        </>
                      )}

                    </div>


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
