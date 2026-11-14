/**
 * Synthesized sound effects and music (Web Audio API, no audio files).
 * Browsers only allow audio after a user gesture, so the AudioContext is
 * created on the first click/tap (see `unlock`).
 */

export type SfxName =
  | 'click'
  | 'tick'
  | 'land'
  | 'reveal'
  | 'pick'
  | 'reroll'
  | 'move'
  | 'hit'
  | 'super'
  | 'weak'
  | 'crit'
  | 'miss'
  | 'faint'
  | 'switch'
  | 'status'
  | 'statUp'
  | 'statDown'
  | 'heal'
  | 'win'
  | 'lose'
  | 'champion'

export type Track = 'menu' | 'battle'

export interface AudioSettings {
  master: number
  music: number
  sfx: number
  muted: boolean
}

const KEY = 'draft-league-audio-v1'
const DEFAULTS: AudioSettings = { master: 0.8, music: 0.35, sfx: 0.7, muted: false }

const midi = (n: number) => 440 * 2 ** ((n - 69) / 12)

// ------------------------------------------------------------------ music data
// 16 steps per bar; each track loops over its chord list (one chord per bar).
interface TrackDef {
  bpm: number
  chords: number[][] // midi notes, root first
  bass: (step: number, chord: number[]) => number | null
  lead: (step: number, chord: number[], bar: number) => number | null
  kick: (step: number) => boolean
  leadWave: OscillatorType
  bassWave: OscillatorType
  leadVol: number
  bassVol: number
}

const TRACKS: Record<Track, TrackDef> = {
  menu: {
    bpm: 92,
    chords: [
      [57, 60, 64],
      [53, 57, 60],
      [48, 52, 55],
      [55, 59, 62],
    ],
    bass: (s, c) => (s === 0 || s === 8 ? c[0] - 12 : s === 12 ? c[2] - 12 : null),
    lead: (s, c, bar) => {
      if (s % 2) return null
      const pattern = [0, 1, 2, 1, 0, 2, 1, 2]
      const note = c[pattern[(s / 2) % 8]] + 12
      return bar % 2 && s === 14 ? note + 2 : note
    },
    kick: () => false,
    leadWave: 'triangle',
    bassWave: 'sine',
    leadVol: 0.09,
    bassVol: 0.16,
  },
  battle: {
    bpm: 138,
    chords: [
      [52, 55, 59],
      [48, 52, 55],
      [50, 54, 57],
      [47, 51, 54],
    ],
    bass: (s, c) => (s % 2 === 0 ? c[0] - 12 + (s % 4 === 2 ? 12 : 0) : null),
    lead: (s, c, bar) => {
      const riff = [2, null, 1, null, 0, 1, 2, null, 2, null, 1, 0, null, 1, 2, null]
      const idx = riff[s]
      if (idx === null) return null
      return c[idx] + (bar % 4 === 3 && s > 8 ? 24 : 12)
    },
    kick: (s) => s % 4 === 0,
    leadWave: 'square',
    bassWave: 'sawtooth',
    leadVol: 0.045,
    bassVol: 0.07,
  },
}

class SoundEngine {
  private ctx: AudioContext | null = null
  private masterBus: GainNode | null = null
  private sfxBus: GainNode | null = null
  private musicBus: GainNode | null = null
  private noiseBuffer: AudioBuffer | null = null
  private listeners = new Set<() => void>()
  settings: AudioSettings = this.load()

  // music sequencer state
  private wantedTrack: Track | null = null
  private playingTrack: Track | null = null
  private timer: ReturnType<typeof setInterval> | null = null
  private step = 0
  private nextTime = 0

  private load(): AudioSettings {
    try {
      const raw = localStorage.getItem(KEY)
      return raw ? { ...DEFAULTS, ...JSON.parse(raw) } : { ...DEFAULTS }
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
      /* ignore */
    }
    this.applyVolumes()
    this.listeners.forEach((fn) => fn())
  }

  /** Must be called from a user gesture before anything is audible. */
  unlock() {
    if (!this.ctx) {
      const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
      if (!Ctx) return
      this.ctx = new Ctx()
      this.masterBus = this.ctx.createGain()
      this.sfxBus = this.ctx.createGain()
      this.musicBus = this.ctx.createGain()
      this.sfxBus.connect(this.masterBus)
      this.musicBus.connect(this.masterBus)
      this.masterBus.connect(this.ctx.destination)
      const len = this.ctx.sampleRate
      this.noiseBuffer = this.ctx.createBuffer(1, len, this.ctx.sampleRate)
      const data = this.noiseBuffer.getChannelData(0)
      for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1
      this.applyVolumes()
    }
    if (this.ctx.state === 'suspended') void this.ctx.resume()
    if (this.wantedTrack && this.playingTrack !== this.wantedTrack) this.startTrack(this.wantedTrack)
  }

  private applyVolumes() {
    if (!this.ctx || !this.masterBus || !this.sfxBus || !this.musicBus) return
    const t = this.ctx.currentTime
    const s = this.settings
    this.masterBus.gain.setTargetAtTime(s.muted ? 0 : s.master, t, 0.02)
    this.sfxBus.gain.setTargetAtTime(s.sfx, t, 0.02)
    this.musicBus.gain.setTargetAtTime(s.music, t, 0.02)
  }

  // ---------------------------------------------------------------- primitives

  private tone(
    bus: GainNode,
    freq: number,
    start: number,
    dur: number,
    { type = 'square' as OscillatorType, vol = 0.2, slideTo = 0, attack = 0.005 } = {},
  ) {
    const ctx = this.ctx!
    const osc = ctx.createOscillator()
    const g = ctx.createGain()
    osc.type = type
    osc.frequency.setValueAtTime(freq, start)
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, start + dur)
    g.gain.setValueAtTime(0.0001, start)
    g.gain.exponentialRampToValueAtTime(vol, start + attack)
    g.gain.exponentialRampToValueAtTime(0.0001, start + dur)
    osc.connect(g).connect(bus)
    osc.start(start)
    osc.stop(start + dur + 0.02)
  }

  private noise(bus: GainNode, start: number, dur: number, { vol = 0.2, freq = 1200, q = 0.8, sweepTo = 0 } = {}) {
    const ctx = this.ctx!
    const src = ctx.createBufferSource()
    src.buffer = this.noiseBuffer
    const filter = ctx.createBiquadFilter()
    filter.type = 'bandpass'
    filter.frequency.setValueAtTime(freq, start)
    if (sweepTo) filter.frequency.exponentialRampToValueAtTime(sweepTo, start + dur)
    filter.Q.value = q
    const g = ctx.createGain()
    g.gain.setValueAtTime(vol, start)
    g.gain.exponentialRampToValueAtTime(0.0001, start + dur)
    src.connect(filter).connect(g).connect(bus)
    src.start(start)
    src.stop(start + dur + 0.02)
  }

  private notes(bus: GainNode, list: [number, number, number][], type: OscillatorType = 'square', vol = 0.15) {
    const t = this.ctx!.currentTime
    for (const [note, at, dur] of list) this.tone(bus, midi(note), t + at, dur, { type, vol })
  }

  // ---------------------------------------------------------------- effects

  play(name: SfxName, pitch = 0) {
    if (!this.ctx || !this.sfxBus || this.settings.muted) return
    const bus = this.sfxBus
    const t = this.ctx.currentTime
    switch (name) {
      case 'click':
        this.tone(bus, 520, t, 0.05, { type: 'square', vol: 0.06 })
        break
      case 'tick':
        this.tone(bus, 1100 + pitch * 40, t, 0.035, { type: 'triangle', vol: 0.12 })
        break
      case 'land':
        this.notes(bus, [[84, 0, 0.12], [91, 0.07, 0.25]], 'triangle', 0.18)
        break
      case 'reveal':
        this.noise(bus, t, 0.25, { vol: 0.12, freq: 600, sweepTo: 4000 })
        this.notes(bus, [[72, 0.05, 0.12], [76, 0.11, 0.12], [79, 0.17, 0.2]], 'triangle', 0.12)
        break
      case 'pick':
        this.notes(bus, [[72, 0, 0.1], [76, 0.07, 0.1], [79, 0.14, 0.1], [84, 0.21, 0.3]], 'square', 0.1)
        break
      case 'reroll':
        this.noise(bus, t, 0.35, { vol: 0.18, freq: 300, sweepTo: 3000, q: 1.5 })
        break
      case 'move':
        this.noise(bus, t, 0.12, { vol: 0.08, freq: 2500, sweepTo: 800 })
        break
      case 'hit':
        this.noise(bus, t, 0.15, { vol: 0.35, freq: 900 })
        this.tone(bus, 160, t, 0.15, { type: 'sine', vol: 0.3, slideTo: 60 })
        break
      case 'weak':
        this.noise(bus, t, 0.1, { vol: 0.15, freq: 600 })
        break
      case 'super':
        this.noise(bus, t, 0.25, { vol: 0.45, freq: 1500, q: 0.5 })
        this.tone(bus, 220, t, 0.25, { type: 'square', vol: 0.18, slideTo: 55 })
        this.tone(bus, 880, t + 0.04, 0.12, { type: 'square', vol: 0.08, slideTo: 1760 })
        break
      case 'crit':
        this.noise(bus, t, 0.2, { vol: 0.4, freq: 2500, q: 0.6 })
        this.tone(bus, 1320, t, 0.18, { type: 'sawtooth', vol: 0.08, slideTo: 660 })
        break
      case 'miss':
        this.noise(bus, t, 0.3, { vol: 0.12, freq: 3000, sweepTo: 500 })
        break
      case 'faint':
        this.tone(bus, 600, t, 0.7, { type: 'square', vol: 0.12, slideTo: 80 })
        break
      case 'switch':
        this.tone(bus, 300, t, 0.18, { type: 'triangle', vol: 0.15, slideTo: 900 })
        this.tone(bus, 1200, t + 0.15, 0.1, { type: 'triangle', vol: 0.1 })
        break
      case 'status':
        for (let i = 0; i < 4; i++) this.tone(bus, i % 2 ? 330 : 440, t + i * 0.07, 0.07, { type: 'square', vol: 0.07 })
        break
      case 'statUp':
        this.notes(bus, [[67, 0, 0.08], [71, 0.06, 0.08], [74, 0.12, 0.12]], 'triangle', 0.13)
        break
      case 'statDown':
        this.notes(bus, [[74, 0, 0.08], [70, 0.06, 0.08], [65, 0.12, 0.14]], 'triangle', 0.13)
        break
      case 'heal':
        this.notes(bus, [[79, 0, 0.1], [83, 0.08, 0.1], [86, 0.16, 0.2]], 'sine', 0.15)
        break
      case 'win':
        this.notes(bus, [[67, 0, 0.12], [72, 0.12, 0.12], [76, 0.24, 0.12], [79, 0.36, 0.4], [76, 0.56, 0.12], [79, 0.68, 0.6]], 'square', 0.1)
        break
      case 'lose':
        this.notes(bus, [[67, 0, 0.25], [63, 0.25, 0.25], [60, 0.5, 0.25], [55, 0.75, 0.7]], 'triangle', 0.15)
        break
      case 'champion':
        this.notes(
          bus,
          [[60, 0, 0.15], [64, 0.15, 0.15], [67, 0.3, 0.15], [72, 0.45, 0.3], [67, 0.75, 0.15], [72, 0.9, 0.15], [76, 1.05, 0.15], [79, 1.2, 0.8]],
          'square',
          0.1,
        )
        break
    }
  }

  // ---------------------------------------------------------------- music

  setMusic(track: Track | null) {
    this.wantedTrack = track
    if (!this.ctx) return // starts on unlock
    if (track === this.playingTrack) return
    this.stopTrack()
    if (track) this.startTrack(track)
  }

  private startTrack(track: Track) {
    if (!this.ctx) return
    this.stopTrack()
    this.playingTrack = track
    this.step = 0
    this.nextTime = this.ctx.currentTime + 0.1
    this.timer = setInterval(() => this.schedule(), 25)
  }

  dispose() {
    this.stopTrack()
    void this.ctx?.close()
    this.ctx = null
  }

  private stopTrack() {
    if (this.timer) clearInterval(this.timer)
    this.timer = null
    this.playingTrack = null
  }

  private schedule() {
    if (!this.ctx || !this.musicBus || !this.playingTrack) return
    const def = TRACKS[this.playingTrack]
    const stepDur = 60 / def.bpm / 4
    const silent = this.settings.muted || this.settings.music === 0 || this.settings.master === 0
    while (this.nextTime < this.ctx.currentTime + 0.12) {
      if (silent) {
        // keep time so the loop resumes in rhythm, but create no nodes
        this.nextTime += stepDur
        this.step++
        continue
      }
      const s = this.step % 16
      const bar = Math.floor(this.step / 16)
      const chord = def.chords[bar % def.chords.length]
      const bass = def.bass(s, chord)
      if (bass !== null) this.tone(this.musicBus, midi(bass), this.nextTime, stepDur * 1.8, { type: def.bassWave, vol: def.bassVol })
      const lead = def.lead(s, chord, bar)
      if (lead !== null) this.tone(this.musicBus, midi(lead), this.nextTime, stepDur * 0.9, { type: def.leadWave, vol: def.leadVol })
      if (def.kick(s)) this.tone(this.musicBus, 140, this.nextTime, 0.12, { type: 'sine', vol: 0.25, slideTo: 45 })
      this.nextTime += stepDur
      this.step++
    }
  }
}

export const sound = new SoundEngine()

// dev only: stop the old engine's music when this module is hot-reloaded
if (import.meta.hot) {
  import.meta.hot.dispose(() => sound.dispose())
}
