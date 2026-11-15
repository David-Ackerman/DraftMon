import { gameData } from '@draftmon/content'
import { buildTypeChart } from '@draftmon/engine'

export const chart = buildTypeChart(gameData.types)
