const BASE = (import.meta.env.VITE_API_BASE as string | undefined) ?? '/api'

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

type QueryValue = string | number | boolean | undefined | null
type HeaderMap = Record<string, string>

async function parseError(res: Response): Promise<string> {
  let message = `HTTP ${res.status}`
  try {
    const body = await res.json()
    message =
      (body as { error?: string; message?: string }).error ??
      (body as { message?: string }).message ??
      message
  } catch {
    // ignore
  }
  return message
}

function buildUrl(path: string, params?: Record<string, QueryValue>): string {
  let url = `${BASE}${path}`
  if (params) {
    const qs = Object.entries(params)
      .filter(([, v]) => v !== undefined && v !== null && v !== '')
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
      .join('&')
    if (qs) url += `?${qs}`
  }
  return url
}

export async function apiGet<T>(
  path: string,
  params?: Record<string, QueryValue>,
  headers?: HeaderMap,
): Promise<T> {
  const res = await fetch(buildUrl(path, params), {
    headers: { Accept: 'application/json', ...headers },
  })
  if (!res.ok) throw new ApiError(res.status, await parseError(res))
  return res.json() as Promise<T>
}

export async function apiPost<T>(
  path: string,
  body: unknown,
  headers?: HeaderMap,
): Promise<T> {
  const res = await fetch(buildUrl(path), {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...headers,
    },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new ApiError(res.status, await parseError(res))
  return res.json() as Promise<T>
}

export async function apiPatch<T>(
  path: string,
  body: unknown,
  headers?: HeaderMap,
): Promise<T> {
  const res = await fetch(buildUrl(path), {
    method: 'PATCH',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...headers,
    },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new ApiError(res.status, await parseError(res))
  return res.json() as Promise<T>
}
