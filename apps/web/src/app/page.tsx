import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { PublicPage } from './PublicPage'
import { publicMetadata } from './site'
import Image from 'next/image'
import { Showcase } from '../components/pokemon/Showcase'
import { Localized } from '../components/ui/Localized'
import { gameData } from '@draftmon/content'
import {
  LEAGUE_MATCHES,
  OPTIONS_PER_ROLL,
  REROLLS_PER_RUN,
  TEAM_SIZE,
} from '@draftmon/engine'

const modes = [
  {
    href: '/play',
    en: 'Solo league',
    pt: 'Liga solo',
    enText: `Draft ${TEAM_SIZE} Pokémon and try to beat all ${LEAGUE_MATCHES} league opponents without a single loss.`,
    ptText: `Capture ${TEAM_SIZE} Pokémon e tente vencer os ${LEAGUE_MATCHES} adversários da liga sem nenhuma derrota.`,
  },
  {
    href: '/play',
    en: 'Daily challenge',
    pt: 'Desafio diário',
    enText:
      'Everyone gets the same rolls today. Compare your best run with friends.',
    ptText:
      'Todos recebem os mesmos sorteios hoje. Compare sua melhor campanha com os amigos.',
  },
  {
    href: '/lobby',
    en: 'Tournaments',
    pt: 'Torneios',
    enText:
      'Create a room, share the link and draft in secret against friends or bots.',
    ptText:
      'Crie uma sala, compartilhe o link e capture em segredo contra amigos ou bots.',
  },
]

export const metadata: Metadata = publicMetadata(
  'Draftmon',
  'Draft six Pokémon and battle in a solo league or a tournament with friends.',
  '/',
)

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ room?: string }>
}) {
  const { room } = await searchParams
  if (typeof room === 'string' && /^[a-f0-9]{8}$/i.test(room))
    redirect('/lobby/' + room.toUpperCase())
  return (
    <PublicPage>
      <section className="flex flex-wrap gap-6 rounded-[24px] border-3 border-outline bg-panel p-8 shadow-[6px_6px_0_var(--outline)] phone:p-5">
        <div className="flex min-w-0 flex-[999_1_420px] flex-col items-start gap-4">
          <h1 className="m-0">
            <Localized
              en="Build your Pokémon team."
              pt="Monte sua equipe Pokémon."
            />
          </h1>
          <p className="m-0 max-w-lg text-lg font-bold text-muted">
            <Localized
              en="Catch six Pokémon by region and type, choose your battle order, and take on the league."
              pt="Capture seis Pokémon por região e tipo, escolha a ordem da equipe e enfrente a liga."
            />
          </p>
          <Link
            href="/play"
            className="inline-flex min-h-14 items-center gap-2.5 rounded-2xl border-3 border-outline bg-accent px-7 py-3 font-display text-[1.3rem] text-accent-ink no-underline shadow-[0_5px_0_var(--outline)] hover:bg-[#ffd84a]"
          >
            <Image src="/pokeball.svg" width={26} height={26} alt="" />
            <Localized en="Play Draftmon" pt="Jogar Draftmon" />
          </Link>
        </div>
        <Showcase className="flex-[1_1_300px]" />
      </section>

      <section className="mt-6 grid grid-cols-[repeat(auto-fit,minmax(min(100%,280px),1fr))] gap-5">
        {modes.map(({ en, pt, enText, ptText, href }) => (
          <Link
            key={en}
            href={href}
            className="grid content-start gap-2 rounded-panel border-3 border-outline bg-panel p-5 text-ink no-underline shadow-[5px_5px_0_var(--outline)] hover:bg-panel-muted"
          >
            <h2 className="m-0 flex items-center gap-2">
              <Image src="/pokeball.svg" width={24} height={24} alt="" />
              <Localized en={en} pt={pt} />
            </h2>
            <p className="m-0 font-bold text-muted">
              <Localized en={enText} pt={ptText} />
            </p>
          </Link>
        ))}
      </section>

      <section className="mt-6 grid gap-3 rounded-panel border-3 border-outline bg-panel p-8 shadow-[5px_5px_0_var(--outline)] phone:p-5">
        <h2 className="m-0">
          <Localized en="What is Draftmon?" pt="O que é o Draftmon?" />
        </h2>
        <p className="m-0 font-bold">
          <Localized
            en={`Draftmon turns team building into a draft. Every roll draws a region and a type and offers ${OPTIONS_PER_ROLL} Pokémon from that region's Pokédex. You catch one per roll, use up to ${REROLLS_PER_RUN} rerolls when nothing fits, and stop at ${TEAM_SIZE}. Then your team faces ${LEAGUE_MATCHES} league opponents in automatic battles, and a single loss ends the run.`}
            pt={`O Draftmon transforma a montagem de equipe em um draft. Cada sorteio traz uma região e um tipo e oferece ${OPTIONS_PER_ROLL} Pokémon da Pokédex daquela região. Você captura um por sorteio, usa até ${REROLLS_PER_RUN} tentativas extras quando nada serve e para em ${TEAM_SIZE}. Depois sua equipe enfrenta ${LEAGUE_MATCHES} adversários da liga em batalhas automáticas, e uma única derrota encerra a campanha.`}
          />
        </p>
        <p className="m-0 font-bold text-muted">
          <Localized
            en={`It covers ${gameData.pokemon.length} Pokémon across ${gameData.regions.length} regional Pokédexes. Battles use real base stats, types, abilities and movesets, so type matchups and battle order decide most games.`}
            pt={`São ${gameData.pokemon.length} Pokémon de ${gameData.regions.length} Pokédex regionais. As batalhas usam atributos base, tipos, habilidades e golpes reais, então confrontos de tipo e ordem de batalha decidem a maioria das partidas.`}
          />
        </p>
        <p className="m-0 flex flex-wrap gap-x-5 gap-y-1 font-extrabold [&_a]:text-brand [&_a]:underline [&_a]:underline-offset-3">
          <Link href="/how-to-play">
            <Localized en="Rules and strategy" pt="Regras e estratégia" />
          </Link>
          <Link href="/pokedex">
            <Localized en="Browse the Pokédex" pt="Ver a Pokédex" />
          </Link>
          <Link href="/about">
            <Localized en="About the project" pt="Sobre o projeto" />
          </Link>
        </p>
      </section>
    </PublicPage>
  )
}
