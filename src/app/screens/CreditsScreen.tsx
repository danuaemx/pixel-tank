import { NAV_ICONS } from '../_const'
import { PixelIcon } from '../../components/PixelIcon'

type CreditsScreenProps = {
  onBackToMenu: () => void
}

export function CreditsScreen({ onBackToMenu }: CreditsScreenProps) {
  return (
    <section className="panel tutorial-screen credits-screen">
      <h2>Créditos</h2>
      <p className="subtitle">Autores y recursos usados actualmente en Pixel Tanks.</p>

      <h3>Autores</h3>
      <ul className="tutorial-list">
        <li><span className="tutorial-item-icon"><PixelIcon color="#fcd34d" grid={NAV_ICONS.credits} /></span><strong>[Por definir]</strong></li>
      </ul>

      <h3>Recursos usados</h3>
      <ul className="tutorial-list">
        <li><span className="tutorial-item-icon"><PixelIcon color="#38bdf8" grid={NAV_ICONS.program} /></span><strong>React</strong>: interfaz principal de la aplicación.</li>
        <li><span className="tutorial-item-icon"><PixelIcon color="#4ade80" grid={NAV_ICONS.config} /></span><strong>Vite</strong>: entorno de desarrollo y empaquetado.</li>
        <li><span className="tutorial-item-icon"><PixelIcon color="#f87171" grid={NAV_ICONS.tutorial} /></span><strong>@tabler/icons-react</strong>: base de los iconos pixelados usados en la UI.</li>
        <li><span className="tutorial-item-icon"><PixelIcon color="#a78bfa" grid={NAV_ICONS.credits} /></span><strong>public/cursors/*.svg</strong>: cursores personalizados de la interfaz.</li>
        <li><span className="tutorial-item-icon"><PixelIcon color="#22d3ee" grid={NAV_ICONS.quick} /></span><strong>public/thank1.png</strong>: imagen de fondo del juego.</li>
        <li><span className="tutorial-item-icon"><PixelIcon color="#facc15" grid={NAV_ICONS.save} /></span><strong>src/audio.ts</strong>: música y sonidos chiptune de la UI y el juego.</li>
        <li><span className="tutorial-item-icon"><PixelIcon color="#60a5fa" grid={NAV_ICONS.load} /></span><strong>src/components/PixelIcon.tsx</strong>: conversión de cuadrículas pixeladas a iconos visuales.</li>
      </ul>


      <div className="inline-actions">
        <button className="pixel-btn btn-with-icon" onClick={onBackToMenu}>
          <span className="btn-icon"><PixelIcon color="#064e3b" grid={NAV_ICONS.menu} /></span>
          <span>Volver al menú</span>
        </button>
      </div>
    </section>
  )
}
