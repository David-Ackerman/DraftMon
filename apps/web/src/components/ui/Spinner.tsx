import Image from 'next/image'
import { cn } from './cn'

/**
 * A bouncing, spinning Poké Ball with a label for screen readers and sighted
 * players. Use it only where content is actually waiting on code or data.
 */
export function Spinner({
  label,
  size = 'medium',
  className = '',
}: {
  label: string
  size?: 'small' | 'medium' | 'large'
  className?: string
}) {
  const px = { small: 28, medium: 48, large: 72 }[size]
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        'grid justify-items-center gap-3 py-6 text-center font-display text-muted',
        size === 'small' && 'flex items-center gap-2.5 py-2',
        className,
      )}
    >
      <span className="motion-safe:animate-spinner-hop">
        <Image
          src="/pokeball.svg"
          width={px}
          height={px}
          alt=""
          priority
          className="drop-shadow-[0_3px_0_var(--outline)] motion-safe:animate-spinner-roll"
        />
      </span>
      <span className={size === 'large' ? 'text-[1.3rem]' : 'text-base'}>
        {label}
      </span>
    </div>
  )
}
