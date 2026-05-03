import { getPublicAssetUrl } from './utils'

type BootAsset =
  | { kind: 'image'; path: string }
  | { kind: 'audio'; path: string }

const BOOT_ASSETS: BootAsset[] = [
  { kind: 'image', path: 'favicon.svg' },
  { kind: 'image', path: 'thank1.png' },
  { kind: 'image', path: 'cursors/cursor-default.svg' },
  { kind: 'image', path: 'cursors/cursor-pointer.svg' },
  { kind: 'image', path: 'cursors/cursor-drag.svg' },
  { kind: 'image', path: 'cursors/cursor-grabbing.svg' },
  { kind: 'image', path: 'effects/trophy.svg' },
  { kind: 'image', path: 'effects/mine-advanced.svg' },
  { kind: 'image', path: 'effects/explosion-bomb.svg' },
  { kind: 'image', path: 'effects/explosion-mine.svg' },
  { kind: 'image', path: 'effects/explosion-shot.svg' },
  { kind: 'image', path: 'effects/explosion-impact.svg' },
  { kind: 'audio', path: 'music/Menu.mp3' },
  { kind: 'audio', path: 'music/otras_pantallas.mp3' },
  { kind: 'audio', path: 'music/programar_sad.mp3' },
  { kind: 'audio', path: 'music/jugar_1.mp3' },
  { kind: 'audio', path: 'music/jugar_2.mp3' },
  { kind: 'audio', path: 'music/jugar_3.mp3' },
  { kind: 'audio', path: 'music/programar_happy_ganar.mp3' },
]

export type BootProgress = {
  loaded: number
  total: number
}

function preloadImage(url: string): Promise<void> {
  return new Promise((resolve) => {
    const image = new Image()
    let settled = false

    const finish = () => {
      if (settled) {
        return
      }

      settled = true
      resolve()
    }

    image.onload = finish
    image.onerror = finish
    image.src = url

    if (image.complete) {
      finish()
    }
  })
}

function preloadAudio(url: string): Promise<void> {
  return new Promise((resolve) => {
    const audio = new Audio()
    let settled = false

    const finish = () => {
      if (settled) {
        return
      }

      settled = true
      window.clearTimeout(timeoutId)
      resolve()
    }

    const timeoutId = window.setTimeout(finish, 5000)

    audio.preload = 'auto'
    audio.addEventListener('canplaythrough', finish, { once: true })
    audio.addEventListener('loadeddata', finish, { once: true })
    audio.addEventListener('error', finish, { once: true })
    audio.src = url
    audio.load()
  })
}

export function preloadBootAssets(onProgress?: (progress: BootProgress) => void): Promise<void> {
  const total = BOOT_ASSETS.length
  let loaded = 0

  onProgress?.({ loaded, total })

  const tasks = BOOT_ASSETS.map(async (asset) => {
    const assetUrl = getPublicAssetUrl(asset.path)

    try {
      if (asset.kind === 'image') {
        await preloadImage(assetUrl)
      } else {
        await preloadAudio(assetUrl)
      }
    } finally {
      loaded += 1
      onProgress?.({ loaded, total })
    }
  })

  return Promise.all(tasks).then(() => undefined)
}