import { getAuthContext } from '../actions/auth/getToken'
import { BaseApiResponse } from '../types/api'
import { buildApiUrl } from './apiBaseUrl'

interface FetchOptions extends RequestInit {
  tenantSlug?: string
  authType?: 'staff' | 'patient'
  skipBranchSelection?: boolean
}

const FETCH_TIMEOUT_MS = 15000

function getCookieValue(cookieHeader: string | null | undefined, key: string): string | null {
  if (!cookieHeader) return null

  const encodedKey = encodeURIComponent(key)
  const parts = cookieHeader.split(';')

  for (const part of parts) {
    const trimmed = part.trim()
    if (!trimmed) continue

    const separatorIndex = trimmed.indexOf('=')
    if (separatorIndex === -1) continue

    const rawName = trimmed.slice(0, separatorIndex).trim()
    if (rawName !== key && rawName !== encodedKey) continue

    const rawValue = trimmed.slice(separatorIndex + 1)
    try {
      return decodeURIComponent(rawValue)
    } catch {
      return rawValue
    }
  }

  return null
}

function getSelectedBranchCookie(tenantSlug: string, headers: Headers): string | null {
  const cookieKey = `selected_branch_${tenantSlug}`

  // Browser runtime: read directly from document.cookie.
  if (typeof document !== 'undefined') {
    return getCookieValue(document.cookie, cookieKey)
  }

  // Server runtime fallback for callers that forward Cookie header explicitly.
  const cookieHeader = headers.get('cookie') || headers.get('Cookie')
  return getCookieValue(cookieHeader, cookieKey)
}

export async function fetchApi<T>(
  endpoint: string,
  options: FetchOptions = {},
): Promise<BaseApiResponse<T>> {
  const {
    tenantSlug,
    authType = 'staff',
    skipBranchSelection = false,
    headers: customHeaders,
    signal: externalSignal,
    ...restOptions
  } = options

  const authContext = await getAuthContext(authType, tenantSlug)
  const token = authContext.token
  const headers = new Headers(customHeaders)

  // هندلة الـ Content-Type بناءً على نوع الـ Body (عشان رفع الصور يشتغل)
  if (!(restOptions.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json')
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  if (tenantSlug) {
    headers.set('X-Tenant', tenantSlug)

    if (authType === 'staff' && !skipBranchSelection && !headers.has('X-Branch')) {
      const selectedBranchId = authContext.selectedBranchId || getSelectedBranchCookie(tenantSlug, headers)
      if (selectedBranchId) {
        headers.set('X-Branch', selectedBranchId)
      }
    }
  }

  const url = buildApiUrl(endpoint)

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)

  const onExternalAbort = () => controller.abort()
  if (externalSignal) {
    externalSignal.addEventListener('abort', onExternalAbort)
  }

  try {
    const response = await fetch(url, {
      headers,
      signal: controller.signal,
      ...restOptions,
    })

    clearTimeout(timeoutId)
    externalSignal?.removeEventListener('abort', onExternalAbort)

    const isObject = (value: unknown): value is Record<string, unknown> =>
      typeof value === 'object' && value !== null

    const isBaseApiResponse = (value: unknown): value is BaseApiResponse<T> => {
      if (!isObject(value)) return false

      return (
        typeof value.success === 'boolean' &&
        typeof value.message === 'string' &&
        'data' in value &&
        Array.isArray(value.errors) &&
        isObject(value.meta) &&
        typeof value.meta.timestamp === 'string' &&
        typeof value.meta.requestId === 'string'
      )
    }

    const extractMessage = (value: unknown): string | undefined => {
      if (!isObject(value) || typeof value.message !== 'string') {
        return undefined
      }

      return value.message
    }

    const extractErrors = (value: unknown): Array<{ field: string; message: string }> | undefined => {
      if (!isObject(value) || !Array.isArray(value.errors)) {
        return undefined
      }

      const normalized = value.errors.filter(
        (item): item is { field: string; message: string } =>
          isObject(item) && typeof item.field === 'string' && typeof item.message === 'string',
      )

      return normalized.length > 0 ? normalized : undefined
    }

    const extractMeta = (value: unknown): { timestamp: string; requestId: string } | undefined => {
      if (!isObject(value) || !isObject(value.meta)) {
        return undefined
      }

      if (typeof value.meta.timestamp !== 'string' || typeof value.meta.requestId !== 'string') {
        return undefined
      }

      return {
        timestamp: value.meta.timestamp,
        requestId: value.meta.requestId,
      }
    }

    let responseData: unknown = null
    try {
      if (response.status !== 204) {
        const rawText = await response.text()
        responseData = rawText ? (JSON.parse(rawText) as unknown) : null
      }
    } catch {
      responseData = null
    }

    const defaultMeta = { timestamp: new Date().toISOString(), requestId: '' }

    if (response.status === 429) {
      return {
        success: false,
        message: extractMessage(responseData) || 'طلبات كثيرة جداً، يرجى الانتظار قليلاً',
        data: null as unknown as T,
        errors: extractErrors(responseData) || [{ field: 'rate_limit', message: 'Too Many Requests' }],
        meta: extractMeta(responseData) || defaultMeta,
      }
    }

    if (response.status === 401) {
      const isLoginRequest = endpoint.toLowerCase().includes('/login')

      return {
        success: false,
        message:
          extractMessage(responseData) ||
          (isLoginRequest ? 'بيانات الدخول غير صحيحة' : 'انتهت الجلسة، يرجى تسجيل الدخول'),
        data: null as unknown as T,
        errors: extractErrors(responseData) || [{ field: 'auth', message: 'Unauthorized' }],
        meta: extractMeta(responseData) || defaultMeta,
      }
    }

    if (response.status === 403) {
      return {
        success: false,
        message: extractMessage(responseData) || 'ليس لديك صلاحية للقيام بهذا الإجراء',
        data: null as unknown as T,
        errors: extractErrors(responseData) || [{ field: 'auth', message: 'Forbidden' }],
        meta: extractMeta(responseData) || defaultMeta,
      }
    }

    if (isBaseApiResponse(responseData)) {
      return responseData
    }

    if (response.ok) {
      return {
        success: true,
        message: 'تم التنفيذ بنجاح',
        data: (responseData as T) ?? null,
        errors: [],
        meta: defaultMeta,
      }
    }

    return {
      success: false,
      message:
        extractMessage(responseData) || response.statusText || `فشل الطلب (${response.status})`,
      data: null,
      errors:
        extractErrors(responseData) ||
        [
          {
            field: 'http',
            message: `HTTP ${response.status}`,
          },
        ],
      meta: extractMeta(responseData) || defaultMeta,
    }
  } catch (error: unknown) {
    clearTimeout(timeoutId)
    externalSignal?.removeEventListener('abort', onExternalAbort)

    const isTimeout = error instanceof Error && error.name === 'AbortError'

    return {
      success: false,
      message: isTimeout ? 'انتهت مهلة الاتصال بالخادم' : 'فشل في الاتصال بالخادم',
      data: null as unknown as T,
      errors: [
        {
          field: 'server',
          message: isTimeout ? 'Request timeout' : 'Network error or server down',
        },
      ],
      meta: { timestamp: new Date().toISOString(), requestId: '' },
    }
  }
}
