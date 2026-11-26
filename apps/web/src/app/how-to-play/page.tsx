import type { Metadata } from 'next'
import Link from 'next/link'
import { gameData } from '@draftmon/content'
import {
  LEAGUE_MATCHES,
  OPTIONS_PER_ROLL,
  REROLLS_PER_RUN,
  TEAM_SIZE,
  buildTypeChart,
} from '@draftmon/engine'
import { TypeTag } from '../../components/pokemon/TypeTag'
import { ByLanguage } from '../../components/ui/ByLanguage'
import { Prose } from '../../components/ui/Prose'
import { PublicPage } from '../PublicPage'
import { publicMetadata } from '../site'

export const metadata: Metadata = publicMetadata(
  'How to play',
  'Learn how to draft, reroll, order your team and win battles in Draftmon, with strategy tips, a type chart and answers to common questions.',
  '/how-to-play',
)

const chart = buildTypeChart(gameData.types)
const typeNames = gameData.types.map(({ name }) => name)
const matchups = typeNames.map((type) => ({
  type,
  strong: typeNames.filter((other) => chart.get(type)?.get(other) === 2),
  weakTo: typeNames.filter((other) => chart.get(other)?.get(type) === 2),
}))

function Tags({ types }: { types: string[] }) {
  return types.length ? (
    <span className="flex flex-wrap gap-1">
      {types.map((type) => (
        <TypeTag key={type} type={type} />
      ))}
    </span>
  ) : (
    <span className="text-muted">—</span>
  )
}

function TypeChartTable({
  labels,
}: {
  labels: { type: string; strong: string; weak: string }
}) {
  return (
    <div className="overflow-x-auto rounded-2xl border-2 border-outline">
      <table className="w-full min-w-[560px] border-collapse text-left text-[.9rem]">
        <thead className="bg-panel-muted">
          <tr>
            <th className="p-2.5">{labels.type}</th>
            <th className="p-2.5">{labels.strong}</th>
            <th className="p-2.5">{labels.weak}</th>
          </tr>
        </thead>
        <tbody>
          {matchups.map(({ type, strong, weakTo }) => (
            <tr key={type} className="border-t-2 border-line">
              <td className="p-2.5">
                <TypeTag type={type} />
              </td>
              <td className="p-2.5">
                <Tags types={strong} />
              </td>
              <td className="p-2.5">
                <Tags types={weakTo} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

const english = (
  <Prose>
    <h1>How to play Draftmon</h1>
    <p>
      Draftmon is a draft-and-battle game. You build a team of {TEAM_SIZE}{' '}
      Pokémon from random rolls, set the order they fight in, and take on a{' '}
      {LEAGUE_MATCHES}-match league. One loss ends the run, so every pick
      counts.
    </p>

    <h2>1. Roll a region and a type</h2>
    <p>
      Each roll draws one region and one type, then shows {OPTIONS_PER_ROLL}{' '}
      Pokémon that live in that region&apos;s Pokédex and have that type. If
      there aren&apos;t enough matches, the list is topped up with{' '}
      <strong>wildcards</strong>: Normal-type Pokémon from any region. A single
      roll never offers more than one Legendary or Mythical Pokémon.
    </p>

    <h2>2. Catch one, or reroll</h2>
    <p>
      Pick one Pokémon to catch and the next roll starts. You have{' '}
      {REROLLS_PER_RUN} rerolls for the whole run. Each one can change only the
      type, only the region, or both, so use them when a roll offers nothing
      that fits your team.
    </p>

    <h2>3. Set your battle order</h2>
    <p>
      Before every match you can reorder your team. Your first Pokémon leads;
      when it faints, the next one comes in. You can see your opponent&apos;s
      team first, so lead with something that hits their opener hard.
    </p>

    <h2>4. Battle</h2>
    <p>
      Battles play out automatically. Each Pokémon uses its own moveset, chosen
      from what it can learn. The faster Pokémon usually moves first, priority
      moves skip the line, and paralysis halves Speed. Watch the battle turn by
      turn or skip to the result.
    </p>

    <h2>5. Clear the league</h2>
    <p>
      The solo league has {LEAGUE_MATCHES} matches against Gym Leaders, Elite
      Four members and Champions, ending with a Champion. Win all{' '}
      {LEAGUE_MATCHES} for a perfect run. The <strong>daily challenge</strong>{' '}
      gives everyone the same rolls each day, so you can compare results.
    </p>

    <h2>Strategy tips</h2>
    <ul>
      <li>
        <strong>Cover your weaknesses.</strong> Three Pokémon that are all weak
        to the same type can be swept by one opponent. Mix types as you draft.
      </li>
      <li>
        <strong>Same-type attacks hit harder.</strong> A move that matches its
        user&apos;s type deals 1.5× damage, so a Fire-type using a Fire move is
        stronger than a Water-type using one.
      </li>
      <li>
        <strong>Dual types multiply.</strong> An attack that is super effective
        against both of a Pokémon&apos;s types deals 4× damage. One that is
        resisted twice deals only ¼.
      </li>
      <li>
        <strong>Speed decides trades.</strong> When two Pokémon can knock each
        other out, the faster one usually wins. Fast attackers make great leads.
      </li>
      <li>
        <strong>Save rerolls.</strong> Early rolls are easy to fill. Rerolls are
        worth more on your last two picks, when you know what you need.
      </li>
      <li>
        <strong>Don&apos;t chase totals.</strong> A Pokémon with lower
        &quot;Overall&quot; but the right type often beats a stronger one that
        is weak to your next opponent.
      </li>
    </ul>

    <h2>Type chart</h2>
    <p>
      An attack deals 2× damage to a type it is strong against and ½ damage to a
      type that resists it. Some types are immune: for example, Normal and
      Fighting moves don&apos;t affect Ghosts.
    </p>
    <TypeChartTable
      labels={{
        type: 'Type',
        strong: 'Strong against',
        weak: 'Weak to',
      }}
    />

    <h2>Tournaments with friends</h2>
    <p>
      Open <Link href="/lobby">Tournaments</Link>, create a room and share the
      invite link. Everyone drafts privately at the same time. Bots can fill
      empty seats. Rooms can start with a group stage before the knockout
      rounds, and each stage has a time limit. When a deadline passes, missing
      picks and lineups are filled in automatically. After the draft you can see
      every trainer&apos;s team, and finished matches can be watched as replays.
    </p>

    <h2>Frequently asked questions</h2>
    <h3>Do I need an account?</h3>
    <p>
      No. You can play as a guest; your progress is saved in your browser. An
      account lets you keep your name and Pokédex across devices.
    </p>
    <h3>
      Why did I get a Normal-type Pokémon that doesn&apos;t match the roll?
    </h3>
    <p>
      That&apos;s a wildcard. It appears when the region and type have fewer
      than {OPTIONS_PER_ROLL} Pokémon left to offer.
    </p>
    <h3>Can I control moves during battle?</h3>
    <p>
      No. Battles are automatic. Your choices are the team you draft and the
      order it fights in.
    </p>
    <h3>What level are the Pokémon?</h3>
    <p>
      Your team battles at level 50. League opponents range from level 47 to 52.
    </p>
    <h3>Where can I look up a Pokémon?</h3>
    <p>
      The <Link href="/pokedex">Pokédex</Link> lists every Pokémon with its
      types, base stats, matchups and battle moveset.
    </p>

    <p>
      Ready? <Link href="/play">Start a run</Link>.
    </p>
  </Prose>
)

const portuguese = (
  <Prose>
    <h1>Como jogar Draftmon</h1>
    <p>
      O Draftmon é um jogo de captura e batalha. Você monta uma equipe de{' '}
      {TEAM_SIZE} Pokémon a partir de sorteios, define a ordem de batalha e
      enfrenta uma liga de {LEAGUE_MATCHES} partidas. Uma derrota encerra a
      campanha, então cada escolha conta.
    </p>

    <h2>1. Sorteie uma região e um tipo</h2>
    <p>
      Cada sorteio escolhe uma região e um tipo e mostra {OPTIONS_PER_ROLL}{' '}
      Pokémon da Pokédex daquela região com aquele tipo. Se não houver opções
      suficientes, a lista é completada com <strong>coringas</strong>: Pokémon
      do tipo Normal de qualquer região. Um sorteio nunca oferece mais de um
      Pokémon Lendário ou Mítico.
    </p>

    <h2>2. Capture um ou sorteie de novo</h2>
    <p>
      Escolha um Pokémon para capturar e o próximo sorteio começa. Você tem{' '}
      {REROLLS_PER_RUN} tentativas extras na campanha inteira. Cada uma pode
      trocar só o tipo, só a região ou os dois, então use quando o sorteio não
      tiver nada que combine com sua equipe.
    </p>

    <h2>3. Defina a ordem de batalha</h2>
    <p>
      Antes de cada partida você pode reordenar a equipe. O primeiro Pokémon
      abre a batalha; quando ele desmaia, o próximo entra. Você vê a equipe do
      adversário antes, então comece com alguém que bata forte no primeiro
      Pokémon dele.
    </p>

    <h2>4. Batalhe</h2>
    <p>
      As batalhas acontecem automaticamente. Cada Pokémon usa seu próprio
      conjunto de golpes, escolhido entre os que ele aprende. O mais rápido
      costuma agir primeiro, golpes de prioridade passam na frente e a paralisia
      corta a Velocidade pela metade. Acompanhe turno a turno ou pule para o
      resultado.
    </p>

    <h2>5. Vença a liga</h2>
    <p>
      A liga solo tem {LEAGUE_MATCHES} partidas contra Líderes de Ginásio, a
      Elite dos Quatro e Campeões, terminando contra um Campeão. Vença as{' '}
      {LEAGUE_MATCHES} para uma campanha perfeita. O{' '}
      <strong>desafio diário</strong> dá os mesmos sorteios para todos no dia,
      para comparar resultados.
    </p>

    <h2>Dicas de estratégia</h2>
    <ul>
      <li>
        <strong>Cubra suas fraquezas.</strong> Três Pokémon fracos contra o
        mesmo tipo podem cair para um único adversário. Varie os tipos.
      </li>
      <li>
        <strong>Golpes do mesmo tipo batem mais forte.</strong> Um golpe do
        mesmo tipo do usuário causa 1,5× de dano, então um Pokémon de Fogo com
        golpe de Fogo é mais forte que um de Água usando o mesmo golpe.
      </li>
      <li>
        <strong>Tipos duplos multiplicam.</strong> Um ataque super efetivo
        contra os dois tipos de um Pokémon causa 4× de dano. Um que é resistido
        duas vezes causa só ¼.
      </li>
      <li>
        <strong>Velocidade decide trocas.</strong> Quando dois Pokémon podem se
        nocautear, o mais rápido costuma vencer. Atacantes rápidos são ótimos
        para abrir.
      </li>
      <li>
        <strong>Guarde as tentativas.</strong> Os primeiros sorteios são fáceis
        de aproveitar. As tentativas valem mais nas duas últimas capturas,
        quando você já sabe o que falta.
      </li>
      <li>
        <strong>Não olhe só o total.</strong> Um Pokémon com &quot;Geral&quot;
        menor, mas do tipo certo, muitas vezes vence um mais forte que é fraco
        contra o próximo adversário.
      </li>
    </ul>

    <h2>Tabela de tipos</h2>
    <p>
      Um ataque causa 2× de dano a um tipo vulnerável e ½ a um tipo que resiste.
      Alguns tipos são imunes: por exemplo, golpes Normal e Lutador não afetam
      Fantasmas.
    </p>
    <TypeChartTable
      labels={{
        type: 'Tipo',
        strong: 'Forte contra',
        weak: 'Fraco contra',
      }}
    />

    <h2>Torneios com amigos</h2>
    <p>
      Abra <Link href="/lobby">Torneios</Link>, crie uma sala e compartilhe o
      link do convite. Todos capturam em segredo ao mesmo tempo. Bots podem
      ocupar as vagas livres. As salas podem ter fase de grupos antes do
      mata-mata, e cada fase tem prazo. Quando o prazo acaba, as capturas e
      ordens que faltam são preenchidas automaticamente. Depois da captura, dá
      para ver a equipe de todos, e as partidas encerradas podem ser vistas em
      replay.
    </p>

    <h2>Perguntas frequentes</h2>
    <h3>Preciso de conta?</h3>
    <p>
      Não. Você pode jogar como convidado; o progresso fica salvo no navegador.
      Com uma conta, seu nome e sua Pokédex acompanham você em outros
      dispositivos.
    </p>
    <h3>Por que apareceu um Pokémon Normal que não combina com o sorteio?</h3>
    <p>
      É um coringa. Ele aparece quando a região e o tipo têm menos de{' '}
      {OPTIONS_PER_ROLL} Pokémon disponíveis.
    </p>
    <h3>Posso escolher os golpes durante a batalha?</h3>
    <p>
      Não. As batalhas são automáticas. Suas escolhas são a equipe que você
      captura e a ordem em que ela luta.
    </p>
    <h3>Em que nível estão os Pokémon?</h3>
    <p>
      Sua equipe luta no nível 50. Os adversários da liga vão do nível 47 ao 52.
    </p>
    <h3>Onde vejo os dados de um Pokémon?</h3>
    <p>
      A <Link href="/pokedex">Pokédex</Link> lista cada Pokémon com tipos,
      atributos base, confrontos e golpes de batalha.
    </p>

    <p>
      Pronto? <Link href="/play">Comece uma campanha</Link>.
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
