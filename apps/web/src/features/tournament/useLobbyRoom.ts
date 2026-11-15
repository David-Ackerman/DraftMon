import { useEffect, useState } from 'react'
import type { Guest } from '../../services/guest'
import type { Replay } from './models'
import type { Room } from './roomApi'
import { requestRoom } from './roomApi'

export function useLobbyRoom(
  guest: Guest,
  invite: string,
  onRoomChange: (code: string) => void,
) {
  const [room, setRoom] = useState<Room | null>(null)
  const [replay, setReplay] = useState<Replay | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [reconnecting, setReconnecting] = useState(false)
  const activeCode = room?.code

  useEffect(() => {
    if (!invite || activeCode) return
    let stopped = false
    void requestRoom(guest, `/${invite}`)
      .then((current) => {
        if (!stopped) setRoom((previous) => previous ?? current)
      })
      .catch(() => {
        // A guest opening an invitation can use the join form.
      })
    return () => {
      stopped = true
    }
  }, [invite, activeCode, guest])

  useEffect(() => {
    if (!activeCode) return
    let stopped = false
    let timer: ReturnType<typeof setTimeout>
    const poll = async () => {
      try {
        const current = await requestRoom(guest, `/${activeCode}`)
        if (!stopped) {
          setRoom((previous) =>
            !previous || current.revision >= previous.revision
              ? current
              : previous,
          )
          setReconnecting(false)
        }
      } catch {
        if (!stopped) setReconnecting(true)
      } finally {
        if (!stopped) timer = setTimeout(poll, 2500)
      }
    }
    timer = setTimeout(poll, 2500)
    return () => {
      stopped = true
      clearTimeout(timer)
    }
  }, [activeCode, guest])

  const execute = async (path: string, body: object) => {
    setBusy(true)
    setError('')
    try {
      const next = await requestRoom(guest, path, body)
      setRoom((previous) =>
        !previous ||
        next.code !== previous.code ||
        next.revision >= previous.revision
          ? next
          : previous,
      )
      onRoomChange(next.code)
      return true
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : 'Could not connect to the room.',
      )
      return false
    } finally {
      setBusy(false)
    }
  }

  const watchReplay = async (round: number, slot: number) => {
    if (!activeCode) return
    setBusy(true)
    setError('')
    try {
      setReplay(
        await requestRoom<Replay>(
          guest,
          `/${activeCode}/replay?round=${round}&slot=${slot}`,
        ),
      )
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Replay not available.')
    } finally {
      setBusy(false)
    }
  }

  return {
    room,
    replay,
    closeReplay: () => setReplay(null),
    busy,
    error,
    reconnecting,
    execute,
    watchReplay,
  }
}
