import { useLanguage } from '../../services/language'
import { Button } from '../ui/Button'

export function LineupControls({ index, length, busy = false, move, className = '' }: {
  index: number
  length: number
  busy?: boolean
  move: (from: number, to: number) => void
  className?: string
}) {
  const { t } = useLanguage()
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <Button icon aria-label={t('Move up', 'Mover para cima')} disabled={busy || index === 0} onClick={() => move(index, index - 1)}>▲</Button>
      <Button icon aria-label={t('Move down', 'Mover para baixo')} disabled={busy || index === length - 1} onClick={() => move(index, index + 1)}>▼</Button>
    </div>
  )
}
