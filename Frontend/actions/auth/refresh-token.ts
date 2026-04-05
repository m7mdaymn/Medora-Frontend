'use server'

import { cookies } from 'next/headers'
import { fetchApi } from '@/lib/fetchApi'

// بناءً على هيكلة الـ Swagger بتاعك
export interface IRefreshTokenResponse {
  token: string
  refreshToken: string
}

export async function refreshAccessToken(tenantSlug?: string): Promise<string | null> {
  const cookieStore = await cookies()
  const refreshToken = cookieStore.get('refreshToken')?.value

  // لو مفيش refresh token من الأساس، مفيش داعي للريفرش
  if (!refreshToken) return null

  try {
    const result = await fetchApi<IRefreshTokenResponse>(`/api/auth/refresh`, {
      method: 'POST',
      tenantSlug,
      body: JSON.stringify({ refreshToken }),
      cache: 'no-store',
    })

    if (!result.success || !result.data) {
      return null
    }

    const newTokens = result.data

    // زراعة التوكنات الجديدة في الكوكيز
    cookieStore.set('token', newTokens.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 30 * 24 * 60 * 60,
    })

    cookieStore.set('refreshToken', newTokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 30 * 24 * 60 * 60,
    })

    return newTokens.token
  } catch {
    return null
  }
}
