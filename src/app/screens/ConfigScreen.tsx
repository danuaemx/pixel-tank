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
  updateUiFontSize,
  updateMasterVolume,
  applyDefaultSetup,
  onOpenProgram,
  onStartSimulation,
  onBack,
}: ConfigScreenProps) {
  return (
    <section className="panel config-screen">
      <h2>Configuración</h2>
      <p className="config-lead">Ajusta reglas de partida y tamaño de interfaz antes de iniciar.</p>
      <div className="config-grid">
        <label>
          Número de tanques (2-6)
          {renderConfigStepper(config.players, 2, 6, updatePlayers, 'número de tanques')}
        </label>

        <label>
          Tamaño del grid (6-15)
          {renderConfigStepper(config.gridSize, 6, 15, updateGridSize, 'tamaño del grid')}
        </label>

        <label>
          Líneas pasivas permitidas
          {renderConfigStepper(config.passiveLimit, 0, 50, updatePassiveLimit, 'líneas pasivas')}
        </label>

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
            <strong>{masterVolume}%</strong>
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
