import { getToken } from '../actions/auth/getToken'
import { BaseApiResponse } from '../types/api'

interface FetchOptions extends RequestInit {
  tenantSlug?: string
  authType?: 'staff' | 'patient'
}

const FETCH_TIMEOUT_MS = 15000

export async function fetchApi<T>(
  endpoint: string,
  options: FetchOptions = {},
): Promise<BaseApiResponse<T>> {
  const {
    tenantSlug,
    authType = 'staff',
    headers: customHeaders,
    signal: externalSignal,
    ...restOptions
  } = options

  const token = await getToken(authType, tenantSlug)
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
  }

  const url = `${process.env.NEXT_PUBLIC_API_URL}${endpoint}`

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

    // تعريف دقيق لشكل الرد في حالة الخطأ عشان TypeScript ميعيطش
    type ErrorResponse = {
      message?: string
      errors?: { field: string; message: string }[]
      meta?: { timestamp: string; requestId: string }
    }

    let responseData: ErrorResponse | null = null
    try {
      responseData = (await response.json()) as ErrorResponse
    } catch {
      responseData = null
    }

    const defaultMeta = { timestamp: new Date().toISOString(), requestId: '' }

    if (response.status === 429) {
      return {
        success: false,
        message: responseData?.message || 'طلبات كثيرة جداً، يرجى الانتظار قليلاً',
        data: null as unknown as T,
        errors: responseData?.errors || [{ field: 'rate_limit', message: 'Too Many Requests' }],
        meta: responseData?.meta || defaultMeta,
      }
    }

    if (response.status === 401) {
      const isLoginRequest = endpoint.toLowerCase().includes('/login')

      return {
        success: false,
        message:
          responseData?.message ||
          (isLoginRequest ? 'بيانات الدخول غير صحيحة' : 'انتهت الجلسة، يرجى تسجيل الدخول'),
        data: null as unknown as T,
        errors: responseData?.errors || [{ field: 'auth', message: 'Unauthorized' }],
        meta: responseData?.meta || defaultMeta,
      }
    }

    if (response.status === 403) {
      return {
        success: false,
        message: responseData?.message || 'ليس لديك صلاحية للقيام بهذا الإجراء',
        data: null as unknown as T,
        errors: responseData?.errors || [{ field: 'auth', message: 'Forbidden' }],
        meta: responseData?.meta || defaultMeta,
      }
    }

    return responseData as unknown as BaseApiResponse<T>
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
