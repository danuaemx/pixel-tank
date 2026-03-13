import type { SoundKey } from './game'

class ChiptuneAudio {
  private context: AudioContext | null = null

  private musicInterval: number | null = null

  private musicStep = 0

  private ensureContext(): AudioContext {
    if (!this.context) {
      this.context = new AudioContext()
    }

    if (this.context.state === 'suspended') {
      void this.context.resume()
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
    gainNode.gain.setValueAtTime(0.0001, startTime)
    gainNode.gain.exponentialRampToValueAtTime(volume, startTime + 0.01)
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

  startMusic(): void {
    if (this.musicInterval !== null) {
      return
    }

    const melody = [
      261.63, 293.66, 329.63, 392, 329.63, 293.66, 261.63, 196,
      246.94, 293.66, 329.63, 349.23, 392, 329.63, 293.66, 220,
    ]

    this.ensureContext()

    this.musicInterval = window.setInterval(() => {
      const note = melody[this.musicStep % melody.length]
      this.playTone(note, 0.1, 'square', 0.022)

      if (this.musicStep % 4 === 0) {
        this.playTone(note / 2, 0.18, 'triangle', 0.015)
      }

      this.musicStep += 1
    }, 210)
  }

  stopMusic(): void {
    if (this.musicInterval !== null) {
      window.clearInterval(this.musicInterval)
      this.musicInterval = null
    }
  }
}

export const chiptuneAudio = new ChiptuneAudio()
