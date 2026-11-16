import type { Metadata } from 'next'
import Link from 'next/link'
import { Localized } from '../../components/ui/Localized'
import { PublicPage } from '../PublicPage'
import { publicMetadata } from '../site'

export const metadata: Metadata = publicMetadata(
  'How to play',
  'Learn how to draft, reorder and battle with a team of Pokémon in Draftmon.',
  '/how-to-play',
)

export default function Page() {
  return (
    <PublicPage>
      <h1>
        <Localized en="How to play" pt="Como jogar" />
      </h1>
      <ol className="grid list-decimal gap-3 rounded-panel border-3 border-outline bg-panel p-8 shadow-[5px_5px_0_var(--outline)]">
        <li>
          <Localized
            en="Roll a region and type. Catch one Pokémon from the options and repeat until you have a team of six."
            pt="Sorteie uma região e um tipo. Capture um Pokémon da lista e repita até completar a equipe de seis."
          />
        </li>
        <li>
          <Localized
            en="Choose the order of your team before battle. The first Pokémon leads, and the rest enter in order."
            pt="Escolha a ordem da equipe antes do duelo. O primeiro Pokémon abre a batalha e os demais entram na ordem escolhida."
          />
        </li>
        <li>
          <Localized
            en="Follow the battle or jump to the result. A solo league ends after one loss or seven victories."
            pt="Acompanhe a batalha ou pule para o resultado. A liga solo termina após uma derrota ou sete vitórias."
          />
        </li>
        <li>
          <Localized
            en="To compete with friends, create a tournament and share its invitation link."
            pt="Para jogar com amigos, crie um torneio e compartilhe o link do convite."
          />
        </li>
      </ol>
      <Link href="/play" className="font-semibold text-brand">
        <Localized en="Start a run" pt="Iniciar uma campanha" />
      </Link>
    </PublicPage>
  )
}
