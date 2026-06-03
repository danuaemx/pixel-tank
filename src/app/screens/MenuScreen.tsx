import { NAV_ICONS } from '../_const'
import { GameIcon } from '../../components/GameIcon'

type MenuScreenProps = {
  onQuickStart: () => void
  onOpenConfig: () => void
  onOpenProgram: () => void
  onOpenTutorial: () => void
  onOpenCredits: () => void
}

export function MenuScreen({ onQuickStart, onOpenConfig, onOpenProgram, onOpenTutorial, onOpenCredits }: MenuScreenProps) {
  return (
    <section className="panel menu-screen">
      <div className="hero-banner">
        <h1 className="retro-title">Pixel Tanks</h1>
      </div>
      <p className="subtitle">Observa y Programa la batalla automática de tanques.</p>
      <div className="menu-actions">
        <button className="pixel-btn btn-large btn-with-icon" onClick={onQuickStart}>
          <span className="btn-icon"><GameIcon color="#064e3b" icon={NAV_ICONS.quick} /></span>
          <span>Partida rápida</span>
        </button>
        <button className="pixel-btn btn-large btn-with-icon" onClick={onOpenConfig}>
          <span className="btn-icon"><GameIcon color="#064e3b" icon={NAV_ICONS.config} /></span>
          <span>Configuración</span>
        </button>
        <button className="pixel-btn btn-large btn-with-icon" onClick={onOpenProgram}>
          <span className="btn-icon"><GameIcon color="#064e3b" icon={NAV_ICONS.program} /></span>
          <span>Programar tanques</span>
        </button>
        <button className="pixel-btn btn-large btn-with-icon" onClick={onOpenTutorial}>
          <span className="btn-icon"><GameIcon color="#064e3b" icon={NAV_ICONS.tutorial} /></span>
          <span>Tutorial</span>
        </button>
        <button className="pixel-btn btn-large btn-with-icon" onClick={onOpenCredits}>
          <span className="btn-icon"><GameIcon color="#064e3b" icon={NAV_ICONS.credits} /></span>
          <span>Créditos</span>
        </button>
      </div>
    </section>
  )
}
