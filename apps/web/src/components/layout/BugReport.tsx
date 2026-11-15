import Image from 'next/image'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'
import { useId, useRef, useState } from 'react'
import type { BugReportBody } from '@draftmon/contracts'
import type { FormEvent } from 'react'
import { useLanguage } from '../../services/language'
import { captureGame } from '../../services/captureGame'
import type { CapturedScreenshot } from '../../services/captureGame'
import { requestApi } from '../../services/api'

export function BugReport({
  game,
}: {
  game: (() => HTMLElement | null) | null
}) {
  const { t } = useLanguage()
  const heading = useId()
  const dialog = useRef<HTMLDialogElement>(null)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [screenshot, setScreenshot] = useState<CapturedScreenshot | null>(null)
  const [busy, setBusy] = useState<'capture' | 'submit' | null>(null)
  const [error, setError] = useState('')
  const [issue, setIssue] = useState<{ number: number; url: string } | null>(
    null,
  )
  const label = t('Report a problem', 'Relatar problema')

  async function takeScreenshot() {
    const target = game?.()
    if (!target || busy) return
    setBusy('capture')
    setError('')
    try {
      setScreenshot(await captureGame(target))
    } catch {
      setError(
        t(
          'Could not capture the game. You can still send your report.',
          'Não foi possível tirar o print. Você ainda pode enviar o relato.',
        ),
      )
    } finally {
      setBusy(null)
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (busy) return
    setError('')
    setBusy('submit')
    try {
      const created = await requestApi<{ number: number; url: string }>(
        '/api/bug-reports',
        {
          body: {
            title,
            description,
            screenshot: screenshot?.src,
          } satisfies BugReportBody,
        },
      )
      setIssue(created)
      setTitle('')
      setDescription('')
      setScreenshot(null)
    } catch (cause) {
      const errors: Record<string, string> = {
        invalid_report: t(
          'Enter a title and describe the problem.',
          'Digite um título e descreva o problema.',
        ),
        invalid_screenshot: t(
          'The screenshot is invalid or too large. Try taking it again or remove it.',
          'O print é inválido ou grande demais. Tente capturar de novo ou remova o print.',
        ),
        not_configured: t(
          'GitHub reporting is not configured on this server yet.',
          'O envio ao GitHub ainda não foi configurado neste servidor.',
        ),
        screenshots_not_configured: t(
          'This server cannot share screenshots yet. Remove the screenshot to send the report.',
          'Este servidor ainda não pode compartilhar prints. Remova o print para enviar o relato.',
        ),
        rate_limited: t(
          'Too many reports. Try again in a few minutes.',
          'Muitos relatos enviados. Tente novamente em alguns minutos.',
        ),
      }
      const code = cause instanceof Error ? cause.message : ''
      setError(
        Object.hasOwn(errors, code)
          ? errors[code]
          : t(
              'Could not send the report to GitHub. Try again in a moment.',
              'Não foi possível enviar o relato ao GitHub. Tente novamente em instantes.',
            ),
      )
    } finally {
      setBusy(null)
    }
  }

  return (
    <>
      <Button
        type="button"
        size="custom"
        aria-label={label}
        title={label}
        className="report-launcher fixed right-[max(14px,env(safe-area-inset-right))] bottom-[max(14px,env(safe-area-inset-bottom))] z-70 min-h-11 rounded-[10px] px-3.5 py-[9px] [font-size:inherit] shadow-[0_4px_18px_#14254a22] max-[1080px]:w-11 max-[1080px]:rounded-full max-[1080px]:p-0 wide-pointer:right-35 extra-wide-pointer:[right:max(180px,calc((100vw_-_1792px)_/_2_+_180px))]"
        onClick={() => {
          setIssue(null)
          setError('')
          dialog.current?.showModal()
        }}
      >
        <span
          className="grid size-5 place-items-center rounded-full border font-extrabold"
          aria-hidden="true"
        >
          !
        </span>
        <span className="max-[1080px]:hidden">{label}</span>
      </Button>
      <Card
        ref={dialog}
        as="dialog"
        className="m-auto max-h-[min(90dvh,720px)] w-[min(500px,calc(100%_-_24px))] overflow-auto text-ink backdrop:bg-[#102143a8]"
        aria-labelledby={heading}
        onCancel={(event) => {
          if (busy) event.preventDefault()
        }}
      >
        <header className="mb-2.5 flex flex-wrap items-center justify-between gap-2">
          <h2 id={heading} className="m-0">
            {label}
          </h2>
          <Button
            type="button"
            icon
            disabled={busy !== null}
            aria-label={t('Close', 'Fechar')}
            onClick={() => dialog.current?.close()}
          >
            ×
          </Button>
        </header>
        {issue ? (
          <p role="status" className="m-0">
            {t('Report sent.', 'Relato enviado.')}{' '}
            <a
              className="text-brand"
              href={issue.url}
              target="_blank"
              rel="noopener noreferrer"
            >
              {t('Open issue', 'Abrir issue')} #{issue.number}
            </a>
          </p>
        ) : (
          <form
            className="lobby-form grid content-start gap-3 [&_.tournament-checkbox]:flex [&_.tournament-checkbox]:items-center [&_.tournament-checkbox]:gap-[7px] [&_input]:w-full [&_input]:rounded-[8px] [&_input]:bg-panel [&_input]:[padding:9px] [&_input]:text-ink [&_input]:[border:1px_solid_var(--line)] [&_input]:[font:inherit] [&_label]:grid [&_label]:gap-[3px] [&_label]:text-[.82rem] [&_label]:font-bold [&_select]:w-full [&_select]:rounded-[8px] [&_select]:bg-panel [&_select]:[padding:9px] [&_select]:text-ink [&_select]:[border:1px_solid_var(--line)] [&_select]:[font:inherit]"
            onSubmit={submit}
          >
            <label>
              {t('Title', 'Título')}
              <input
                required
                maxLength={120}
                value={title}
                onChange={(event) => setTitle(event.target.value)}
              />
            </label>
            <label>
              {t('Description', 'Descrição')}
              <textarea
                className="w-full resize-y rounded-lg border border-line bg-panel p-[9px] text-ink [font:inherit]"
                required
                maxLength={4000}
                rows={5}
                value={description}
                onChange={(event) => setDescription(event.target.value)}
              />
            </label>
            {game && (
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  disabled={busy !== null}
                  onClick={() => void takeScreenshot()}
                >
                  {busy === 'capture'
                    ? t('Capturing…', 'Capturando…')
                    : t('Take screenshot', 'Printar problema')}
                </Button>
                {screenshot && (
                  <Button
                    type="button"
                    disabled={busy !== null}
                    onClick={() => setScreenshot(null)}
                  >
                    {t('Remove screenshot', 'Remover print')}
                  </Button>
                )}
              </div>
            )}
            {screenshot && (
              <Image
                className="block h-auto max-h-55 w-full rounded-lg border border-line object-contain"
                src={screenshot.src}
                width={screenshot.width}
                height={screenshot.height}
                alt={t('Screenshot preview', 'Prévia do print')}
                unoptimized
              />
            )}
            <p className="m-0 text-[.82rem] text-muted">
              {t(
                'Your report and any screenshot you include will be shared in a GitHub issue. Remove personal information before sending.',
                'Seu relato e o print anexado serão compartilhados em uma issue no GitHub. Remova informações pessoais antes de enviar.',
              )}
            </p>
            {error && (
              <p className="m-0 py-2.5 text-danger" role="alert">
                {error}
              </p>
            )}
            <Button tone="primary" disabled={busy !== null}>
              {busy === 'submit'
                ? t('Sending…', 'Enviando…')
                : t('Send to GitHub', 'Enviar ao GitHub')}
            </Button>
          </form>
        )}
      </Card>
    </>
  )
}
