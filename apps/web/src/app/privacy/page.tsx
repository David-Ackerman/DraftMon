import type { Metadata } from 'next'
import Link from 'next/link'
import { ByLanguage } from '../../components/ui/ByLanguage'
import { Prose } from '../../components/ui/Prose'
import { PublicPage } from '../PublicPage'
import { publicMetadata } from '../site'

export const metadata: Metadata = publicMetadata(
  'Privacy policy',
  'How Draftmon handles your data, cookies, advertising and accounts.',
  '/privacy',
)

const UPDATED = { en: 'November 25, 2026', pt: '25 de novembro de 2026' }
const GOOGLE_PARTNER_SITES =
  'https://policies.google.com/technologies/partner-sites'
const GOOGLE_AD_SETTINGS = 'https://adssettings.google.com'
const ABOUT_ADS = 'https://www.aboutads.info/choices'
const YOUR_ONLINE_CHOICES = 'https://www.youronlinechoices.eu'
const ISSUES = 'https://github.com/David-Ackerman/DraftMon/issues'

const english = (
  <Prose>
    <h1>Privacy policy</h1>
    <p className="text-muted">Last updated: {UPDATED.en}</p>
    <p>
      Draftmon is an independent, non-commercial fan game. This page explains
      what information the site stores, why, and the choices you have. You can
      play without creating an account.
    </p>

    <h2>Information stored in your browser</h2>
    <p>
      To keep the game working, Draftmon saves the following in your
      browser&apos;s local storage. It stays on your device and you can clear it
      at any time in your browser settings:
    </p>
    <ul>
      <li>your trainer name, chosen trainer and a random guest ID;</li>
      <li>your current run, record and daily challenge results;</li>
      <li>language, light or dark theme and sound settings;</li>
      <li>your personal Pokédex progress.</li>
    </ul>

    <h2>Accounts</h2>
    <p>
      Accounts are optional. If you create one, we store your username, a
      securely hashed password and, if you add it, your email address. The email
      is used only to send password-reset links. Signing in sets one strictly
      necessary cookie, <code>poke_session</code>, which keeps you signed in for
      up to 14 days.
    </p>

    <h2>Tournaments and Pokédex progress</h2>
    <p>
      When you play in a tournament room, the other participants see your
      trainer name, avatar, record and, after the draft, your team. Pokédex
      progress is synced with our server so it follows your guest ID or account.
    </p>

    <h2>Bug reports</h2>
    <p>
      If you send a bug report, its title, description and optional screenshot
      are published as a public issue in the project&apos;s GitHub repository.
      Do not include personal information in a report.
    </p>

    <h2>Advertising and cookies</h2>
    <p>
      Draftmon shows ads served by Google AdSense to cover hosting costs.
      Third-party vendors, including Google, use cookies to serve ads based on
      your prior visits to this and other websites. Google&apos;s use of
      advertising cookies enables it and its partners to serve ads to you based
      on those visits.
    </p>
    <ul>
      <li>
        You can opt out of personalized advertising in{' '}
        <a href={GOOGLE_AD_SETTINGS}>Google Ads Settings</a>, or for many
        third-party vendors at <a href={ABOUT_ADS}>aboutads.info</a> and{' '}
        <a href={YOUR_ONLINE_CHOICES}>youronlinechoices.eu</a>.
      </li>
      <li>
        Learn{' '}
        <a href={GOOGLE_PARTNER_SITES}>
          how Google uses data when you use our partners&apos; sites or apps
        </a>
        .
      </li>
      <li>
        Visitors in the European Economic Area, the United Kingdom and
        Switzerland are asked for consent before personalized ads are shown.
      </li>
    </ul>

    <h2>Hosting and server logs</h2>
    <p>
      The site runs on Google Cloud behind Cloudflare. Like most websites, these
      services process your IP address and basic request details to deliver
      pages and protect against abuse. We do not use analytics or tracking tools
      of our own.
    </p>

    <h2>Children</h2>
    <p>
      Draftmon is not directed at children under 13, and we do not knowingly
      collect personal information from them. If you believe a child has created
      an account, contact us and we will delete it.
    </p>

    <h2>Your choices</h2>
    <ul>
      <li>Play as a guest without giving any personal information.</li>
      <li>
        Clear the site&apos;s data in your browser to reset local progress.
      </li>
      <li>
        Ask us to delete your account and related data through the contact
        options on the <Link href="/about">About page</Link>.
      </li>
    </ul>

    <h2>Changes</h2>
    <p>
      If this policy changes, the new version will be posted on this page with
      an updated date.
    </p>
    <p>
      Questions? <a href={ISSUES}>Open an issue on GitHub</a> or see the{' '}
      <Link href="/about">About page</Link>.
    </p>
  </Prose>
)

const portuguese = (
  <Prose>
    <h1>Política de privacidade</h1>
    <p className="text-muted">Última atualização: {UPDATED.pt}</p>
    <p>
      O Draftmon é um jogo de fã independente e sem fins comerciais. Esta página
      explica quais informações o site guarda, por quê, e quais escolhas você
      tem. Você pode jogar sem criar conta.
    </p>

    <h2>Informações salvas no seu navegador</h2>
    <p>
      Para o jogo funcionar, o Draftmon salva no armazenamento local do seu
      navegador os itens abaixo. Eles ficam no seu dispositivo e podem ser
      apagados a qualquer momento nas configurações do navegador:
    </p>
    <ul>
      <li>
        nome de treinador, treinador escolhido e um ID de convidado aleatório;
      </li>
      <li>
        a campanha atual, seu histórico e os resultados do desafio diário;
      </li>
      <li>idioma, tema claro ou escuro e configurações de som;</li>
      <li>o progresso da sua Pokédex pessoal.</li>
    </ul>

    <h2>Contas</h2>
    <p>
      Criar conta é opcional. Se você criar uma, guardamos seu nome de usuário,
      a senha protegida por hash e, se você informar, seu e-mail. O e-mail é
      usado apenas para enviar links de redefinição de senha. Entrar na conta
      cria um único cookie estritamente necessário, <code>poke_session</code>,
      que mantém a sessão por até 14 dias.
    </p>

    <h2>Torneios e progresso da Pokédex</h2>
    <p>
      Em uma sala de torneio, os outros participantes veem seu nome de
      treinador, avatar, desempenho e, após a captura, sua equipe. O progresso
      da Pokédex é sincronizado com nosso servidor para acompanhar seu ID de
      convidado ou sua conta.
    </p>

    <h2>Relatos de problemas</h2>
    <p>
      Se você enviar um relato de problema, o título, a descrição e a captura de
      tela opcional são publicados como uma issue pública no repositório do
      projeto no GitHub. Não inclua dados pessoais no relato.
    </p>

    <h2>Publicidade e cookies</h2>
    <p>
      O Draftmon exibe anúncios do Google AdSense para cobrir os custos de
      hospedagem. Fornecedores terceiros, incluindo o Google, usam cookies para
      exibir anúncios com base em visitas anteriores a este e a outros sites. O
      uso de cookies de publicidade permite que o Google e seus parceiros exibam
      anúncios com base nessas visitas.
    </p>
    <ul>
      <li>
        Você pode desativar a publicidade personalizada nas{' '}
        <a href={GOOGLE_AD_SETTINGS}>Configurações de anúncios do Google</a>, ou
        para vários fornecedores em <a href={ABOUT_ADS}>aboutads.info</a> e{' '}
        <a href={YOUR_ONLINE_CHOICES}>youronlinechoices.eu</a>.
      </li>
      <li>
        Saiba{' '}
        <a href={GOOGLE_PARTNER_SITES}>
          como o Google usa dados quando você usa sites ou apps de parceiros
        </a>
        .
      </li>
      <li>
        Visitantes do Espaço Econômico Europeu, do Reino Unido e da Suíça são
        consultados antes da exibição de anúncios personalizados.
      </li>
    </ul>

    <h2>Hospedagem e registros do servidor</h2>
    <p>
      O site roda no Google Cloud, protegido pela Cloudflare. Como na maioria
      dos sites, esses serviços processam seu endereço IP e dados básicos da
      requisição para entregar as páginas e evitar abusos. Não usamos
      ferramentas próprias de análise ou rastreamento.
    </p>

    <h2>Crianças</h2>
    <p>
      O Draftmon não é direcionado a menores de 13 anos e não coletamos
      intencionalmente dados pessoais deles. Se você acredita que uma criança
      criou uma conta, fale conosco e ela será excluída.
    </p>

    <h2>Suas escolhas</h2>
    <ul>
      <li>Jogue como convidado sem informar dados pessoais.</li>
      <li>
        Apague os dados do site no navegador para zerar o progresso local.
      </li>
      <li>
        Peça a exclusão da sua conta e dos dados relacionados pelos contatos da{' '}
        <Link href="/about">página Sobre</Link>.
      </li>
    </ul>

    <h2>Alterações</h2>
    <p>
      Se esta política mudar, a nova versão será publicada nesta página com a
      data atualizada.
    </p>
    <p>
      Dúvidas? <a href={ISSUES}>Abra uma issue no GitHub</a> ou veja a{' '}
      <Link href="/about">página Sobre</Link>.
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
