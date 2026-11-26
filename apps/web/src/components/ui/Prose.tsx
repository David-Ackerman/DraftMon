import type { ReactNode } from 'react'

/** Outlined game panel for long-form text pages (policies, guides). */
export function Prose({ children }: { children: ReactNode }) {
  return (
    <article className="grid max-w-[820px] gap-1 rounded-panel border-3 border-outline bg-panel p-8 leading-relaxed shadow-[5px_5px_0_var(--outline)] phone:p-5 [&_a]:font-extrabold [&_a]:text-brand [&_a]:underline [&_a]:underline-offset-3 [&_h2]:mt-5 [&_h2]:mb-1 [&_h3]:mt-3 [&_h3]:mb-1 [&_li]:my-1 [&_p]:my-1.5 [&_ul]:my-1.5 [&_ul]:list-disc [&_ul]:pl-5">
      {children}
    </article>
  )
}
