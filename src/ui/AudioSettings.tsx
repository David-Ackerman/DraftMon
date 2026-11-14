import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import type { AudioSettings as Settings } from './sound'
import { sound } from './sound'

function SpeakerIcon({ muted, level }: { muted: boolean; level: number }) {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
      <path d="M4 9h4l5-4v14l-5-4H4z" fill="currentColor" />
      {muted || level === 0 ? (
        <path d="M16 9l5 6M21 9l-5 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      ) : (
        <>
          <path d="M16 9.5a3.5 3.5 0 010 5" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" />
          {level > 0.5 && <path d="M18.5 7a7 7 0 010 10" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" />}
        </>
      )}
    </svg>
  )
}

const SLIDERS: [keyof Omit<Settings, 'muted'>, string][] = [
  ['master', 'Master'],
  ['music', 'Music'],
  ['sfx', 'Effects'],
]

export function AudioSettings() {
  const settings = useSyncExternalStore(sound.subscribe, sound.getSettings)
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const close = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false)
    }
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('pointerdown', close)
    document.addEventListener('keydown', esc)
    return () => {
      document.removeEventListener('pointerdown', close)
      document.removeEventListener('keydown', esc)
    }
  }, [open])

  return (
    <div className="audio" ref={ref}>
      <button
        className={`icon-btn audio-toggle ${settings.muted ? 'muted' : ''}`}
        aria-label="Sound settings"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <SpeakerIcon muted={settings.muted} level={settings.master} />
      </button>
      {open && (
        <div className="audio-panel card" role="dialog" aria-label="Sound settings">
          <div className="audio-head">
            <b>Sound</b>
            <label className="switch">
              <input type="checkbox" checked={!settings.muted} onChange={(e) => sound.update({ muted: !e.target.checked })} />
              <span>{settings.muted ? 'Off' : 'On'}</span>
            </label>
          </div>
          {SLIDERS.map(([key, label]) => (
            <label key={key} className="slider-row">
              <span>{label}</span>
              <input
                type="range"
                min={0}
                max={100}
                value={Math.round(settings[key] * 100)}
                disabled={settings.muted}
                onChange={(e) => sound.update({ [key]: Number(e.target.value) / 100 })}
                onPointerUp={() => key === 'sfx' && sound.play('land')}
              />
              <span className="slider-value">{Math.round(settings[key] * 100)}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  )
}
