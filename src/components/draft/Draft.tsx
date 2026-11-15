import { HudTag } from '../ui/HudTag'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'
import { useEffect, useMemo, useRef, useState } from 'react'
import { displayName, gameData, regionLabel } from '../../engine/data'
import type { ApiPokemon } from '../../engine/data'
import type { RerollMode, Roll } from '../../engine/game'
import { TEAM_SIZE } from '../../engine/game'
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
  const canReroll = stage === 'shown' && !captured && !submitting && run.rerollsLeft > 0

  useEffect(() => {
    for (const region of regionNames) {
      const artwork = new Image()
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
      if (await onReroll(mode) !== false) startSpin({ region: mode !== 'type', type: mode !== 'region' })
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
      <div className="flex gap-2 mt-2 mx-0 mb-4.5 flex-wrap">
        {Array.from({ length: TEAM_SIZE }, (_, i) => {
          const p = run.team[i] ? gameData.pokemonByName.get(run.team[i]) : undefined
          return (
            <div key={i} className={`slot w-16 h-16 rounded-xl border-2 border-dashed border-line grid place-items-center text-muted font-bold ${p ? 'filled' : ''} ${i === run.team.length ? 'next' : ''}`} title={p ? displayName(p.name) : t('Empty', 'Vazio')}>
              {p ? <Sprite pokemon={p} size={52} /> : <span>{i + 1}</span>}
            </div>
          )
        })}
      </div>

      <div className="roll-header flex justify-between items-end gap-4 flex-wrap mb-4">
        <div className="roll-title">
          <HudTag as="div">
            {t('Catch', 'Captura')} {run.team.length + 1}/{TEAM_SIZE}
          </HudTag>
          <div className="flex items-center gap-2.5 flex-wrap min-h-11">
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
                const tile = <span className="region-reel inline-flex items-center gap-[9px] min-w-51.5 p-1 bg-panel border border-line rounded-[10px]">
                  <img src={image} alt="" width={108} height={64} />
                  <strong>{name}</strong>
                </span>
                return stage === 'shown' && regions[r] ? <LoreCard name={name} entry={regions[r]} portrait={image} region>{tile}</LoreCard> : tile
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
          {stage === 'ready' && <p className="text-muted">{t('Roll to draw a region and a type.', 'Sorteie uma região e um tipo.')}</p>}
        </div>
        <div className="reroll-box text-right">
          <HudTag as="div" muted>
            {t(`${run.rerollsLeft} rerolls left`, `Tentativas restantes: ${run.rerollsLeft}`)}
          </HudTag>
          <div className="flex gap-2 flex-wrap">
            <Button className="silent" disabled={!canReroll} onClick={() => reroll('type')} title={t('Keep the region, roll a new type', 'Manter a região e sortear outro tipo')}>
              ↻ {t('Type', 'Tipo')}
            </Button>
            <Button className="silent" disabled={!canReroll} onClick={() => reroll('region')} title={t('Keep the type, roll a new region', 'Manter o tipo e sortear outra região')}>
              ↻ {t('Region', 'Região')}
            </Button>
            <Button className="silent" disabled={!canReroll} onClick={() => reroll('both')} title={t('Roll a new region and type', 'Sortear outra região e outro tipo')}>
              ↻ {t('Both', 'Ambos')}
            </Button>
          </div>
        </div>
      </div>

      {stage !== 'shown' ? (
        <Card className="card-back">
          <img className={`roll-art ${stage === 'spinning' ? 'shuffling' : ''}`} src="/pokeball.svg" alt="" width={90} height={90} />
          {stage === 'ready' && (
            <Button
              tone="primary" size="custom" className="roll-btn text-[1.5rem] py-4 px-8.5 rounded-2xl gap-3 shadow-[0_12px_30px_#18244a38,0_0_0_6px_#ffcb0533] silent"
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
            <div className="roll-btn text-[1.5rem] py-4 px-8.5 rounded-2xl gap-3 shadow-[0_12px_30px_#18244a38,0_0_0_6px_#ffcb0533] rolling-label inline-flex items-center bg-panel-muted border border-line text-ink font-bold" aria-live="polite">
              <Dice rolling /> {t('Rolling…', 'Sorteando…')}
            </div>
          )}
        </Card>
      ) : (
        <DraftList roll={roll} onPick={catchPokemon} />
      )}
      {captured && <CaptureDialog pokemon={captured} team={run.team} onComplete={() => {
        void Promise.resolve(onPick(captured.name)).then((accepted) => {
          if (accepted === false) setCaptured(null)
        })
      }} />}
    </div>
  )
}
