import { useState } from 'react'

export function useBattleOrder(team: string[]) {
  const [order, setOrder] = useState(team)

  function move(from: number, to: number) {
    if (from === to || to < 0 || to >= order.length) return
    const next = [...order]
    const [pokemon] = next.splice(from, 1)
    next.splice(to, 0, pokemon)
    setOrder(next)
  }

  return { order, move }
}
