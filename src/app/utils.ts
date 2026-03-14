import type { UiSoundKey } from '../audio'
import type { Condition, ConditionKind } from '../game'
import {
  DEFAULT_MASTER_VOLUME,
  DEFAULT_UI_FONT_SIZE,
  MAX_MASTER_VOLUME,
  MAX_UI_FONT_SIZE,
  MIN_MASTER_VOLUME,
  MIN_UI_FONT_SIZE,
} from './_const'
import type { MenuConfirmSource } from './types'

export function sanitizeUiFontSize(value: number): number {
  if (!Number.isFinite(value)) {
    return DEFAULT_UI_FONT_SIZE
  }

  return Math.min(MAX_UI_FONT_SIZE, Math.max(MIN_UI_FONT_SIZE, Math.round(value)))
}

export function sanitizeMasterVolume(value: number): number {
  if (!Number.isFinite(value)) {
    return DEFAULT_MASTER_VOLUME
  }

  return Math.min(MAX_MASTER_VOLUME, Math.max(MIN_MASTER_VOLUME, Math.round(value)))
}

export function getUiSoundForButton(button: HTMLButtonElement): UiSoundKey {
  const className = typeof button.className === 'string' ? button.className.toLowerCase() : ''
  const descriptor = `${button.getAttribute('aria-label') ?? ''} ${button.getAttribute('title') ?? ''} ${button.textContent ?? ''}`
    .toLowerCase()

  if (
    className.includes('danger') ||
    descriptor.includes('reiniciar') ||
    descriptor.includes('abandonar') ||
    descriptor.includes('eliminar')
  ) {
    return 'ui-danger'
  }

  if (descriptor.includes('paso') || descriptor.includes('step')) {
    return 'ui-step'
  }

  if (
    className.includes('tank-tab') ||
    className.includes('program-icon-btn') ||
    className.includes('top-control-btn') ||
    className.includes('btn-with-icon')
  ) {
    return 'ui-nav'
  }

  if (
    className.includes('small-btn') ||
    className.includes('pixel-select-option') ||
    className.includes('pixel-select-trigger')
  ) {
    return 'ui-toggle'
  }

  return 'ui-action'
}

export function createDefaultCondition(kind: ConditionKind): Condition {
  if (kind === 'REGISTER_COMPARE') {
    return { kind, register: 'RAD', operator: '>', value: 0 }
  }

  if (kind === 'DIR_MOV_EQ') {
    return { kind, dir: 'N' }
  }

  return { kind }
}

export function getConditionForEditor(condition: Condition | undefined): Condition {
  if (!condition) {
    return { kind: 'TRUE' }
  }

  if (condition.kind === 'REGISTER_COMPARE') {
    return {
      kind: 'REGISTER_COMPARE',
      register: condition.register ?? 'RAD',
      operator: condition.operator ?? '>',
      value: condition.value ?? 0,
    }
  }

  if (condition.kind === 'DIR_MOV_EQ') {
    return {
      kind: 'DIR_MOV_EQ',
      dir: condition.dir ?? 'N',
    }
  }

  return condition
}

export function getReturnToMenuDialog(source: MenuConfirmSource): {
  title: string
  message: string
  confirmLabel: string
} {
  if (source === 'game') {
    return {
      title: 'Abandonar partida',
      message: 'Se perderá la partida en curso. ¿Quieres abandonar y volver al menú?',
      confirmLabel: 'Abandonar partida',
    }
  }

  if (source === 'program') {
    return {
      title: 'Volver al menú',
      message: 'Vas a salir del programador de tanques. ¿Deseas volver al menú?',
      confirmLabel: 'Volver al menú',
    }
  }

  if (source === 'config') {
    return {
      title: 'Volver al menú',
      message: 'Vas a salir de configuración. ¿Deseas volver al menú?',
      confirmLabel: 'Volver al menú',
    }
  }

  return {
    title: 'Volver al menú',
    message: '¿Deseas volver al menú principal?',
    confirmLabel: 'Volver al menú',
  }
}
