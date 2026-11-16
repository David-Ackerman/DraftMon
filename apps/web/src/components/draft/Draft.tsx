import Image from 'next/image'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'
import { useEffect, useMemo, useRef, useState } from 'react'
import { gameData } from '@draftmon/content'
import { displayName, regionLabel } from '@draftmon/engine'
import type { ApiPokemon } from '@draftmon/content'
import type { RerollMode, Roll } from '@draftmon/engine'
import { TEAM_SIZE } from '@draftmon/engine'
import { TypeBadge } from '../pokemon/TypeBadge'
import { LoreCard } from '../pokemon/LoreCard'
import { regions } from '../pokemon/lore'
import { CaptureDialog } from './CaptureDialog'
import { PartySlots } from '../pokemon/PartySlots'
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
      <Card
        as="section"
        className="mb-5 flex flex-wrap items-center gap-x-5 gap-y-3 py-3.5"
        aria-label={t('Your party', 'Sua equipe')}
      >
        <div className="grid gap-0.5">
          <span className="font-display text-[1.35rem] leading-none">
            {t('Your party', 'Sua equipe')}
          </span>
          <span className="font-pixel text-[.62rem] text-muted">
            {run.team.length}/{TEAM_SIZE}
          </span>
        </div>
        <PartySlots
          team={run.team}
          markNext
          size="small"
          label={t('Your party', 'Sua equipe')}
          className="w-full max-w-[420px] min-w-[260px] flex-1"
        />
      </Card>

      <Card
        as="section"
        className="roll-header mb-5 flex flex-wrap items-end justify-between gap-4 narrow-layout:items-start [&_.type-badge]:[padding:4px_14px] [&_.type-badge]:text-[.9rem]"
      >
        <div className="roll-title grid gap-2 [&_.reel:not(.spinning)]:overflow-visible">
          <span className="inline-flex items-center gap-2 justify-self-start rounded-full border-2 border-outline bg-accent px-3 py-1 text-[.8rem] font-black text-accent-ink uppercase">
            <Image src="/pokeball.svg" width={18} height={18} alt="" />
            {t('Catch', 'Captura')} {run.team.length + 1}/{TEAM_SIZE}
          </span>
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
                  <span className="region-reel inline-flex min-w-51.5 items-center gap-2.5 rounded-xl border-3 border-outline bg-panel-muted p-1 pr-3 shadow-[0_3px_0_var(--outline)] [&_img]:h-13.5 [&_img]:w-25 [&_img]:rounded-lg [&_img]:[object-fit:cover] [&_strong]:font-display [&_strong]:text-[1.2rem] [&_strong]:font-normal">
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
            <p className="m-0 font-bold text-muted">
              {t(
                'Roll to draw a region and a type.',
                'Sorteie uma região e um tipo.',
              )}
            </p>
          )}
        </div>
        <div className="reroll-box grid justify-items-end gap-2 narrow-layout:justify-items-start">
          <span className="inline-flex items-center gap-2 rounded-xl bg-[#14204a] px-3 py-1.5 text-[.7rem] font-black text-[#dfe6fb] uppercase shadow-[inset_0_0_0_2px_#ffcb05]">
            {t('Rerolls', 'Tentativas')}
            <span className="font-pixel text-[.85rem] text-[#ffcb05]">
              {run.rerollsLeft}
            </span>
          </span>
          <div className="flex flex-wrap gap-2">
            <Button
              tone="secondary"
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
              tone="secondary"
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
              tone="secondary"
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
      </Card>

      {stage !== 'shown' ? (
        <Card className="card-back grid min-h-105 place-content-center justify-items-center gap-5 bg-[#dff3d2] bg-[url('/pokeball-pattern.svg')] bg-size-[200px] dark:bg-[#1f3a2c] narrow-layout:min-h-47.5 narrow-layout:gap-3.5">
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
              className="roll-btn silent gap-3 rounded-2xl px-9 py-4 text-[1.7rem] shadow-[0_6px_0_var(--outline)] narrow-layout:[padding:14px_26px] narrow-layout:text-[1.3rem] [&:not(.rolling-label)_.dice]:animate-wiggle"
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
              className="roll-btn rolling-label inline-flex items-center gap-3 rounded-2xl border-3 border-outline bg-panel px-9 py-4 font-display text-[1.7rem] text-ink shadow-[0_6px_0_var(--outline)] narrow-layout:[padding:14px_26px] narrow-layout:text-[1.3rem] [&:not(.rolling-label)_.dice]:animate-wiggle"
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
