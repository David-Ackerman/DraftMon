/** One size and look for every control in the red header bar. */
export const headerControl =
  'silent inline-flex h-11 min-w-11 shrink-0 cursor-pointer items-center justify-center gap-2 rounded-xl border-3 border-outline bg-panel px-2.5 font-display text-base leading-none whitespace-nowrap text-ink shadow-[0_3px_0_var(--outline)] [transition:transform_.08s,box-shadow_.08s] enabled:active:translate-y-[2px] enabled:active:shadow-[0_1px_0_var(--outline)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ffcb05] aria-expanded:bg-panel-muted'

/** Square variant for icon-only header buttons. */
export const headerIcon = `${headerControl.replace(' px-2.5', '')} w-11`
