import type { SoundKey } from './game'

export type UiSoundKey = 'ui-nav' | 'ui-action' | 'ui-step' | 'ui-toggle' | 'ui-danger'
export type MusicTheme = 'menu' | 'screens' | 'program' | 'game' | 'quick' | 'victory'

const MUSIC_TRACKS: Record<MusicTheme, string> = {
  menu: '/music/Menu.mp3',
  screens: '/music/otras_pantallas.mp3',
  program: '/music/programar_sad.mp3',
  game: '/music/jugar_1.mp3',
  quick: '/music/jugar_2.mp3',
  victory: '/music/jugar_3.mp3',
}

class ChiptuneAudio {
  private context: AudioContext | null = null

  private musicTheme: MusicTheme | null = null

  private musicElement: HTMLAudioElement | null = null

  private musicNextElement: HTMLAudioElement | null = null

  private musicLoopFrame: number | null = null

  private musicTransitionStart = 0

  private musicSessionToken = 0

  private masterVolume = 1.7

  private readonly musicFadeSeconds = 0.05

  private readonly musicLeadSeconds = 0.05

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

  private getMusicElement(theme: MusicTheme): HTMLAudioElement {
    return this.createMusicElement(theme)
  }

  private syncMusicVolume(): void {
    if (!this.musicElement) {
      return
    }

    const targetVolume = this.getMusicVolume()
    this.musicElement.volume = targetVolume

    if (this.musicNextElement) {
      this.musicNextElement.volume = targetVolume
    }
  }

  private getMusicVolume(): number {
    return Math.min(1, Math.max(0, this.masterVolume * 0.22))
  }

  private createMusicElement(theme: MusicTheme): HTMLAudioElement {
    const element = new Audio(MUSIC_TRACKS[theme])
    element.loop = false
    element.preload = 'auto'
    element.volume = this.getMusicVolume()
    return element
  }

  private clearMusicLoop(): void {
    if (this.musicLoopFrame !== null) {
      window.cancelAnimationFrame(this.musicLoopFrame)
      this.musicLoopFrame = null
    }

    this.musicTransitionStart = 0

    if (this.musicNextElement) {
      this.musicNextElement.pause()
      this.musicNextElement.currentTime = 0
      this.musicNextElement = null
    }
  }

  private monitorMusic(theme: MusicTheme, sessionToken: number): void {
    const tick = () => {
      if (
        sessionToken !== this.musicSessionToken ||
        this.musicTheme !== theme ||
        !this.musicElement
      ) {
        this.musicLoopFrame = null
        return
      }

      const sourceElement = this.musicElement

      if (this.musicNextElement) {
        const progress = Math.min(
          1,
          (performance.now() - this.musicTransitionStart) / (this.musicFadeSeconds * 1000),
        )
        const targetVolume = this.getMusicVolume()
        sourceElement.volume = targetVolume * (1 - progress)
        this.musicNextElement.volume = targetVolume * progress

        if (progress >= 1) {
          sourceElement.pause()
          sourceElement.currentTime = 0
          this.musicElement = this.musicNextElement
          this.musicNextElement = null
          this.musicTransitionStart = 0
          this.syncMusicVolume()
        }

        this.musicLoopFrame = window.requestAnimationFrame(tick)
        return
      }

      const duration = sourceElement.duration
      if (!Number.isFinite(duration) || duration <= 0) {
        this.musicLoopFrame = window.requestAnimationFrame(tick)
        return
      }

      const remaining = duration - sourceElement.currentTime
      if (remaining <= this.musicLeadSeconds) {
        const nextElement = this.createMusicElement(theme)
        nextElement.currentTime = 0
        nextElement.volume = 0
        this.musicNextElement = nextElement
        this.musicTransitionStart = performance.now()

        void nextElement.play().catch(() => {
          if (this.musicNextElement === nextElement) {
            this.musicNextElement = null
            this.musicTransitionStart = 0
          }
        })
      }

      this.musicLoopFrame = window.requestAnimationFrame(tick)
    }

    this.musicLoopFrame = window.requestAnimationFrame(tick)
  }

  setMasterVolume(multiplier: number): void {
    if (!Number.isFinite(multiplier)) {
      return
    }

    this.masterVolume = Math.min(3.5, Math.max(0.05, multiplier))
    this.syncMusicVolume()
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
    if (this.musicTheme === theme && this.musicElement && !this.musicElement.paused) {
      this.syncMusicVolume()
      if (this.musicLoopFrame === null) {
        this.monitorMusic(theme, this.musicSessionToken)
      }
      return
    }

    this.musicSessionToken += 1
    this.clearMusicLoop()

    if (this.musicElement) {
      this.musicElement.pause()
      this.musicElement.currentTime = 0
    }

    const musicElement = this.getMusicElement(theme)
    musicElement.currentTime = 0
    musicElement.volume = this.getMusicVolume()
    this.musicElement = musicElement
    this.musicTheme = theme
    void musicElement.play().catch(() => {
      // Ignorado: el navegador puede bloquear la reproducción hasta una interacción real.
    })

    this.monitorMusic(theme, this.musicSessionToken)
  }

  stopMusic(): void {
    if (this.musicElement) {
      this.musicElement.pause()
      this.musicElement.currentTime = 0
    }
    this.clearMusicLoop()
    this.musicTheme = null
    this.musicElement = null
    this.musicSessionToken += 1
  }
}

export const chiptuneAudio = new ChiptuneAudio()
