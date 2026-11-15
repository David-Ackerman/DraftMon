import { expect, test } from 'vitest'
import { applyEndOfTurnDamage, applyStatus, checkCanAct } from './effects'
import { givenBattle } from './testing/battle'

test('sleep prevents an action and returns localized status events', () => {
  const context = givenBattle().context()
  expect(applyStatus(context, 0, 'sleep')).toMatchObject([
    { kind: 'status', status: 'sleep', pt: 'Pikachu adormeceu!' },
  ])
  expect(checkCanAct(context, 0)).toMatchObject({
    canAct: false,
    events: [{ kind: 'info' }],
  })
  expect(checkCanAct(context, 0)).toMatchObject({
    canAct: true,
    events: [{ kind: 'status', status: null }],
  })
})

test('damage from poison reports a knockout only once', () => {
  const context = givenBattle().context()
  applyStatus(context, 0, 'poison')
  context.current(0).hp = 1
  expect(applyEndOfTurnDamage(context, 0)).toMatchObject([
    { kind: 'damage', source: 'poison', amount: 1 },
    { kind: 'faint' },
  ])
  expect(applyEndOfTurnDamage(context, 0)).toEqual([])
})
