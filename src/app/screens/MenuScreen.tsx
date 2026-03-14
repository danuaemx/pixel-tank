import { NAV_ICONS } from '../_const'
import { PixelIcon } from '../../components/PixelIcon'

type MenuScreenProps = {
  onQuickStart: () => void
  onOpenConfig: () => void
  onOpenProgram: () => void
  onOpenTutorial: () => void
}

export function MenuScreen({ onQuickStart, onOpenConfig, onOpenProgram, onOpenTutorial }: MenuScreenProps) {
  return (
    <section className="panel menu-screen">
      <div className="hero-banner">
        <h1 className="retro-title">PIXEL TANKS</h1>
      </div>
      <p className="subtitle">Observa y Programa la batalla automática de tanques.</p>
      <div className="menu-actions">
        <button className="pixel-btn btn-large btn-with-icon" onClick={onQuickStart}>
          <span className="btn-icon"><PixelIcon color="#064e3b" grid={NAV_ICONS.quick} /></span>
          <span>Partida rápida</span>
        </button>
        <button className="pixel-btn btn-large btn-with-icon" onClick={onOpenConfig}>
          <span className="btn-icon"><PixelIcon color="#064e3b" grid={NAV_ICONS.config} /></span>
          <span>Configuración</span>
        </button>
        <button className="pixel-btn btn-large btn-with-icon" onClick={onOpenProgram}>
          <span className="btn-icon"><PixelIcon color="#064e3b" grid={NAV_ICONS.program} /></span>
          <span>Programar tanques</span>
        </button>
        <button className="pixel-btn btn-large btn-with-icon" onClick={onOpenTutorial}>
          <span className="btn-icon"><PixelIcon color="#064e3b" grid={NAV_ICONS.tutorial} /></span>
          <span>Tutorial</span>
        </button>
      </div>
    </section>
  )
}
