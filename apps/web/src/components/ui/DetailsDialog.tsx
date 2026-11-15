import { useEffect, useId, useRef } from 'react'
import type { ReactNode } from 'react'
import { useLanguage } from '../../services/language'
import { Button } from './Button'

export function DetailsDialog({
  title,
  children,
  onDismiss,
}: {
  title: string
  children: ReactNode
  onDismiss: () => void
}) {
  const { t } = useLanguage()
  const dialog = useRef<HTMLDialogElement>(null)
  const titleId = useId()

  useEffect(() => {
    const panel = dialog.current!
    panel.showModal()
    return () => panel.close()
  }, [])

  function dismiss() {
    dialog.current?.close()
    onDismiss()
  }

  return (
    <dialog
      ref={dialog}
      aria-labelledby={titleId}
      className="fixed inset-0 m-auto max-h-[calc(100dvh_-_2rem)] w-[min(460px,calc(100%_-_2rem))] overflow-y-auto overscroll-contain rounded-panel border border-line bg-panel p-0 text-ink shadow-xl backdrop:bg-[#15234099]"
      onCancel={(event) => {
        event.preventDefault()
        dismiss()
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) dismiss()
      }}
    >
      <div className="grid gap-3 p-3">
        <header className="sticky top-0 z-10 -mx-3 -mt-3 flex min-w-0 items-center justify-between gap-3 border-b border-line bg-panel px-3 py-2.5">
          <h2 id={titleId} className="m-0 text-lg font-extrabold wrap-anywhere">
            {title}
          </h2>
          <Button
            icon
            size="custom"
            type="button"
            className="silent size-11 shrink-0 rounded-lg text-xl"
            aria-label={t('Close details', 'Fechar detalhes')}
            onClick={dismiss}
          >
            <span aria-hidden="true">×</span>
          </Button>
        </header>
        {children}
      </div>
    </dialog>
  )
}
