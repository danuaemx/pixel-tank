import { NAV_ICONS } from '../_const'
import { GameIcon } from '../../components/GameIcon'
import { COMMAND_LOGOS, SCORE_STAT_ICONS, SUMMARY_ICONS } from '../../components/game-screen/_const'
import { IconUsers, IconGrid3x3 } from '@tabler/icons-react'

type TutorialScreenProps = {
  onBackToMenu: () => void
}

export function TutorialScreen({ onBackToMenu }: TutorialScreenProps) {
  return (
    <section className="panel tutorial-screen">
      <h2>Tutorial</h2>
      <ul className="tutorial-list">
        <li>
          <span className="tutorial-item-icon"><GameIcon color={COMMAND_LOGOS.MOVER.color} icon={COMMAND_LOGOS.MOVER.icon} /></span>
          <strong>Mover(dir)</strong>: mueve en N/S/E/O (sin diagonales).
        </li>
        <li>
          <span className="tutorial-item-icon"><GameIcon color={COMMAND_LOGOS.DISPARAR.color} icon={COMMAND_LOGOS.DISPARAR.icon} /></span>
          <strong>Disparar(dir)</strong>: daño instantáneo de -20, alcance según tablero. También acepta <strong>Disparar(radar_dir)</strong>.
        </li>
        <li>
          <span className="tutorial-item-icon"><GameIcon color={COMMAND_LOGOS.COLOCAR_MINA.color} icon={COMMAND_LOGOS.COLOCAR_MINA.icon} /></span>
          <strong>Colocar_mina</strong>: pone mina en casilla actual (3 por tanque, -40 daño).
        </li>
        <li>
          <span className="tutorial-item-icon"><GameIcon color={COMMAND_LOGOS.BOMBA.color} icon={COMMAND_LOGOS.BOMBA.icon} /></span>
          <strong>Bomba(dir,dist)</strong>: 2 por tanque, área 3x3 (-30) y residual alrededor (-15). Dir puede ser N/S/E/O o Radar_dir, y Dist puede ser Val, |Radar| o Salud.
        </li>
        <li>
          <span className="tutorial-item-icon"><GameIcon color={COMMAND_LOGOS.RAD.color} icon={COMMAND_LOGOS.RAD.icon} /></span>
          <strong>Radar(dir)</strong>: guarda Radar con -d si hay tanque/obstáculo/mina, +d si hay estación, y actualiza Radar_dir con la última dirección leída.
        </li>
        <li>
          <span className="tutorial-item-icon"><GameIcon color={COMMAND_LOGOS.IF.color} icon={COMMAND_LOGOS.IF.icon} /></span>
          <strong>If(cond):act</strong>: si falla, salta la siguiente línea. Cond usa operadores &lt;=, &lt;, &gt;, &gt;=, ==.
        </li>
      </ul>

      <h3>Registros</h3>
      <ul className="tutorial-list">
        <li><span className="tutorial-item-icon"><GameIcon color={SCORE_STAT_ICONS.rad.color} icon={SCORE_STAT_ICONS.rad.icon} /></span><strong>Radar</strong>: radar en la dirección leída. -d si detecta tanque/obstáculo/mina, +d si detecta estación, 0 si no detecta.</li>
        <li><span className="tutorial-item-icon"><GameIcon color={SCORE_STAT_ICONS.radDir.color} icon={SCORE_STAT_ICONS.radDir.icon} /></span><strong>Radar_dir</strong>: última dirección usada por Radar. Se puede reutilizar en Disparar(Radar_dir).</li>
        <li><span className="tutorial-item-icon"><GameIcon color={SCORE_STAT_ICONS.danoDir.color} icon={SCORE_STAT_ICONS.danoDir.icon} /></span><strong>Dano_dir</strong>: dirección desde la que recibió daño en el turno previo (sirve para saltar a huida).</li>
        <li><span className="tutorial-item-icon"><GameIcon color={SCORE_STAT_ICONS.dirMov.color} icon={SCORE_STAT_ICONS.dirMov.icon} /></span><strong>Dir_mov</strong>: última dirección usada en Mover.</li>
        <li><span className="tutorial-item-icon"><GameIcon color={SCORE_STAT_ICONS.health.color} icon={SCORE_STAT_ICONS.health.icon} /></span><strong>Salud</strong>: vida actual del tanque (0 a 100).</li>
      </ul>

      <h3>Tags del tanque</h3>
      <ul className="tutorial-list">
        <li><span className="tutorial-item-icon"><GameIcon color={SCORE_STAT_ICONS.health.color} icon={SCORE_STAT_ICONS.health.icon} /></span><strong>Salud</strong>: vida actual del tanque.</li>
        <li><span className="tutorial-item-icon"><GameIcon color={SCORE_STAT_ICONS.kills.color} icon={SCORE_STAT_ICONS.kills.icon} /></span><strong>Eliminaciones</strong>: cuántos tanques enemigos ha destruido.</li>
        <li><span className="tutorial-item-icon"><GameIcon color={SCORE_STAT_ICONS.bombs.color} icon={SCORE_STAT_ICONS.bombs.icon} /></span><strong>Bombas</strong>: bombas disponibles para usar.</li>
        <li><span className="tutorial-item-icon"><GameIcon color={SCORE_STAT_ICONS.mines.color} icon={SCORE_STAT_ICONS.mines.icon} /></span><strong>Minas</strong>: minas disponibles para colocar.</li>
        <li><span className="tutorial-item-icon"><GameIcon color={SCORE_STAT_ICONS.rad.color} icon={SCORE_STAT_ICONS.rad.icon} /></span><strong>Radar</strong>: resultado de la última lectura del radar.</li>
        <li><span className="tutorial-item-icon"><GameIcon color={SCORE_STAT_ICONS.radDir.color} icon={SCORE_STAT_ICONS.radDir.icon} /></span><strong>Radar_dir</strong>: última dirección usada por Radar.</li>
        <li><span className="tutorial-item-icon"><GameIcon color={SCORE_STAT_ICONS.danoDir.color} icon={SCORE_STAT_ICONS.danoDir.icon} /></span><strong>Dano_dir</strong>: dirección desde la que recibió daño en el turno previo.</li>
        <li><span className="tutorial-item-icon"><GameIcon color={SCORE_STAT_ICONS.dirMov.color} icon={SCORE_STAT_ICONS.dirMov.icon} /></span><strong>Dir_mov</strong>: última dirección usada al moverse.</li>
        <li><span className="tutorial-item-icon"><GameIcon color={SCORE_STAT_ICONS.score.color} icon={SCORE_STAT_ICONS.score.icon} /></span><strong>Puntaje</strong>: puntos acumulados del tanque.</li>
      </ul>

      <h3>Reglas clave</h3>
      <ul className="tutorial-list">
        <li><span className="tutorial-item-icon"><GameIcon color="#38bdf8" icon={IconUsers} /></span>Tanques personalizables: 2 a 6 jugadores.</li>
        <li><span className="tutorial-item-icon"><GameIcon color="#4ade80" icon={IconGrid3x3} /></span>Tablero personalizable: 6x6 a 15x15.</li>
        <li><span className="tutorial-item-icon"><GameIcon color="#ef4444" icon={SUMMARY_ICONS.alive} /></span>Vida inicial 100, colisión contra borde/pared/tanque: -10.</li>
        <li><span className="tutorial-item-icon"><GameIcon color="#22d3ee" icon={SUMMARY_ICONS.stations} /></span>Recupera 10 al pisar estación; estaciones se mueven cada 5 rondas.</li>
        <li><span className="tutorial-item-icon"><GameIcon color="#f97316" icon={SUMMARY_ICONS.mines} /></span>Eliminar objetivos da recuperación del 20% y puntos.</li>
        <li><span className="tutorial-item-icon"><GameIcon color="#fcd34d" icon={SUMMARY_ICONS.leader} /></span>Puntaje: eliminaciones, salud final y 10% extra al código más corto.</li>
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
