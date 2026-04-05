const LOCAL_BACKEND_URL = 'http://localhost:5094'

function normalizeBaseUrl(url: string): string {
  return url.replace(/\/$/, '')
}

export function getApiBaseUrl(): string {
  const configured = process.env.NEXT_PUBLIC_API_URL?.trim()

  // In local development, always target the local backend unless explicitly overridden.
  if (process.env.NODE_ENV !== 'production') {
    const localOverride = process.env.NEXT_PUBLIC_LOCAL_API_URL?.trim()
    return normalizeBaseUrl(localOverride || LOCAL_BACKEND_URL)
  }

  if (configured) {
    return normalizeBaseUrl(configured)
  }

  return normalizeBaseUrl(LOCAL_BACKEND_URL)
}

export function buildApiUrl(path: string): string {
  const base = getApiBaseUrl()
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  return `${base}${normalizedPath}`
}
