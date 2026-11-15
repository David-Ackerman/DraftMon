import { createHash } from 'node:crypto'
import type { IncomingMessage } from 'node:http'
import type { createAccounts } from '../auth/accounts'
import { fail } from '../http'

export function createIdentifyPlayer(
  accounts: ReturnType<typeof createAccounts>,
) {
  return (request: IncomingMessage) => {
    const account = accounts.identify(request)
    if (account)
      return { account, id: account.id, key: `account:${account.id}` }
    const secret = /^Bearer ([a-f0-9]{64})$/.exec(
      request.headers.authorization ?? '',
    )?.[1]
    if (!secret) fail(401, 'Guest profile required.')
    return {
      account: null,
      id: secret.slice(0, 12).toUpperCase(),
      key: createHash('sha256').update(secret).digest('hex'),
    }
  }
}

export type IdentifyPlayer = ReturnType<typeof createIdentifyPlayer>
export type Player = ReturnType<IdentifyPlayer>
