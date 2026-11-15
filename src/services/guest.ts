import avatars from '../data/avatars.json'

export { avatars }
export const avatarSprite = (id: string) => `/avatars/${id}.png`

const KEY = 'draft-league-guest-v1'

export interface Guest {
  id: string
  credential: string
  avatar: string
}

export function loadGuest(): Guest {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) ?? 'null')
    if (saved && /^[a-f0-9]{64}$/.test(saved.credential) && avatars.some((avatar) => avatar.id === saved.avatar)) {
      return { ...saved, id: saved.credential.slice(0, 12).toUpperCase() }
    }
  } catch {
    // A new profile can still be used when storage is unavailable.
  }
  const credential = Array.from(crypto.getRandomValues(new Uint8Array(32)), (byte) => byte.toString(16).padStart(2, '0')).join('')
  const guest = { id: credential.slice(0, 12).toUpperCase(), credential, avatar: avatars[0].id }
  saveGuest(guest)
  return guest
}

export function saveGuest(guest: Guest) {
  try {
    localStorage.setItem(KEY, JSON.stringify(guest))
  } catch {
    // Keep the profile in memory for this visit.
  }
}
