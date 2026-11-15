import Image from 'next/image'
import { HudTag } from '../ui/HudTag'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'
import { useEffect, useMemo, useRef, useState } from 'react'
import { gameData } from '@draftmon/content'
import { displayName, regionLabel } from '@draftmon/engine'
import type { ApiPokemon } from '@draftmon/content'
import type { RerollMode, Roll } from '@draftmon/engine'
import { TEAM_SIZE } from '@draftmon/engine'
import { Sprite } from '../pokemon/Sprite'
import { TypeBadge } from '../pokemon/TypeBadge'
import { LoreCard } from '../pokemon/LoreCard'
import { regions } from '../pokemon/lore'
import { CaptureDialog } from './CaptureDialog'
import { DraftList } from './DraftList'
import { Dice, Reel } from './RollReel'
import { sound } from '../../services/sound'
import { useLanguage } from '../../services/language'

type Stage = 'ready' | 'spinning' | 'shown'

export function Draft({
  run,
  onPick,
  onReroll,
}: {
  run: { roll: Roll | null; team: string[]; rerollsLeft: number }
  onPick: (name: string) => void | Promise<boolean>
  onReroll: (mode: RerollMode) => void | Promise<boolean>
}) {
  const { t } = useLanguage()
  const roll = run.roll!
  const [stage, setStage] = useState<Stage>('ready')
  const [spin, setSpin] = useState({ region: false, type: false })
  const [captured, setCaptured] = useState<ApiPokemon | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const pending = useRef(0)
  const regionNames = useMemo(() => gameData.regions.map((r) => r.name), [])
  const typeNames = useMemo(() => gameData.types.map((t) => t.name), [])
  const canReroll =
    stage === 'shown' && !captured && !submitting && run.rerollsLeft > 0

  useEffect(() => {
    for (const region of regionNames) {
      const artwork = new window.Image()
      artwork.src = `/regions/${region}.webp`
    }
  }, [regionNames])

  const startSpin = (parts: { region: boolean; type: boolean }) => {
    pending.current = Number(parts.region) + Number(parts.type)
    setSpin(parts)
    setStage('spinning')
  }

  const reelStopped = () => {
    pending.current--
    if (pending.current <= 0) {
      setSpin({ region: false, type: false })
      setStage('shown')
      sound.play('reveal')
    }
  }

  const reroll = async (mode: RerollMode) => {
    if (!canReroll) return
    setSubmitting(true)
    sound.play('reroll')
    try {
      if ((await onReroll(mode)) !== false)
        startSpin({ region: mode !== 'type', type: mode !== 'region' })
    } finally {
      setSubmitting(false)
    }
  }

  const hidden = stage === 'ready'

  const catchPokemon = (name: string) => {
    const pokemon = gameData.pokemonByName.get(name)
    if (captured || submitting || !pokemon) return
    setCaptured(pokemon)
    sound.play('catch')
  }

  return (
    <div className="draft">
      <div className="mx-0 mt-2 mb-4.5 flex flex-wrap gap-2">
        {Array.from({ length: TEAM_SIZE }, (_, i) => {
          const p = run.team[i]
            ? gameData.pokemonByName.get(run.team[i])
            : undefined
          return (
            <div
              key={i}
              className={`slot grid h-16 w-16 place-items-center rounded-xl border-2 border-dashed border-line font-bold text-muted [&.filled]:[border-style:solid] [&.filled]:bg-panel [&.next]:[border-style:dashed] [&.next]:border-accent [&.next]:text-brand ${p ? 'filled' : ''} ${i === run.team.length ? 'next' : ''}`}
              title={p ? displayName(p.name) : t('Empty', 'Vazio')}
            >
              {p ? <Sprite pokemon={p} size={52} /> : <span>{i + 1}</span>}
            </div>
          )
        })}
      </div>

      <div className="roll-header mb-4 flex flex-wrap items-end justify-between gap-4 narrow-layout:items-start [&_.type-badge]:[padding:4px_14px] [&_.type-badge]:text-[.9rem] [&_h2]:mt-1 [&_h2]:flex [&_h2]:items-center [&_h2]:gap-2 [&_h2]:text-[1.7rem]">
        <div className="roll-title [&_.reel:not(.spinning)]:overflow-visible">
          <HudTag as="div">
            {t('Catch', 'Captura')} {run.team.length + 1}/{TEAM_SIZE}
          </HudTag>
          <div className="flex min-h-11 flex-wrap items-center gap-2.5">
            <Reel
              items={regionNames}
              final={roll.region}
              audible={!spin.type}
              spinning={spin.region}
              duration={1500}
              onStop={reelStopped}
              hidden={hidden}
              render={(r) => {
                const reg = gameData.regions.find((x) => x.name === r)
                const name = reg ? regionLabel(reg) : displayName(r)
                const image = `/regions/${r}.webp`
                const tile = (
                  <span className="region-reel inline-flex min-w-51.5 items-center gap-[9px] rounded-[10px] border border-line bg-panel p-1 [&_img]:h-13.5 [&_img]:w-25 [&_img]:rounded-[6px] [&_img]:[object-fit:cover] [&_strong]:text-[1.03rem]">
                    <Image
                      src={image}
                      alt=""
                      width={108}
                      height={64}
                      unoptimized
                      loading="eager"
                    />
                    <strong>{name}</strong>
                  </span>
                )
                return stage === 'shown' && regions[r] ? (
                  <LoreCard
                    name={name}
                    entry={regions[r]}
                    portrait={image}
                    region
                  >
                    {tile}
                  </LoreCard>
                ) : (
                  tile
                )
              }}
            />
            <span className="text-muted">·</span>
            <Reel
              items={typeNames}
              final={roll.type}
              spinning={spin.type}
              duration={2100}
              onStop={reelStopped}
              hidden={hidden}
              render={(t) => <TypeBadge type={t} tip={false} />}
            />
          </div>
          {stage === 'ready' && (
            <p className="text-muted">
              {t(
                'Roll to draw a region and a type.',
                'Sorteie uma região e um tipo.',
              )}
            </p>
          )}
        </div>
        <div className="reroll-box text-right narrow-layout:text-left">
          <HudTag as="div" muted>
            {t(
              `${run.rerollsLeft} rerolls left`,
              `Tentativas restantes: ${run.rerollsLeft}`,
            )}
          </HudTag>
          <div className="flex flex-wrap gap-2">
            <Button
              className="silent"
              disabled={!canReroll}
              onClick={() => reroll('type')}
              title={t(
                'Keep the region, roll a new type',
                'Manter a região e sortear outro tipo',
              )}
            >
              ↻ {t('Type', 'Tipo')}
            </Button>
            <Button
              className="silent"
              disabled={!canReroll}
              onClick={() => reroll('region')}
              title={t(
                'Keep the type, roll a new region',
                'Manter o tipo e sortear outra região',
              )}
            >
              ↻ {t('Region', 'Região')}
            </Button>
            <Button
              className="silent"
              disabled={!canReroll}
              onClick={() => reroll('both')}
              title={t(
                'Roll a new region and type',
                'Sortear outra região e outro tipo',
              )}
            >
              ↻ {t('Both', 'Ambos')}
            </Button>
          </div>
        </div>
      </div>

      {stage !== 'shown' ? (
        <Card className="card-back grid min-h-105 place-content-center justify-items-center gap-5 [background:repeating-linear-gradient(45deg,#e4edff_0_12px,#fff_12px_24px)] [border:2px_solid_var(--line)] dark:[background:repeating-linear-gradient(45deg,var(--card2)_0_12px,var(--card)_12px_24px)] narrow-layout:min-h-47.5 narrow-layout:gap-3.5">
          <Image
            className={`roll-art narrow-layout:h-16 narrow-layout:w-16 [&.shuffling]:animate-shuffle motion-reduce:[&.shuffling]:[animation:none]! ${stage === 'spinning' ? 'shuffling' : ''}`}
            src="/pokeball.svg"
            alt=""
            width={90}
            height={90}
            unoptimized
            loading="eager"
          />
          {stage === 'ready' && (
            <Button
              tone="primary"
              size="custom"
              className="roll-btn silent gap-3 rounded-2xl px-8.5 py-4 text-[1.5rem] shadow-[0_12px_30px_#18244a38,0_0_0_6px_#ffcb0533] narrow-layout:[padding:14px_26px] narrow-layout:text-[1.25rem] [&:not(.rolling-label)_.dice]:animate-wiggle"
              autoFocus
              onClick={() => {
                sound.preload('catch')
                sound.preload('tick')
                sound.preload('reveal')
                sound.play('reroll')
                startSpin({ region: true, type: true })
              }}
            >
              <Dice rolling={false} /> {t('Roll', 'Sortear')}
            </Button>
          )}
          {stage === 'spinning' && (
            <div
              className="roll-btn rolling-label inline-flex items-center gap-3 rounded-2xl border border-line bg-panel-muted px-8.5 py-4 text-[1.5rem] font-bold text-ink shadow-[0_12px_30px_#18244a38,0_0_0_6px_#ffcb0533] narrow-layout:[padding:14px_26px] narrow-layout:text-[1.25rem] [&:not(.rolling-label)_.dice]:animate-wiggle"
              aria-live="polite"
            >
              <Dice rolling /> {t('Rolling…', 'Sorteando…')}
            </div>
          )}
        </Card>
      ) : (
        <DraftList roll={roll} onPick={catchPokemon} />
      )}
      {captured && (
        <CaptureDialog
          pokemon={captured}
          team={run.team}
          onComplete={() => {
            void Promise.resolve(onPick(captured.name)).then((accepted) => {
              if (accepted === false) setCaptured(null)
            })
          }}
        />
      )}
    </div>
  )
}
