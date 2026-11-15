import type { ApiPokemon } from '@draftmon/content'

const EFFECTS = {
  click: 'click.wav',
  tick: 'roll-step.wav',
  land: 'land.wav',
  reveal: 'roll-finish.wav',
  catch: 'catch-fast.mp3',
  reroll: 'roll-start.wav',
  move: 'move.wav',
  hit: 'hit.wav',
  super: 'super.wav',
  weak: 'weak.wav',
  crit: 'crit.wav',
  miss: 'miss.wav',
  faint: 'faint.wav',
  status: 'status.wav',
  statUp: 'statUp.wav',
  statDown: 'statDown.wav',
  heal: 'heal.wav',
  win: 'victory.mp3',
  lose: 'lose.wav',
  champion: 'champion.mp3',
}

export type SfxName = keyof typeof EFFECTS

export interface AudioSettings {
  master: number
  sfx: number
  music: number
  muted: boolean
}

const KEY = 'draft-league-audio-v1'
const DEFAULTS: AudioSettings = {
  master: 0.8,
  sfx: 0.7,
  music: 0.24,
  muted: false,
}

const TARGET_RMS = 0.06
const SAMPLE_PEAK = 0.2
const CRY_DURATION = 0.8

// Ignore silent tails when measuring volume and cap the gain by the sample's peak.
export function normalizedGain(buffer: AudioBuffer, seconds?: number) {
  const frames =
    seconds === undefined
      ? buffer.length
      : Math.min(buffer.length, Math.ceil(seconds * buffer.sampleRate))
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
      this.background = new Audio('/audio/draftmon-background.mp3')
      this.background.loop = true
      this.musicBus = ctx.createGain()
      this.musicBus.gain.value = this.settings.music * 0.5
      ctx
        .createMediaElementSource(this.background)
        .connect(this.musicBus)
        .connect(this.masterBus)
    }
    if (this.background.paused) void this.background.play().catch(() => {})
  }

  private applyVolumes() {
    if (!this.ctx || !this.masterBus || !this.sfxBus) return
    const { muted, master, sfx, music } = this.settings
    const time = this.ctx.currentTime
    this.masterBus.gain.setTargetAtTime(muted ? 0 : master, time, 0.02)
    this.sfxBus.gain.setTargetAtTime(sfx, time, 0.02)
    this.musicBus?.gain.setTargetAtTime(music * 0.5, time, 0.04)
  }

  play(name: SfxName) {
    const volume =
      name === 'tick' ? 0.28 : name === 'reveal' || name === 'reroll' ? 0.52 : 1
    this.playSample(`/audio/${EFFECTS[name]}`, 1, undefined, volume)
  }

  preload(name: SfxName) {
    if (this.ctx)
      void this.loadSample(this.ctx, `/audio/${EFFECTS[name]}`).catch(() => {})
  }

  move(type: string, attacking: boolean) {
    const pitch: Record<string, number> = {
      fire: 0.8,
      water: 0.9,
      electric: 1.45,
      grass: 1.15,
      ice: 1.25,
      rock: 0.72,
      ground: 0.75,
      ghost: 0.84,
      flying: 1.3,
      psychic: 1.2,
    }
    const effect = attacking ? 'move' : 'land'
    this.playSample(`/audio/${EFFECTS[effect]}`, pitch[type] ?? 1)
  }

  cry(pokemon: ApiPokemon) {
    const url = pokemon.cries?.latest ?? pokemon.cries?.legacy
    if (url) this.playSample(url, 1, CRY_DURATION)
  }

  private loadSample(ctx: AudioContext, url: string, maxDuration?: number) {
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
          gain: normalizedGain(sample, maxDuration),
        }))
        .catch((error) => {
          this.buffers.delete(url)
          throw error
        })
      this.buffers.set(url, buffer)
    }
    return buffer
  }

  private playSample(
    url: string,
    rate = 1,
    maxDuration?: number,
    volumeScale = 1,
  ) {
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
    const requestedAt = performance.now()
    void this.loadSample(ctx, url, maxDuration)
      .then(({ buffer, gain: normalGain }) => {
        if (ctx.state === 'closed' || performance.now() - requestedAt > 250)
          return
        const volume = normalGain * volumeScale
        const source = ctx.createBufferSource()
        const gain = ctx.createGain()
        gain.gain.value = volume
        source.buffer = buffer
        source.playbackRate.value = rate
        source.connect(gain).connect(bus)
        source.onended = () => {
          source.disconnect()
          gain.disconnect()
        }
        if (maxDuration !== undefined && buffer.duration / rate > maxDuration) {
          const end = ctx.currentTime + maxDuration
          gain.gain.setValueAtTime(volume, end - 0.08)
          gain.gain.linearRampToValueAtTime(0, end)
          source.start()
          source.stop(end)
        } else {
          source.start()
        }
      })
      .catch(() => {})
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
