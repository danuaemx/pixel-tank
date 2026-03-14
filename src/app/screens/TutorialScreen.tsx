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
          <strong>MOVER(DIR)</strong>: mueve en N/S/E/O (sin diagonales).
        </li>
        <li>
          <span className="tutorial-item-icon"><PixelIcon color="#f87171" grid={[' ### ', '#####', ' # # ', ' # # ', '  #  ', '  #  ', '  #  ']} /></span>
          <strong>DISPARAR(DIR)</strong>: daño instantáneo de -20, alcance según tablero. También acepta <strong>DISPARAR(RAD_DIR)</strong>.
        </li>
        <li>
          <span className="tutorial-item-icon"><PixelIcon color="#facc15" grid={['  #  ', ' ### ', '#####', ' ### ', '  #  ']} /></span>
          <strong>COLOCAR_MINA</strong>: pone mina en casilla actual (3 por tanque, -40 daño).
        </li>
        <li>
          <span className="tutorial-item-icon"><PixelIcon color="#ef4444" grid={['#   #', ' # # ', '  #  ', ' ### ', '#####', ' ### ', '  #  ']} /></span>
          <strong>BOMBA(DIR,DIST)</strong>: 2 por tanque, área 3x3 (-30) y residual alrededor (-15). DIR puede ser N/S/E/O o RAD_DIR, y DIST puede ser VAL, |RAD| o SALUD.
        </li>
        <li>
          <span className="tutorial-item-icon"><PixelIcon color="#4ade80" grid={['  #  ', ' # # ', '#   #', '  #  ', '  #  ', '  #  ', ' ### ']} /></span>
          <strong>RAD(DIR)</strong>: guarda RAD con -d si hay tanque/obstáculo/mina, +d si hay estación, y actualiza RAD_DIR con la última dirección leída.
        </li>
        <li>
          <span className="tutorial-item-icon"><PixelIcon color="#a78bfa" grid={[' ### ', '#   #', '   # ', '  #  ', '     ', '  #  ', '  #  ']} /></span>
          <strong>IF(COND)</strong>: si falla, salta la siguiente línea. COND usa operadores &lt;=, &lt;, &gt;, &gt;=, ==.
        </li>
        <li>
          <span className="tutorial-item-icon"><PixelIcon color="#fb923c" grid={[' ### ', '#   #', '    #', '  ## ', ' #   ', '#### ']} /></span>
          <strong>LABEL</strong> y <strong>JUMP[COND,LABEL]</strong>: controlan bucles y saltos con la misma condición de IF.
        </li>
      </ul>

      <h3>Registros</h3>
      <ul className="tutorial-list">
        <li><span className="tutorial-item-icon"><PixelIcon color="#34d399" grid={['#####', '#   #', '### #', '#   #', '#####']} /></span><strong>RAD</strong>: radar en la dirección leída. -d si detecta tanque/obstáculo/mina, +d si detecta estación, 0 si no detecta.</li>
        <li><span className="tutorial-item-icon"><PixelIcon color="#22d3ee" grid={[' ### ', '#   #', '# # #', '#   #', ' ### ']} /></span><strong>RAD_DIR</strong>: última dirección usada por RAD. Se puede reutilizar en DISPARAR(RAD_DIR).</li>
        <li><span className="tutorial-item-icon"><PixelIcon color="#f87171" grid={['#   #', '## ##', '# # #', '#   #', '#   #']} /></span><strong>DANO_DIR</strong>: dirección desde la que recibió daño en el turno previo (sirve para saltar a huida).</li>
        <li><span className="tutorial-item-icon"><PixelIcon color="#60a5fa" grid={['#   #', '## ##', '# # #', '#   #', ' ### ']} /></span><strong>DIR_MOV</strong>: última dirección usada en MOVER.</li>
        <li><span className="tutorial-item-icon"><PixelIcon color="#fcd34d" grid={[' ### ', '#   #', '#   #', '#   #', ' ### ']} /></span><strong>SALUD</strong>: vida actual del tanque (0 a 100).</li>
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
