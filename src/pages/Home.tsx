import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { gameData } from '../engine/data'
import { LEAGUE_MATCHES, OPTIONS_PER_ROLL, REROLLS_PER_RUN, TEAM_SIZE } from '../engine/game'
import type { PlayerStats } from '../services/storage'
import { Sprite } from '../components/pokemon/Sprite'
import { avatars, avatarSprite } from '../services/guest'
import type { Guest } from '../services/guest'
import { useLanguage } from '../services/language'
import { AvatarLore } from '../components/pokemon/LoreCard'
import { protagonists } from '../components/pokemon/lore'

export function Home({
  stats,
  name,
  guest,
  onNameChange,
  onAvatarChange,
  onStart,
  onLobby,
}: {
  stats: PlayerStats
  name: string
  guest: Guest
  onNameChange: (name: string) => void
  onAvatarChange: (avatar: string) => void
  onStart: (mode: 'random' | 'daily') => void
  onLobby: () => void
}) {
  const { t } = useLanguage()
  const today = new Date().toISOString().slice(0, 10)
  const showcase = ['bulbasaur', 'charmander', 'pikachu', 'squirtle', 'eevee', 'gengar']
    .map((n) => gameData.pokemonByName.get(n))
    .filter((p) => p !== undefined)
  return (
    <div className="home">
      <section className="hero">
        <div className="hero-sprites flex [gap:clamp(0px,2vw,22px)] mb-4.5 flex-wrap justify-center">
          {showcase.map((p) => (
            <Sprite key={p.name} pokemon={p} size={72} />
          ))}
        </div>
        <h1>
          {t('Build your Pokémon team.', 'Monte sua equipe Pokémon.')}
        </h1>
        <p className="text-[1.1rem] text-muted max-w-160">
          {t(`Catch Pokémon by region and type, then take your team of ${TEAM_SIZE} into a ${LEAGUE_MATCHES}-match league against Gym Leaders, Elite Four members and Champions. One loss ends the run.`,
            `Capture Pokémon por região e tipo e leve sua equipe de ${TEAM_SIZE} a uma liga de ${LEAGUE_MATCHES} partidas contra Líderes de Ginásio, a Elite dos Quatro e Campeões. Uma derrota encerra a campanha.`)}
        </p>
        <section className="guest-card [width:min(100%,630px)] p-3.5 border border-line rounded-2xl bg-panel text-left" aria-label={t('Guest trainer profile', 'Perfil de treinador convidado')}>
          <div className="flex flex-wrap gap-y-2.5 gap-x-4 items-end">
            <label className="name-field grid gap-1 text-left mt-1.5">
              <span>{t('Your trainer name', 'Nome de treinador')}</span>
              <input value={name} maxLength={16} placeholder={t('Player', 'Treinador')} onChange={(e) => onNameChange(e.target.value)} />
            </label>
            <div className="guest-id grid gap-1 py-[5px] px-[11px] bg-panel-muted rounded-lg"><span>{t('Guest ID', 'ID de convidado')}</span><strong>{guest.id}</strong></div>
          </div>
          <fieldset className="avatar-picker min-w-0 mt-3 mx-0 mb-0 p-0 [border:0]">
            <legend>{t('Choose your trainer', 'Escolha seu treinador')}</legend>
            <div className="grid grid-cols-[repeat(auto-fit,minmax(53px,1fr))] gap-[5px]">
              {avatars.map((avatar) => (
                <div className="avatar-profile relative" key={avatar.id}>
                  <label className="avatar-choice relative cursor-pointer">
                    <input type="radio" name="avatar" checked={guest.avatar === avatar.id} onChange={() => onAvatarChange(avatar.id)} />
                    <span><img src={avatarSprite(avatar.id)} alt="" width={40} height={40} />{avatar.name}</span>
                  </label>
                  <AvatarLore name={avatar.name} entry={protagonists[avatar.id]} portrait={avatarSprite(avatar.id)} />
                </div>
              ))}
            </div>
          </fieldset>
        </section>
        <div className="flex gap-3 flex-wrap justify-center my-3.5 mx-0">
          <Button tone="primary" size="large" onClick={() => onStart('random')}>
            {t('Play as guest', 'Jogar como convidado')}
          </Button>
          <Button size="large" onClick={onLobby}>{t('Rooms & tournaments', 'Salas e torneios')}</Button>
          <Button size="large" onClick={() => onStart('daily')}>
            {t('Daily challenge', 'Desafio diário')}
            {stats.dailyBest[today] !== undefined && <span className="chip bg-[#18244a15] py-0.5 px-2 rounded-full text-[.75rem]">{t('best', 'melhor')} {stats.dailyBest[today]}/7</span>}
          </Button>
        </div>
        <p className="text-muted text-[.82rem]">{t('Progress is saved in this browser.', 'Seu progresso fica salvo neste navegador.')}</p>
      </section>

      <section className="mt-4 grid grid-cols-[repeat(auto-fit,minmax(min(100%,280px),1fr))] gap-4">
        <Card>
          <h3>{t('How it works', 'Como jogar')}</h3>
          <ol className="steps m-0 pl-5 text-muted">
            <li>
              {t(`Each roll shows ${OPTIONS_PER_ROLL} Pokémon based on a region and type, including wildcards.`, `Cada sorteio oferece ${OPTIONS_PER_ROLL} Pokémon de acordo com uma região e um tipo, incluindo opções coringa.`)}
            </li>
            <li>
              {t(`Use your ${REROLLS_PER_RUN} rerolls to change the type, the region, or both.`, `Use suas ${REROLLS_PER_RUN} tentativas para sortear novamente o tipo, a região ou ambos.`)}
            </li>
            <li>{t(`Catch one per roll until your team of ${TEAM_SIZE} is complete.`, `Capture um por sorteio até completar a equipe de ${TEAM_SIZE}.`)}</li>
            <li>{t('Reorder your team before every match.', 'Reordene sua equipe antes de cada partida.')}</li>
            <li>{t('Battles are automatic. Type advantages matter.', 'As batalhas são automáticas. Aproveite as vantagens de tipo.')}</li>
          </ol>
        </Card>
        <Card>
          <h3>{t('Your record', 'Seu histórico')}</h3>
          <div className="record flex gap-3">
            <div>
              <b>{stats.runs}</b>
              <span>{t('runs', 'campanhas')}</span>
            </div>
            <div>
              <b>{stats.best}/7</b>
              <span>{t('best', 'melhor')}</span>
            </div>
            <div>
              <b>{stats.perfect}</b>
              <span>{t('perfect 7–0', 'invicto 7–0')}</span>
            </div>
          </div>
        </Card>
      </section>
    </div>
  )
}
