import Image from 'next/image'
import { Localized } from '../ui/Localized'

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t-[6px] border-header bg-[#14204a] text-[#dfe6fb]">
      <div className="mx-auto flex max-w-[1480px] flex-wrap items-center justify-between gap-x-6 gap-y-2 px-4 py-5 text-[.82rem] leading-normal font-bold">
        <span className="inline-flex items-center gap-2">
          <Image src="/pokeball.svg" width={24} height={24} alt="" />
          <span className="wordmark text-[1.3rem] [-webkit-text-stroke-width:5px]">
            Draftmon
          </span>
        </span>
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
