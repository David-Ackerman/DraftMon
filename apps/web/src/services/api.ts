export type ApiPath = `/api/${string}`

export async function requestApi<Data>(
  path: ApiPath,
  {
    body,
    method = body ? 'POST' : 'GET',
    credential,
    fallback = 'API unavailable.',
  }: {
    body?: object
    method?: 'GET' | 'POST'
    credential?: string
    fallback?: string
  } = {},
): Promise<Data> {
  const response = await fetch(path, {
    method,
    headers: {
      Accept: 'application/json',
      ...(credential && { Authorization: `Bearer ${credential}` }),
      ...(body && { 'Content-Type': 'application/json' }),
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  if (!response.headers.get('content-type')?.includes('application/json'))
    throw new Error(fallback)
  const data = await response.json()
  if (!response.ok)
    throw new Error(typeof data?.error === 'string' ? data.error : fallback)
  return data as Data
}
