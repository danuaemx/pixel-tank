import { NAV_ICONS } from '../_const'
import { GameIcon } from '../../components/GameIcon'

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
        <li><span className="tutorial-item-icon"><GameIcon color="#fcd34d" icon={NAV_ICONS.credits} /></span><strong>[Por definir]</strong></li>
      </ul>

      <h3>Recursos usados</h3>
      <ul className="tutorial-list">
        <li><span className="tutorial-item-icon"><GameIcon color="#38bdf8" icon={NAV_ICONS.program} /></span><strong>React</strong>: interfaz principal de la aplicación.</li>
        <li><span className="tutorial-item-icon"><GameIcon color="#4ade80" icon={NAV_ICONS.config} /></span><strong>Vite</strong>: entorno de desarrollo y empaquetado.</li>
        <li><span className="tutorial-item-icon"><GameIcon color="#f87171" icon={NAV_ICONS.tutorial} /></span><strong>@tabler/icons-react</strong>: base de los iconos pixelados usados en la UI.</li>
        <li><span className="tutorial-item-icon"><GameIcon color="#a78bfa" icon={NAV_ICONS.credits} /></span><strong>public/cursors/*.svg</strong>: cursores personalizados de la interfaz.</li>
        <li><span className="tutorial-item-icon"><GameIcon color="#22d3ee" icon={NAV_ICONS.quick} /></span><strong>public/thank1.png</strong>: imagen de fondo del juego.</li>
        <li><span className="tutorial-item-icon"><GameIcon color="#facc15" icon={NAV_ICONS.save} /></span><strong>src/audio.ts</strong>: música y sonidos chiptune de la UI y el juego.</li>
        <li><span className="tutorial-item-icon"><GameIcon color="#60a5fa" icon={NAV_ICONS.load} /></span><strong>src/components/GameIcon.tsx</strong>: conversión y renderizado estandarizado de iconos de la UI.</li>
      </ul>

      <h3>Música</h3>
      <ul className="tutorial-list">
        <li>
          <span className="tutorial-item-icon"><GameIcon color="#fcd34d" icon={NAV_ICONS.save} /></span>
          <strong>"42 Monster RPG 2 music tracks"</strong>: colección de Nooskewl Games publicada en OpenGameArt. El autor indica que agradece un saludo si se usan sus obras, y las pistas se redistribuyen aquí como parte del proyecto.
        </li>
        <li>
          <span className="tutorial-item-icon"><GameIcon color="#22d3ee" icon={NAV_ICONS.load} /></span>
          <strong>"5 Chiptunes Action"</strong>: colección de Juhani Junkala publicada en OpenGameArt bajo licencia CC0.
        </li>
      </ul>


      <div className="inline-actions">
        <button className="pixel-btn btn-with-icon" onClick={onBackToMenu}>
          <span className="btn-icon"><GameIcon color="#064e3b" icon={NAV_ICONS.menu} /></span>
          <span>Volver al menú</span>
        </button>
      </div>
    </section>
  )
}
