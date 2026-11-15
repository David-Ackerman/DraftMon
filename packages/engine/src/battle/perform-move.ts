import type { ApiMove } from '@draftmon/content'
import { moveLabel } from '../pokemon'
import { isDamaging } from './move-rules'
import { resolveMoveEffects } from './move-effects'
import type { BattleContext, BattleEvent, Side } from './types'

export function performMove(
  context: BattleContext,
  side: Side,
  move: ApiMove,
): BattleEvent[] {
  const name = context.current(side).name
  const event: BattleEvent = {
    kind: 'move',
    side,
    slot: context.active[side],
    move: move.name,
    moveType: move.type.name,
    attacking: isDamaging(move),
    text: `${name} used ${moveLabel(move.name)}`,
    pt: `${name} usou ${moveLabel(move.name, 'pt-BR', context.moveTranslations)}!`,
  }
  if (move.accuracy !== null && context.rng() * 100 >= move.accuracy) {
    return [
      event,
      {
        kind: 'miss',
        side,
        text: `${name} missed!`,
        pt: `${name} errou o golpe!`,
      },
    ]
  }
  return [event, ...resolveMoveEffects(context, side, move)]
}
