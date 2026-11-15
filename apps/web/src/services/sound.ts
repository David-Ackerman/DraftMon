const EFFECTS = {
  click: 'menu-tap.wav',
  tick: 'roll-step.wav',
  reveal: 'roll-finish.wav',
  catch: 'catch-fast.mp3',
  reroll: 'roll-start.wav',
  hit: 'battle-impact.wav',
  faint: 'battle-knockout.wav',
  win: 'victory.mp3',
  lose: 'lose.wav',
  champion: 'champion.mp3',
}

export type SfxName = keyof typeof EFFECTS
export type BattleCue = Extract<SfxName, 'hit' | 'faint' | 'win' | 'lose'>

export interface AudioSettings {
  master: number
  sfx: number
  music: number
  muted: boolean
}

const KEY = 'draft-league-audio-v1'
const DEFAULTS: AudioSettings = {
  master: 0.5,
  sfx: 0.5,
  music: 0.5,
  muted: false,
}

const TARGET_RMS = 0.06
const SAMPLE_PEAK = 0.2
const MUSIC_TRIM = 0.38
const BATTLE_MUSIC_TRIM = 0.68
const SFX_TRIM: Partial<Record<SfxName, number>> = {
  click: 0.55,
  tick: 0.28,
  reveal: 0.52,
  reroll: 0.52,
  hit: 0.72,
  faint: 0.72,
  win: 0.72,
  lose: 0.72,
}

// Ignore silent tails when measuring volume and cap the gain by the sample's peak.
export function normalizedGain(buffer: AudioBuffer) {
  const frames = buffer.length
  const windowSize = Math.max(1, Math.round(buffer.sampleRate * 0.02))
  const channels = Array.from({ length: buffer.numberOfChannels }, (_, index) =>
    buffer.getChannelData(index),
  )
  const windows: { energy: number; count: number }[] = []
  let peak = 0
  let maxPower = 0
  for (let start = 0; start < frames; start += windowSize) {
    const end = Math.min(start + windowSize, frames)
    const count = (end - start) * channels.length
    let energy = 0
    for (const channel of channels) {
      for (let frame = start; frame < end; frame++) {
        const value = channel[frame]
        peak = Math.max(peak, Math.abs(value))
        energy += value * value
      }
    }
    maxPower = Math.max(maxPower, energy / count)
    windows.push({ energy, count })
  }
  if (!peak) return 0

  let activeEnergy = 0
  let activeCount = 0
  for (const { energy, count } of windows) {
    if (energy / count < maxPower * 0.04) continue
    activeEnergy += energy
    activeCount += count
  }
  return Math.min(
    TARGET_RMS / Math.sqrt(activeEnergy / activeCount),
    SAMPLE_PEAK / peak,
  )
}

interface Sample {
  buffer: AudioBuffer
  gain: number
}

class SoundEngine {
  private ctx: AudioContext | null = null
  private masterBus: GainNode | null = null
  private sfxBus: GainNode | null = null
  private musicBus: GainNode | null = null
  private background: HTMLAudioElement | null = null
  private battleActive = false
  private buffers = new Map<string, Promise<Sample>>()
  private listeners = new Set<() => void>()
  private settings: AudioSettings = this.load()

  private load(): AudioSettings {
    try {
      const raw = localStorage.getItem(KEY)
      if (!raw) return { ...DEFAULTS }
      const {
        master = DEFAULTS.master,
        sfx = DEFAULTS.sfx,
        music = DEFAULTS.music,
        muted = DEFAULTS.muted,
      } = JSON.parse(raw)
      return { master, sfx, music, muted }
    } catch {
      return { ...DEFAULTS }
    }
  }

  subscribe = (fn: () => void) => {
    this.listeners.add(fn)
    return () => this.listeners.delete(fn)
  }

  getSettings = () => this.settings

  update(patch: Partial<AudioSettings>) {
    this.settings = { ...this.settings, ...patch }
    try {
      localStorage.setItem(KEY, JSON.stringify(this.settings))
    } catch {
      // Settings can still be used for the current session.
    }
    this.applyVolumes()
    this.updateBackground()
    this.listeners.forEach((fn) => fn())
  }

  unlock() {
    if (!this.ctx) {
      const Context =
        window.AudioContext ??
        (window as typeof window & { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext
      if (!Context) return
      this.ctx = new Context()
      this.masterBus = this.ctx.createGain()
      this.sfxBus = this.ctx.createGain()
      const compressor = this.ctx.createDynamicsCompressor()
      compressor.threshold.value = -18
      compressor.knee.value = 8
      compressor.ratio.value = 8
      compressor.attack.value = 0.002
      compressor.release.value = 0.1
      this.sfxBus.connect(compressor).connect(this.masterBus)
      this.masterBus.connect(this.ctx.destination)
      this.applyVolumes()
    }
    if (this.ctx.state === 'suspended') void this.ctx.resume().catch(() => {})
    this.updateBackground()
  }

  private updateBackground() {
    const ctx = this.ctx
    if (!ctx || !this.masterBus) return
    if (this.settings.muted || !this.settings.master || !this.settings.music) {
      this.background?.pause()
      return
    }
    if (!this.background) {
      this.background = new Audio('/audio/draftmon-league-theme.mp3')
      this.background.loop = true
      this.musicBus = ctx.createGain()
      this.musicBus.gain.value = this.musicVolume()
      ctx
        .createMediaElementSource(this.background)
        .connect(this.musicBus)
        .connect(this.masterBus)
    }
    if (this.background.paused) void this.background.play().catch(() => {})
  }

  private applyVolumes() {
    if (!this.ctx || !this.masterBus || !this.sfxBus) return
    const { muted, master, sfx } = this.settings
    const time = this.ctx.currentTime
    this.masterBus.gain.setTargetAtTime(muted ? 0 : master, time, 0.02)
    this.sfxBus.gain.setTargetAtTime(sfx, time, 0.02)
    this.musicBus?.gain.setTargetAtTime(this.musicVolume(), time, 0.12)
  }

  private musicVolume() {
    return (
      this.settings.music *
      MUSIC_TRIM *
      (this.battleActive ? BATTLE_MUSIC_TRIM : 1)
    )
  }

  setBattleActive(active: boolean) {
    this.battleActive = active
    this.applyVolumes()
  }

  play(name: SfxName) {
    this.playSample(name)
  }

  playBattle(name: BattleCue) {
    return this.playSample(name)
  }

  preload(name: SfxName) {
    if (this.ctx)
      void this.loadSample(this.ctx, `/audio/${EFFECTS[name]}`).catch(() => {})
  }

  private loadSample(ctx: AudioContext, url: string) {
    let buffer = this.buffers.get(url)
    if (!buffer) {
      buffer = fetch(url)
        .then((response) => {
          if (!response.ok) throw new Error(`Audio unavailable: ${url}`)
          return response.arrayBuffer()
        })
        .then((bytes) => ctx.decodeAudioData(bytes))
        .then((sample) => ({
          buffer: sample,
          gain: normalizedGain(sample),
        }))
        .catch((error) => {
          this.buffers.delete(url)
          throw error
        })
      this.buffers.set(url, buffer)
    }
    return buffer
  }

  private playSample(name: SfxName) {
    const ctx = this.ctx
    const bus = this.sfxBus
    if (
      !ctx ||
      !bus ||
      this.settings.muted ||
      !this.settings.sfx ||
      !this.settings.master
    )
      return
    let cancelled = false
    let stop: (() => void) | undefined
    const requestedAt = performance.now()
    void this.loadSample(ctx, `/audio/${EFFECTS[name]}`)
      .then(({ buffer, gain: normalGain }) => {
        if (
          cancelled ||
          ctx.state === 'closed' ||
          performance.now() - requestedAt > 250
        )
          return
        const volume = normalGain * (SFX_TRIM[name] ?? 1)
        const source = ctx.createBufferSource()
        const gain = ctx.createGain()
        gain.gain.value = volume
        source.buffer = buffer
        source.connect(gain).connect(bus)
        source.onended = () => {
          stop = undefined
          source.disconnect()
          gain.disconnect()
        }
        stop = () => {
          if (ctx.state === 'closed') return
          const now = ctx.currentTime
          gain.gain.setValueAtTime(volume, now)
          gain.gain.linearRampToValueAtTime(0, now + 0.02)
          source.stop(now + 0.02)
        }
        source.start()
      })
      .catch(() => {})
    return () => {
      cancelled = true
      stop?.()
    }
  }

  dispose() {
    this.background?.pause()
    this.background?.removeAttribute('src')
    this.background?.load()
    this.background = null
    this.musicBus = null
    this.masterBus = null
    this.sfxBus = null
    void this.ctx?.close().catch(() => {})
    this.ctx = null
    this.buffers.clear()
  }
}

export const sound = new SoundEngine()
