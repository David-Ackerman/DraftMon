import Image from 'next/image'
import Link from 'next/link'
import { Localized } from '../ui/Localized'

const links = [
  { href: '/how-to-play', en: 'How to play', pt: 'Como jogar' },
  { href: '/pokedex', en: 'Pokédex', pt: 'Pokédex' },
  { href: '/about', en: 'About & contact', pt: 'Sobre e contato' },
  { href: '/privacy', en: 'Privacy policy', pt: 'Política de privacidade' },
]

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t-[6px] border-header bg-[#14204a] text-[#dfe6fb]">
      <div className="mx-auto grid max-w-[1480px] gap-3 px-4 py-5 text-[.82rem] leading-normal font-bold">
        <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2">
          <span className="inline-flex items-center gap-2">
            <Image src="/pokeball.svg" width={24} height={24} alt="" />
            <span className="wordmark text-[1.3rem] [-webkit-text-stroke-width:5px]">
              Draftmon
            </span>
          </span>
          <nav
            aria-label="Footer"
            className="flex flex-wrap gap-x-5 gap-y-1 text-[.9rem]"
          >
            {links.map(({ href, en, pt }) => (
              <Link
                key={href}
                href={href}
                className="text-[#dfe6fb] underline-offset-3 hover:text-[#ffcb05] hover:underline"
              >
                <Localized en={en} pt={pt} />
              </Link>
            ))}
          </nav>
        </div>
        <p className="m-0 max-w-[820px]">
          <Localized
            en="Draftmon is an independent fan project with no official affiliation. Pokémon, its characters and franchise materials belong to their respective rights holders."
            pt="Draftmon é um projeto de fã independente, sem afiliação oficial. Pokémon, seus personagens e os materiais da franquia pertencem aos respectivos titulares."
          />
        </p>
      </div>
    </footer>
  )
}
