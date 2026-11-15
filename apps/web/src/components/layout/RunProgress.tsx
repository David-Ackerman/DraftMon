import type { Run } from '../../features/solo/run'
import { useLanguage } from '../../services/language'

export function RunProgress({
  run,
  drafting,
}: {
  run: Run
  drafting: boolean
}) {
  const { stageLabel } = useLanguage()
  return (
    <div className="run-progress flex gap-1.5">
      {run.league.map((match, index) => {
        const result = run.results[index]
        const style =
          result === true
            ? 'border-success bg-success'
            : result === false
              ? 'border-danger bg-danger'
              : index === run.matchIndex && !drafting
                ? 'border-accent bg-panel-muted shadow-[0_0_0_3px_#ffcb0533]'
                : 'border-line bg-panel-muted'
        return (
          <span
            key={match.trainer.id}
            className={`size-3.5 rounded-full border-2 max-[480px]:size-2.5 ${style}`}
            title={`${stageLabel(match.stage)}: ${match.trainer.name}`}
          />
        )
      })}
    </div>
  )
}
