'use server'

import { cookies } from 'next/headers'
import { BaseApiResponse } from '../../types/api'

// بناءً على هيكلة الـ Swagger بتاعك
export interface IRefreshTokenResponse {
  token: string
  refreshToken: string
}

export async function refreshAccessToken(tenantSlug?: string): Promise<string | null> {
  const cookieStore = await cookies()
  const refreshToken = cookieStore.get('refreshToken')?.value

  // لو مفيش توكن من الأساس، مفيش داعي للريفرش
  if (!refreshToken) return null

  try {
    const url = `${process.env.NEXT_PUBLIC_API_URL}/api/Auth/refresh`

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    }
    if (tenantSlug) {
      headers['X-Tenant'] = tenantSlug
    }

    const res = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({ refreshToken }),
      cache: 'no-store',
    })

    if (!res.ok) {
      return null
    }

    const result = (await res.json()) as BaseApiResponse<IRefreshTokenResponse>

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
  } catch (error) {
    return null
  }
}
