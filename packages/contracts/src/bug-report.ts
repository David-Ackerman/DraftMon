export const DRAFTMON_GITHUB_REPOSITORY = 'David-Ackerman/DraftMon'

export function bugReportMarkdown(description: string, screenshot?: string) {
  const plainText = description
    .trim()
    .split(/\r\n?|\n/)
    .map((line) => '    ' + line)
    .join('\n')
  return (
    '## Draftmon bug report\n\n' +
    plainText +
    (screenshot ? `\n\n[View screenshot](${screenshot})` : '')
  )
}
