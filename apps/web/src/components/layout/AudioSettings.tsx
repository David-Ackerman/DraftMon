import { Card } from '../ui/Card'
import { Button } from '../ui/Button'
import { useLanguage } from '../../services/language'
import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import type { AudioSettings as Settings } from '../../services/sound'
import { sound } from '../../services/sound'

function SpeakerIcon({ muted, level }: { muted: boolean; level: number }) {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
      <path d="M4 9h4l5-4v14l-5-4H4z" fill="currentColor" />
      {muted || level === 0 ? (
        <path
          d="M16 9l5 6M21 9l-5 6"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      ) : (
        <>
          <path
            d="M16 9.5a3.5 3.5 0 010 5"
            stroke="currentColor"
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
          />
          {level > 0.5 && (
            <path
              d="M18.5 7a7 7 0 010 10"
              stroke="currentColor"
              strokeWidth="2"
              fill="none"
              strokeLinecap="round"
            />
          )}
        </>
      )}
    </svg>
  )
}

const SLIDERS: [keyof Omit<Settings, 'muted'>, string, string][] = [
  ['master', 'Master', 'Volume geral'],
  ['music', 'Music', 'Música'],
  ['sfx', 'Effects', 'Efeitos'],
]

export function AudioSettings() {
  const { t } = useLanguage()
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
    <div className="relative" ref={ref}>
      <Button
        icon
        size="custom"
        className={`audio-toggle grid size-9.5 place-items-center rounded-[10px] text-[1rem] [&.muted]:text-muted ${settings.muted ? 'text-muted' : ''}`}
        aria-label={t('Sound settings', 'Configurações de som')}
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <SpeakerIcon muted={settings.muted} level={settings.master} />
      </Button>
      {open && (
        <Card
          compact
          className="absolute [top:calc(100%_+_8px)] right-0 z-60 grid w-65 gap-2.5 p-3.5 shadow-[0_12px_30px_#18244a30]"
          role="dialog"
          aria-label={t('Sound settings', 'Configurações de som')}
        >
          <div className="flex items-center justify-between">
            <b>{t('Sound', 'Som')}</b>
            <label className="switch flex cursor-pointer items-center gap-1.5 text-[.8rem] text-muted [&_input]:h-4 [&_input]:w-4 [&_input]:[accent-color:var(--primary)]">
              <input
                type="checkbox"
                checked={!settings.muted}
                onChange={(e) => sound.update({ muted: !e.target.checked })}
              />
              <span>
                {settings.muted ? t('Off', 'Desligado') : t('On', 'Ligado')}
              </span>
            </label>
          </div>
          {SLIDERS.map(([key, label, labelPt]) => (
            <label
              key={key}
              className="slider-row grid grid-cols-[56px_1fr_30px] items-center gap-2 text-[.82rem] [&_input]:w-full [&_input]:[accent-color:var(--primary)] [&_input:disabled]:[opacity:.4]"
            >
              <span>{t(label, labelPt)}</span>
              <input
                type="range"
                min={0}
                max={100}
                value={Math.round(settings[key] * 100)}
                disabled={settings.muted}
                onChange={(e) =>
                  sound.update({ [key]: Number(e.target.value) / 100 })
                }
                onPointerUp={() => key === 'sfx' && sound.play('land')}
              />
              <span className="text-right text-muted tabular-nums">
                {Math.round(settings[key] * 100)}
              </span>
            </label>
          ))}
        </Card>
      )}
    </div>
  )
}
