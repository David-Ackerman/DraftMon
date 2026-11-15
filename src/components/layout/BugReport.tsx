import { Button } from '../ui/Button'
import { Card } from '../ui/Card'
import { useId, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { useLanguage } from '../../services/language'
import { captureGame } from '../../services/captureGame'

export function BugReport({ game }: { game: (() => HTMLElement | null) | null }) {
  const { t } = useLanguage()
  const heading = useId()
  const dialog = useRef<HTMLDialogElement>(null)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [screenshot, setScreenshot] = useState('')
  const [busy, setBusy] = useState<'capture' | 'submit' | null>(null)
  const [error, setError] = useState('')
  const [issue, setIssue] = useState<{ number: number; url: string } | null>(null)
  const label = t('Report a problem', 'Relatar problema')

  async function takeScreenshot() {
    const target = game?.()
    if (!target || busy) return
    setBusy('capture')
    setError('')
    try {
      setScreenshot(await captureGame(target))
    } catch {
      setError(t('Could not capture the game. You can still send your report.', 'Não foi possível tirar o print. Você ainda pode enviar o relato.'))
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
      const response = await fetch('/api/bug-reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description, screenshot: screenshot || undefined }),
      })
      const data = await response.json()
      if (!response.ok) {
        const errors: Record<string, string> = {
          invalid_report: t('Enter a title and describe the problem.', 'Digite um título e descreva o problema.'),
          invalid_screenshot: t('The screenshot is invalid or too large. Try taking it again or remove it.', 'O print é inválido ou grande demais. Tente capturar de novo ou remova o print.'),
          not_configured: t('GitHub reporting is not configured on this server yet.', 'O envio ao GitHub ainda não foi configurado neste servidor.'),
          screenshots_not_configured: t('This server cannot share screenshots yet. Remove the screenshot to send the report.', 'Este servidor ainda não pode compartilhar prints. Remova o print para enviar o relato.'),
          rate_limited: t('Too many reports. Try again in a few minutes.', 'Muitos relatos enviados. Tente novamente em alguns minutos.'),
        }
        if (Object.hasOwn(errors, data.error)) {
          setError(errors[data.error])
          return
        }
        throw new Error('Report submission failed')
      }
      setIssue({ number: data.number, url: data.url })
      setTitle('')
      setDescription('')
      setScreenshot('')
    } catch {
      setError(t('Could not send the report to GitHub. Try again in a moment.', 'Não foi possível enviar o relato ao GitHub. Tente novamente em instantes.'))
    } finally {
      setBusy(null)
    }
  }

  return <>
    <Button type="button" size="custom" aria-label={label} title={label}
      className="report-launcher fixed right-[max(14px,env(safe-area-inset-right))] bottom-[max(14px,env(safe-area-inset-bottom))] z-70 min-h-11 rounded-[10px] px-3.5 py-[9px] [font-size:inherit] shadow-[0_4px_18px_#14254a22] max-[1080px]:w-11 max-[1080px]:rounded-full max-[1080px]:p-0"
      onClick={() => {
      setIssue(null)
      setError('')
      dialog.current?.showModal()
    }}>
      <span className="grid size-5 place-items-center rounded-full border font-extrabold" aria-hidden="true">!</span>
      <span className="max-[1080px]:hidden">{label}</span>
    </Button>
    <Card ref={dialog} as="dialog" className="m-auto max-h-[min(90dvh,720px)] w-[min(500px,calc(100%_-_24px))] overflow-auto text-ink backdrop:bg-[#102143a8]" aria-labelledby={heading} onCancel={(event) => {
      if (busy) event.preventDefault()
    }}>
      <header className="mb-2.5 flex flex-wrap items-center justify-between gap-2">
        <h2 id={heading} className="m-0">{label}</h2>
        <Button type="button" icon disabled={busy !== null} aria-label={t('Close', 'Fechar')} onClick={() => dialog.current?.close()}>×</Button>
      </header>
      {issue ? <p role="status" className="m-0">{t('Report sent.', 'Relato enviado.')} <a className="text-brand" href={issue.url} target="_blank" rel="noopener noreferrer">
        {t('Open issue', 'Abrir issue')} #{issue.number}
      </a></p> : <form className="lobby-form grid gap-3 content-start" onSubmit={submit}>
        <label>{t('Title', 'Título')}
          <input required maxLength={120} value={title} onChange={(event) => setTitle(event.target.value)} />
        </label>
        <label>{t('Description', 'Descrição')}
          <textarea className="w-full resize-y rounded-lg border border-line bg-panel p-[9px] text-ink [font:inherit]" required maxLength={4000} rows={5} value={description} onChange={(event) => setDescription(event.target.value)} />
        </label>
        {game && <div className="flex flex-wrap items-center gap-2">
          <Button type="button" disabled={busy !== null} onClick={() => void takeScreenshot()}>
            {busy === 'capture' ? t('Capturing…', 'Capturando…') : t('Take screenshot', 'Printar problema')}
          </Button>
          {screenshot && <Button type="button" disabled={busy !== null} onClick={() => setScreenshot('')}>
            {t('Remove screenshot', 'Remover print')}
          </Button>}
        </div>}
        {screenshot && <img className="block w-full max-h-55 object-contain border border-line rounded-lg" src={screenshot} alt={t('Screenshot preview', 'Prévia do print')} />}
        <p className="m-0 text-[.82rem] text-muted">{t('Your report and any screenshot you include will be shared in a GitHub issue. Remove personal information before sending.', 'Seu relato e o print anexado serão compartilhados em uma issue no GitHub. Remova informações pessoais antes de enviar.')}</p>
        {error && <p className="m-0 py-2.5 text-danger" role="alert">{error}</p>}
        <Button tone="primary" disabled={busy !== null}>
          {busy === 'submit' ? t('Sending…', 'Enviando…') : t('Send to GitHub', 'Enviar ao GitHub')}
        </Button>
      </form>}
    </Card>
  </>
}
