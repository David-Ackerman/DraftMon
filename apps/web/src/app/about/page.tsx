import type { Metadata } from 'next'
import Link from 'next/link'
import {
  LEAGUE_MATCHES,
  OPTIONS_PER_ROLL,
  REROLLS_PER_RUN,
  TEAM_SIZE,
} from '@draftmon/engine'
import { gameData } from '@draftmon/content'
import { ByLanguage } from '../../components/ui/ByLanguage'
import { Prose } from '../../components/ui/Prose'
import { PublicPage } from '../PublicPage'
import { publicMetadata } from '../site'

export const metadata: Metadata = publicMetadata(
  'About and contact',
  'Who makes Draftmon, how the game works, where the data comes from and how to get in touch.',
  '/about',
)

const REPO = 'https://github.com/David-Ackerman/DraftMon'
const POKEAPI = 'https://pokeapi.co'
const species = gameData.pokemon.length
const regions = gameData.regions.length

const english = (
  <Prose>
    <h1>About Draftmon</h1>
    <p>
      Draftmon is a free browser game about building a Pokémon team under
      pressure. Instead of picking your favorites, you roll a region and a type,
      choose one of {OPTIONS_PER_ROLL} options, and repeat until you have{' '}
      {TEAM_SIZE}. Then your team faces a {LEAGUE_MATCHES}-match league of Gym
      Leaders, Elite Four members and Champions, where a single loss ends the
      run.
    </p>
    <p>
      The game covers {species} Pokémon across {regions} regional Pokédexes.
      Battles are simulated automatically from base stats, types, abilities and
      moves, so the decisions that matter are the ones you make while drafting
      and ordering your team.
    </p>

    <h2>Ways to play</h2>
    <ul>
      <li>
        <strong>Solo league:</strong> draft with {REROLLS_PER_RUN} rerolls and
        try for a perfect {LEAGUE_MATCHES}–0 run.
      </li>
      <li>
        <strong>Daily challenge:</strong> everyone gets the same rolls for the
        day, so you can compare results with friends.
      </li>
      <li>
        <strong>Tournaments:</strong> create a room, share the invite link and
        draft privately against friends or bots, with an optional group stage
        followed by knockout rounds.
      </li>
      <li>
        <strong>Pokédex:</strong> browse every Pokémon with its types, base
        stats, matchups and the moveset it uses in battle.
      </li>
    </ul>
    <p>
      New here? Read <Link href="/how-to-play">How to play</Link> or{' '}
      <Link href="/play">start a run</Link>.
    </p>

    <h2>Who makes it</h2>
    <p>
      Draftmon is an independent fan project built and maintained by one
      developer. The source code is open on <a href={REPO}>GitHub</a>. Ads on
      the site help pay for hosting.
    </p>

    <h2>Data and credits</h2>
    <p>
      Pokémon data such as stats, types, moves and Pokédex entries comes from{' '}
      <a href={POKEAPI}>PokéAPI</a>. Draftmon is not affiliated with, endorsed
      or sponsored by Nintendo, Game Freak, Creatures or The Pokémon Company.
      Pokémon, its characters and franchise materials belong to their respective
      rights holders.
    </p>

    <h2>Contact</h2>
    <ul>
      <li>
        Found a bug? Use the round <strong>!</strong> button in the game to send
        a report with an optional screenshot.
      </li>
      <li>
        For questions, ideas, rights-holder requests or data deletion, open an
        issue at{' '}
        <a href={`${REPO}/issues`}>github.com/David-Ackerman/DraftMon</a>.
      </li>
    </ul>
    <p>
      Read our <Link href="/privacy">privacy policy</Link> to see what data the
      site keeps.
    </p>
  </Prose>
)

const portuguese = (
  <Prose>
    <h1>Sobre o Draftmon</h1>
    <p>
      O Draftmon é um jogo gratuito de navegador sobre montar uma equipe Pokémon
      sob pressão. Em vez de escolher seus favoritos, você sorteia uma região e
      um tipo, escolhe uma entre {OPTIONS_PER_ROLL} opções e repete até ter{' '}
      {TEAM_SIZE}. Depois, sua equipe enfrenta uma liga de {LEAGUE_MATCHES}{' '}
      partidas contra Líderes de Ginásio, a Elite dos Quatro e Campeões, e uma
      única derrota encerra a campanha.
    </p>
    <p>
      O jogo reúne {species} Pokémon de {regions} Pokédex regionais. As batalhas
      são simuladas automaticamente a partir dos atributos base, tipos,
      habilidades e golpes, então as decisões que importam são as que você toma
      ao capturar e ordenar a equipe.
    </p>

    <h2>Modos de jogo</h2>
    <ul>
      <li>
        <strong>Liga solo:</strong> capture com {REROLLS_PER_RUN} tentativas
        extras e busque uma campanha perfeita de {LEAGUE_MATCHES}–0.
      </li>
      <li>
        <strong>Desafio diário:</strong> todos recebem os mesmos sorteios do
        dia, para comparar resultados com os amigos.
      </li>
      <li>
        <strong>Torneios:</strong> crie uma sala, compartilhe o link e faça a
        captura em segredo contra amigos ou bots, com fase de grupos opcional e
        mata-mata.
      </li>
      <li>
        <strong>Pokédex:</strong> veja cada Pokémon com tipos, atributos base,
        confrontos e os golpes que ele usa em batalha.
      </li>
    </ul>
    <p>
      Chegou agora? Leia <Link href="/how-to-play">Como jogar</Link> ou{' '}
      <Link href="/play">comece uma campanha</Link>.
    </p>

    <h2>Quem faz</h2>
    <p>
      O Draftmon é um projeto de fã independente, criado e mantido por um
      desenvolvedor. O código é aberto no <a href={REPO}>GitHub</a>. Os anúncios
      do site ajudam a pagar a hospedagem.
    </p>

    <h2>Dados e créditos</h2>
    <p>
      Os dados dos Pokémon, como atributos, tipos, golpes e entradas da Pokédex,
      vêm da <a href={POKEAPI}>PokéAPI</a>. O Draftmon não tem afiliação,
      endosso ou patrocínio da Nintendo, Game Freak, Creatures ou The Pokémon
      Company. Pokémon, seus personagens e os materiais da franquia pertencem
      aos respectivos titulares.
    </p>

    <h2>Contato</h2>
    <ul>
      <li>
        Encontrou um problema? Use o botão redondo <strong>!</strong> no jogo
        para enviar um relato com captura de tela opcional.
      </li>
      <li>
        Para dúvidas, ideias, pedidos de titulares de direitos ou exclusão de
        dados, abra uma issue em{' '}
        <a href={`${REPO}/issues`}>github.com/David-Ackerman/DraftMon</a>.
      </li>
    </ul>
    <p>
      Leia nossa <Link href="/privacy">política de privacidade</Link> para ver
      quais dados o site guarda.
    </p>
  </Prose>
)

export default function Page() {
  return (
    <PublicPage>
      <ByLanguage en={english} pt={portuguese} />
    </PublicPage>
  )
}
