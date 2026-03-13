import type { SoundKey } from './game'

export type UiSoundKey = 'ui-nav' | 'ui-action' | 'ui-step' | 'ui-toggle' | 'ui-danger'
export type MusicTheme = 'menu' | 'game' | 'quick'

class ChiptuneAudio {
  private context: AudioContext | null = null

  private musicInterval: number | null = null

  private musicStep = 0

  private musicTheme: MusicTheme | null = null

  private masterVolume = 1.7

  private clampGain(value: number): number {
    return Math.min(0.7, Math.max(0.0001, value))
  }

  private ensureContext(): AudioContext {
    if (!this.context) {
      this.context = new AudioContext()
    }

    if (this.context.state === 'suspended') {
      void this.context.resume().catch(() => {
        // Ignorado: algunos navegadores bloquean autoplay hasta interacción del usuario.
      })
    }

    return this.context
  }

  private playTone(
    frequency: number,
    duration: number,
    type: OscillatorType,
    volume: number,
    delay = 0,
  ): void {
    const ctx = this.ensureContext()
    const startTime = ctx.currentTime + delay

    const oscillator = ctx.createOscillator()
    oscillator.type = type
    oscillator.frequency.setValueAtTime(frequency, startTime)

    const gainNode = ctx.createGain()
    const effectiveVolume = this.clampGain(volume * this.masterVolume)
    gainNode.gain.setValueAtTime(0.0001, startTime)
    gainNode.gain.exponentialRampToValueAtTime(effectiveVolume, startTime + 0.01)
    gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + duration)

    oscillator.connect(gainNode)
    gainNode.connect(ctx.destination)

    oscillator.start(startTime)
    oscillator.stop(startTime + duration + 0.02)
  }

  private playSweep(
    startFrequency: number,
    endFrequency: number,
    duration: number,
    type: OscillatorType,
    volume: number,
    delay = 0,
  ): void {
    const ctx = this.ensureContext()
    const startTime = ctx.currentTime + delay

    const oscillator = ctx.createOscillator()
    oscillator.type = type
    oscillator.frequency.setValueAtTime(Math.max(20, startFrequency), startTime)
    oscillator.frequency.exponentialRampToValueAtTime(
      Math.max(20, endFrequency),
      startTime + duration,
    )

    const gainNode = ctx.createGain()
    const effectiveVolume = this.clampGain(volume * this.masterVolume)
    gainNode.gain.setValueAtTime(0.0001, startTime)
    gainNode.gain.exponentialRampToValueAtTime(effectiveVolume, startTime + 0.008)
    gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + duration)

    oscillator.connect(gainNode)
    gainNode.connect(ctx.destination)

    oscillator.start(startTime)
    oscillator.stop(startTime + duration + 0.02)
  }

  play(sound: SoundKey): void {
    switch (sound) {
      case 'move':
        this.playTone(220, 0.06, 'square', 0.04)
        break
      case 'shoot':
        this.playTone(650, 0.08, 'square', 0.05)
        this.playTone(420, 0.05, 'triangle', 0.03, 0.04)
        break
      case 'mine':
        this.playTone(180, 0.12, 'square', 0.05)
        break
      case 'bomb':
        this.playTone(120, 0.08, 'square', 0.06)
        this.playTone(90, 0.2, 'sawtooth', 0.05, 0.06)
        break
      case 'hit':
        this.playTone(300, 0.08, 'square', 0.05)
        this.playTone(200, 0.08, 'square', 0.04, 0.06)
        break
      case 'heal':
        this.playTone(440, 0.07, 'triangle', 0.04)
        this.playTone(660, 0.09, 'triangle', 0.04, 0.07)
        break
      case 'collision':
        this.playTone(130, 0.05, 'square', 0.04)
        break
      case 'win':
        this.playTone(523.25, 0.12, 'triangle', 0.05)
        this.playTone(659.25, 0.12, 'triangle', 0.05, 0.12)
        this.playTone(783.99, 0.18, 'triangle', 0.06, 0.24)
        break
      default:
        break
    }
  }

  playUi(sound: UiSoundKey): void {
    switch (sound) {
      case 'ui-nav':
        this.playTone(460, 0.03, 'square', 0.024)
        this.playTone(620, 0.05, 'triangle', 0.02, 0.018)
        break
      case 'ui-action':
        this.playTone(540, 0.025, 'square', 0.026)
        this.playTone(780, 0.04, 'triangle', 0.018, 0.014)
        break
      case 'ui-step':
        this.playTone(390, 0.022, 'square', 0.02)
        this.playTone(520, 0.022, 'square', 0.02, 0.014)
        this.playTone(690, 0.05, 'triangle', 0.018, 0.028)
        break
      case 'ui-toggle':
        this.playTone(320, 0.022, 'square', 0.018)
        this.playTone(430, 0.05, 'triangle', 0.016, 0.016)
        break
      case 'ui-danger':
        this.playSweep(340, 95, 0.11, 'sawtooth', 0.03)
        this.playTone(110, 0.08, 'square', 0.02, 0.06)
        break
      default:
        break
    }
  }

  setMasterVolume(multiplier: number): void {
    if (!Number.isFinite(multiplier)) {
      return
    }

    this.masterVolume = Math.min(3.5, Math.max(0.05, multiplier))
  }

  getMasterVolume(): number {
    return this.masterVolume
  }

  isAudioUnlocked(): boolean {
    return this.context?.state === 'running'
  }

  unlockAudio(): void {
    const ctx = this.ensureContext()
    if (ctx.state === 'suspended') {
      void ctx.resume().catch(() => {
        // Ignorado: se reintentará tras la próxima interacción del usuario.
      })
    }
  }

  startMusic(theme: MusicTheme = 'game'): void {
    if (this.musicInterval !== null && this.musicTheme === theme) {
      return
    }

    if (this.musicInterval !== null) {
      window.clearInterval(this.musicInterval)
      this.musicInterval = null
    }

    this.musicTheme = theme
    this.musicStep = 0

    const melody =
      theme === 'menu'
        ? [
            392, 440, 523.25, 587.33, 523.25, 440, 392, 349.23,
            329.63, 349.23, 392, 440, 392, 349.23, 329.63, 293.66,
          ]
        : theme === 'quick'
          ? [
              329.63, 392, 493.88, 659.25, 587.33, 493.88, 392, 329.63,
              293.66, 369.99, 440, 587.33, 523.25, 440, 369.99, 329.63,
            ]
        : [
            196, 246.94, 293.66, 329.63, 293.66, 246.94, 196, 174.61,
            220, 261.63, 311.13, 349.23, 311.13, 261.63, 220, 196,
          ]

    const stepMs = theme === 'menu' ? 290 : theme === 'quick' ? 230 : 250

    this.ensureContext()

    this.musicInterval = window.setInterval(() => {
      const note = melody[this.musicStep % melody.length]
      if (theme === 'menu') {
        this.playTone(note, 0.14, 'triangle', 0.022)
        if (this.musicStep % 4 === 0) {
          this.playTone(note / 2, 0.22, 'sine', 0.014)
        }
      } else if (theme === 'quick') {
        this.playTone(note, 0.1, 'square', 0.022)
        this.playTone(note * 2, 0.045, 'triangle', 0.01, 0.012)
        if (this.musicStep % 4 === 0) {
          this.playTone(note / 2, 0.16, 'triangle', 0.013)
        }
      } else {
        this.playTone(note, 0.12, 'square', 0.022)
        if (this.musicStep % 4 === 0) {
          this.playTone(note / 2, 0.2, 'triangle', 0.014)
        }
      }

      this.musicStep += 1
    }, stepMs)
  }

  stopMusic(): void {
    if (this.musicInterval !== null) {
      window.clearInterval(this.musicInterval)
      this.musicInterval = null
    }
    this.musicTheme = null
    this.musicStep = 0
  }
}

export const chiptuneAudio = new ChiptuneAudio()
