'use client'

import dynamic from 'next/dynamic'
import Link from 'next/link'
import { useState } from 'react'
import type { MouseEvent, ReactNode } from 'react'
import { Spinner } from '../ui/Spinner'
import { useLanguage } from '../../services/language'
import { DetailsDialog } from '../ui/DetailsDialog'

const CatalogCard = dynamic(
  () => import('./CreatureCard').then((module) => module.CatalogCreatureCard),
  { ssr: false, loading: LoadingCard },
)

function LoadingCard() {
  const { t } = useLanguage()
  return (
    <Spinner
      size="small"
      label={t('Loading Pokémon…', 'Carregando Pokémon…')}
    />
  )
}

export function RegionPokemonGrid({ children }: { children: ReactNode }) {
  const { t } = useLanguage()
  const [details, setDetails] = useState<{
    name: string
    title: string
    href: string
  } | null>(null)

  function openDetails(event: MouseEvent<HTMLUListElement>) {
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.altKey ||
      event.shiftKey ||
      !window.matchMedia('(max-width: 760px), (hover: none)').matches
    )
      return
    const link = (event.target as Element).closest<HTMLAnchorElement>(
      'a[data-pokemon]',
    )
    if (!link?.dataset.pokemon) return
    event.preventDefault()
    setDetails({
      name: link.dataset.pokemon,
      title: link.textContent?.trim() || link.dataset.pokemon,
      href: link.getAttribute('href')!,
    })
  }

  return (
    <>
      <ul
        className="grid list-none grid-cols-[repeat(auto-fill,minmax(120px,1fr))] gap-2 p-0 compact-interaction:grid-cols-[repeat(auto-fill,minmax(min(96px,100%),1fr))]"
        onClickCapture={openDetails}
      >
        {children}
      </ul>
      {details && (
        <DetailsDialog title={details.title} onDismiss={() => setDetails(null)}>
          <CatalogCard name={details.name} />
          <Link
            className="rounded-lg border-2 border-outline px-3 py-2.5 text-center font-semibold text-brand"
            href={details.href}
            onClick={() => setDetails(null)}
          >
            {t('Open Pokédex entry', 'Abrir página na Pokédex')}
          </Link>
        </DetailsDialog>
      )}
    </>
  )
}
