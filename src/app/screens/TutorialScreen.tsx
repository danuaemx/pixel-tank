import { NAV_ICONS } from '../_const'
import { PixelIcon } from '../../components/PixelIcon'

type TutorialScreenProps = {
  onBackToMenu: () => void
}

export function TutorialScreen({ onBackToMenu }: TutorialScreenProps) {
  return (
    <section className="panel tutorial-screen">
      <h2>Tutorial</h2>
      <ul className="tutorial-list">
        <li>
          <span className="tutorial-item-icon"><PixelIcon color="#38bdf8" grid={['  #  ', ' ### ', '#####', ' ### ', '  #  ', '  #  ', '  #  ']} /></span>
          <strong>Mover(dir)</strong>: mueve en N/S/E/O (sin diagonales).
        </li>
        <li>
          <span className="tutorial-item-icon"><PixelIcon color="#f87171" grid={[' ### ', '#####', ' # # ', ' # # ', '  #  ', '  #  ', '  #  ']} /></span>
          <strong>Disparar(dir)</strong>: daño instantáneo de -20, alcance según tablero. También acepta <strong>Disparar(radar_dir)</strong>.
        </li>
        <li>
          <span className="tutorial-item-icon"><PixelIcon color="#facc15" grid={['  #  ', ' ### ', '#####', ' ### ', '  #  ']} /></span>
          <strong>Colocar_mina</strong>: pone mina en casilla actual (3 por tanque, -40 daño).
        </li>
        <li>
          <span className="tutorial-item-icon"><PixelIcon color="#ef4444" grid={['#   #', ' # # ', '  #  ', ' ### ', '#####', ' ### ', '  #  ']} /></span>
          <strong>Bomba(dir,dist)</strong>: 2 por tanque, área 3x3 (-30) y residual alrededor (-15). Dir puede ser N/S/E/O o Radar_dir, y Dist puede ser Val, |Radar| o Salud.
        </li>
        <li>
          <span className="tutorial-item-icon"><PixelIcon color="#4ade80" grid={['  #  ', ' # # ', '#   #', '  #  ', '  #  ', '  #  ', ' ### ']} /></span>
          <strong>Radar(dir)</strong>: guarda Radar con -d si hay tanque/obstáculo/mina, +d si hay estación, y actualiza Radar_dir con la última dirección leída.
        </li>
        <li>
          <span className="tutorial-item-icon"><PixelIcon color="#a78bfa" grid={[' ### ', '#   #', '   # ', '  #  ', '     ', '  #  ', '  #  ']} /></span>
          <strong>If(cond)</strong>: si falla, salta la siguiente línea. Cond usa operadores &lt;=, &lt;, &gt;, &gt;=, ==.
        </li>
      </ul>

      <h3>Registros</h3>
      <ul className="tutorial-list">
        <li><span className="tutorial-item-icon"><PixelIcon color="#34d399" grid={['#####', '#   #', '### #', '#   #', '#####']} /></span><strong>Radar</strong>: radar en la dirección leída. -d si detecta tanque/obstáculo/mina, +d si detecta estación, 0 si no detecta.</li>
        <li><span className="tutorial-item-icon"><PixelIcon color="#22d3ee" grid={[' ### ', '#   #', '# # #', '#   #', ' ### ']} /></span><strong>Radar_dir</strong>: última dirección usada por Radar. Se puede reutilizar en Disparar(Radar_dir).</li>
        <li><span className="tutorial-item-icon"><PixelIcon color="#f87171" grid={['#   #', '## ##', '# # #', '#   #', '#   #']} /></span><strong>Dano_dir</strong>: dirección desde la que recibió daño en el turno previo (sirve para saltar a huida).</li>
        <li><span className="tutorial-item-icon"><PixelIcon color="#60a5fa" grid={['#   #', '## ##', '# # #', '#   #', ' ### ']} /></span><strong>Dir_mov</strong>: última dirección usada en Mover.</li>
        <li><span className="tutorial-item-icon"><PixelIcon color="#fcd34d" grid={[' ### ', '#   #', '#   #', '#   #', ' ### ']} /></span><strong>Salud</strong>: vida actual del tanque (0 a 100).</li>
      </ul>

      <h3>Tags del tanque</h3>
      <ul className="tutorial-list">
        <li><span className="tutorial-item-icon"><PixelIcon color="#fcd34d" grid={[' ### ', '#   #', '#   #', '#   #', ' ### ']} /></span><strong>Salud</strong>: vida actual del tanque.</li>
        <li><span className="tutorial-item-icon"><PixelIcon color="#ef4444" grid={['#   #', ' # # ', '  #  ', ' # # ', '#   #']} /></span><strong>Eliminaciones</strong>: cuántos tanques enemigos ha destruido.</li>
        <li><span className="tutorial-item-icon"><PixelIcon color="#f87171" grid={[' ### ', '#####', ' # # ', ' # # ', '  #  ', '  #  ', '  #  ']} /></span><strong>Bombas</strong>: bombas disponibles para usar.</li>
        <li><span className="tutorial-item-icon"><PixelIcon color="#facc15" grid={['  #  ', ' ### ', '#####', ' ### ', '  #  ']} /></span><strong>Minas</strong>: minas disponibles para colocar.</li>
        <li><span className="tutorial-item-icon"><PixelIcon color="#34d399" grid={['#####', '#   #', '### #', '#   #', '#####']} /></span><strong>Radar</strong>: resultado de la última lectura del radar.</li>
        <li><span className="tutorial-item-icon"><PixelIcon color="#22d3ee" grid={[' ### ', '#   #', '# # #', '#   #', ' ### ']} /></span><strong>Radar_dir</strong>: última dirección usada por Radar.</li>
        <li><span className="tutorial-item-icon"><PixelIcon color="#f87171" grid={['#   #', '## ##', '# # #', '#   #', '#   #']} /></span><strong>Dano_dir</strong>: dirección desde la que recibió daño en el turno previo.</li>
        <li><span className="tutorial-item-icon"><PixelIcon color="#60a5fa" grid={['#   #', '## ##', '# # #', '#   #', ' ### ']} /></span><strong>Dir_mov</strong>: última dirección usada al moverse.</li>
        <li><span className="tutorial-item-icon"><PixelIcon color="#a78bfa" grid={[' ### ', '#   #', '   # ', '  #  ', '     ', '  #  ', '  #  ']} /></span><strong>Puntaje</strong>: puntos acumulados del tanque.</li>
      </ul>

      <h3>Reglas clave</h3>
      <ul className="tutorial-list">
        <li><span className="tutorial-item-icon"><PixelIcon color="#38bdf8" grid={['#####', '#   #', '#   #', '#   #', '#####']} /></span>Tanques personalizables: 2 a 6 jugadores.</li>
        <li><span className="tutorial-item-icon"><PixelIcon color="#4ade80" grid={['#####', '# # #', '# # #', '# # #', '#####']} /></span>Tablero personalizable: 6x6 a 15x15.</li>
        <li><span className="tutorial-item-icon"><PixelIcon color="#ef4444" grid={[' ### ', '#####', ' ### ', ' ### ', ' # # ']} /></span>Vida inicial 100, colisión contra borde/pared/tanque: -10.</li>
        <li><span className="tutorial-item-icon"><PixelIcon color="#22d3ee" grid={['  #  ', ' ### ', '#   #', ' ### ', '  #  ']} /></span>Recupera 10 al pisar estación; estaciones se mueven cada 5 rondas.</li>
        <li><span className="tutorial-item-icon"><PixelIcon color="#f97316" grid={['  #  ', ' ### ', '#####', ' ### ', '  #  ']} /></span>Eliminar objetivos da recuperación del 20% y puntos.</li>
        <li><span className="tutorial-item-icon"><PixelIcon color="#fcd34d" grid={[' ### ', ' # # ', ' ### ', '  #  ', '  #  ']} /></span>Puntaje: eliminaciones, salud final y 10% extra al código más corto.</li>
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
