import { useSyncExternalStore } from 'react'

export type Language = 'en' | 'pt-BR'
const KEY = 'draft-league-language'
const listeners = new Set<() => void>()

function initialLanguage(): Language {
  try {
    const saved = localStorage.getItem(KEY)
    if (saved === 'en' || saved === 'pt-BR') return saved
  } catch {
    // The browser language is still available.
  }
  return navigator.language.toLowerCase().startsWith('pt') ? 'pt-BR' : 'en'
}

let current = initialLanguage()
const subscribe = (listener: () => void) => {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function setLanguage(language: Language) {
  current = language
  try { localStorage.setItem(KEY, language) } catch { /* Use the choice for this visit. */ }
  listeners.forEach((listener) => listener())
}

const types: Record<string, string> = {
  normal: 'Normal', fire: 'Fogo', water: 'Água', electric: 'Elétrico', grass: 'Planta', ice: 'Gelo',
  fighting: 'Lutador', poison: 'Venenoso', ground: 'Terrestre', flying: 'Voador', psychic: 'Psíquico',
  bug: 'Inseto', rock: 'Pedra', ghost: 'Fantasma', dragon: 'Dragão', dark: 'Sombrio', steel: 'Aço', fairy: 'Fada',
}
const titles: Record<string, string> = {
  'Pewter Gym Leader': 'Líder de Ginásio de Pewter',
  'Cerulean Gym Leader': 'Líder de Ginásio de Cerulean',
  'Vermilion Gym Leader': 'Líder de Ginásio de Vermilion',
  'Celadon Gym Leader': 'Líder de Ginásio de Celadon',
  'Cinnabar Gym Leader': 'Líder de Ginásio de Cinnabar',
  'Kanto Elite Four': 'Elite dos Quatro de Kanto',
  'Johto Elite Four': 'Elite dos Quatro de Johto',
  'Indigo League Champion': 'Campeão da Liga Índigo',
  'Hoenn Champion': 'Campeão de Hoenn',
  'Sinnoh Champion': 'Campeã de Sinnoh',
}
const stats: Record<string, string> = { hp: 'PS', attack: 'Atq', defense: 'Def', 'special-attack': 'Atq Esp', 'special-defense': 'Def Esp', speed: 'Vel' }

export function useLanguage() {
  const language = useSyncExternalStore(subscribe, () => current)
  const t = (en: string, pt: string) => language === 'pt-BR' ? pt : en
  return {
    language,
    t,
    typeLabel: (type: string) => t(type, types[type] ?? type),
    trainerTitle: (title: string) => t(title, titles[title] ?? title),
    statLabel: (stat: string, label: string) => t(label, stats[stat] ?? label),
    stageLabel: (stage: string) => t(stage, ({
      'Round of 16': 'Oitavas de final', Quarterfinal: 'Quartas de final', Semifinal: 'Semifinal', Final: 'Final',
    } as Record<string, string>)[stage] ?? stage.replace(/^Group /, 'Grupo ')),
  }
}
