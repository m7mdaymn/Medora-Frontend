const DEFAULT_BACKEND_URL = 'https://eliteclinicphase2.runasp.net'

function normalizeBaseUrl(url: string): string {
  return url.replace(/\/$/, '')
}

export function getApiBaseUrl(): string {
  const configured = process.env.NEXT_PUBLIC_API_URL?.trim()

  // Always honor explicit API configuration first (including local development).
  if (configured) {
    return normalizeBaseUrl(configured)
  }

  return normalizeBaseUrl(DEFAULT_BACKEND_URL)
}

export function buildApiUrl(path: string): string {
  const base = getApiBaseUrl()
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  return `${base}${normalizedPath}`
}
