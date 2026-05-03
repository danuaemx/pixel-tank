import { useState } from 'react'
import { PixelIcon } from '../../components/PixelIcon'
import { PixelRange } from '../../components/PixelRange'
import {
  DEFAULT_MASTER_VOLUME,
  DEFAULT_UI_FONT_SIZE,
  MAX_MASTER_VOLUME,
  MAX_UI_FONT_SIZE,
  MIN_MASTER_VOLUME,
  MIN_UI_FONT_SIZE,
  NAV_ICONS,
} from '../_const'
import { formatMasterVolumeDisplay } from '../utils'
import {
  MAX_BOMBS_PER_TANK,
  MAX_GRID_SIZE,
  MAX_MAX_ROUNDS,
  MAX_MINES_PER_TANK,
  MAX_PASSIVE_LIMIT,
  MAX_PLAYERS,
  MIN_BOMBS_PER_TANK,
  MIN_GRID_SIZE,
  MIN_MAX_ROUNDS,
  MIN_MINES_PER_TANK,
  MIN_PASSIVE_LIMIT,
  MIN_PLAYERS,
} from '../../game'
import type { GameConfig } from '../../game'

type ConfigScreenProps = {
  config: GameConfig
  uiFontSize: number
  masterVolume: number
  renderConfigStepper: (
    value: number,
    min: number,
    max: number,
    onValueChange: (nextValue: number) => void,
    title: string,
  ) => React.ReactNode
  updatePlayers: (value: number) => void
  updateGridSize: (value: number) => void
  updatePassiveLimit: (value: number) => void
  updateMaxRounds: (value: number) => void
  updateBombsPerTank: (value: number) => void
  updateMinesPerTank: (value: number) => void
  updateUiFontSize: (value: number) => void
  updateMasterVolume: (value: number) => void
  applyDefaultSetup: () => void
  onOpenProgram: () => void
  onStartSimulation: () => void
  onBack: () => void
}

export function ConfigScreen({
  config,
  uiFontSize,
  masterVolume,
  renderConfigStepper,
  updatePlayers,
  updateGridSize,
  updatePassiveLimit,
  updateMaxRounds,
  updateBombsPerTank,
  updateMinesPerTank,
  updateUiFontSize,
  updateMasterVolume,
  applyDefaultSetup,
  onOpenProgram,
  onStartSimulation,
  onBack,
}: ConfigScreenProps) {
  const [activeSection, setActiveSection] = useState<'game' | 'audio'>('game')

  return (
    <section className="panel config-screen">
      <h2>Configuración</h2>
      <p className="config-lead">Ajusta reglas de partida y tamaño de interfaz antes de iniciar.</p>
      <div className="config-tabs" role="tablist" aria-label="Secciones de configuración">
        <button
          className={`config-tab ${activeSection === 'game' ? 'active' : ''}`}
          type="button"
          role="tab"
          aria-selected={activeSection === 'game'}
          onClick={() => setActiveSection('game')}
        >
          Modo de juego
        </button>
        <button
          className={`config-tab ${activeSection === 'audio' ? 'active' : ''}`}
          type="button"
          role="tab"
          aria-selected={activeSection === 'audio'}
          onClick={() => setActiveSection('audio')}
        >
          Audio / Video
        </button>
      </div>

      {activeSection === 'game' ? (
        <div className="config-grid config-section" role="tabpanel" aria-label="Modo de juego">
          <label className="config-compact-setting">
            Número de tanques ({MIN_PLAYERS}-{MAX_PLAYERS})
            {renderConfigStepper(config.players, MIN_PLAYERS, MAX_PLAYERS, updatePlayers, 'número de tanques')}
          </label>

          <label className="config-compact-setting">
            Tamaño del grid ({MIN_GRID_SIZE}-{MAX_GRID_SIZE})
            {renderConfigStepper(config.gridSize, MIN_GRID_SIZE, MAX_GRID_SIZE, updateGridSize, 'tamaño del grid')}
          </label>

          <label className="config-compact-setting">
            Líneas pasivas permitidas
            {renderConfigStepper(
              config.passiveLimit,
              MIN_PASSIVE_LIMIT,
              MAX_PASSIVE_LIMIT,
              updatePassiveLimit,
              'líneas pasivas',
            )}
          </label>

          <label className="config-compact-setting">
            Número máximo de rondas ({MIN_MAX_ROUNDS}-{MAX_MAX_ROUNDS})
            {renderConfigStepper(
              config.maxRounds,
              MIN_MAX_ROUNDS,
              MAX_MAX_ROUNDS,
              updateMaxRounds,
              'número máximo de rondas',
            )}
          </label>

          <label className="config-compact-setting">
            Bombas por jugador ({MIN_BOMBS_PER_TANK}-{MAX_BOMBS_PER_TANK})
            {renderConfigStepper(
              config.bombsPerTank,
              MIN_BOMBS_PER_TANK,
              MAX_BOMBS_PER_TANK,
              updateBombsPerTank,
              'bombas por jugador',
            )}
          </label>

          <label className="config-compact-setting">
            Minas por jugador ({MIN_MINES_PER_TANK}-{MAX_MINES_PER_TANK})
            {renderConfigStepper(
              config.minesPerTank,
              MIN_MINES_PER_TANK,
              MAX_MINES_PER_TANK,
              updateMinesPerTank,
              'minas por jugador',
            )}
          </label>
        </div>
      ) : (
        <div className="config-grid config-section" role="tabpanel" aria-label="Audio y video">
          <label className="font-size-setting">
            <div className="font-size-header">
              <span>Tamaño de letra</span>
              <strong>{uiFontSize}px</strong>
            </div>
            <PixelRange
              className="config-range-control"
              title="Tamaño de letra"
              ariaLabel="Tamaño de letra"
              value={uiFontSize}
              min={MIN_UI_FONT_SIZE}
              max={MAX_UI_FONT_SIZE}
              step={1}
              onChange={updateUiFontSize}
            />
            <div className="font-size-actions">
              <button className="small-btn" type="button" onClick={() => updateUiFontSize(DEFAULT_UI_FONT_SIZE)}>
                Reset
              </button>
            </div>
            <div className="font-size-preview">Vista previa: paneles, botones y textos se adaptan al nuevo tamaño.</div>
          </label>

          <label className="font-size-setting">
            <div className="font-size-header">
              <span>Volumen base</span>
              <strong>{formatMasterVolumeDisplay(masterVolume)}%</strong>
            </div>
            <PixelRange
              className="config-range-control"
              title="Volumen base"
              ariaLabel="Volumen base"
              value={masterVolume}
              min={MIN_MASTER_VOLUME}
              max={MAX_MASTER_VOLUME}
              step={5}
              onChange={updateMasterVolume}
            />
            <div className="font-size-actions">
              <button className="small-btn" type="button" onClick={() => updateMasterVolume(DEFAULT_MASTER_VOLUME)}>
                Reset
              </button>
            </div>
            <div className="font-size-preview">Controla el volumen global de música, acciones del juego y botones.</div>
          </label>
        </div>
      )}

      <div className="inline-actions">
        <button className="pixel-btn" onClick={applyDefaultSetup}>
          Usar valores default
        </button>
        <button className="pixel-btn btn-with-icon" onClick={onOpenProgram}>
          <span className="btn-icon"><PixelIcon color="#064e3b" grid={NAV_ICONS.program} /></span>
          <span>Programar tanques</span>
        </button>
        <button className="pixel-btn btn-with-icon" onClick={onStartSimulation}>
          <span className="btn-icon"><PixelIcon color="#064e3b" grid={NAV_ICONS.start} /></span>
          <span>Iniciar simulación</span>
        </button>
        <button className="pixel-btn btn-with-icon" onClick={onBack}>
          <span className="btn-icon"><PixelIcon color="#064e3b" grid={NAV_ICONS.menu} /></span>
          <span>Volver</span>
        </button>
      </div>
    </section>
  )
}
