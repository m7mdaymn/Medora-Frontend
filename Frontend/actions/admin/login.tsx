'use server'

import { fetchApi } from '@/lib/fetchApi'
import { cookies } from 'next/headers'
import { LoginInput } from '../../validation/login'
import { BaseApiResponse } from '../../types/api'
import { ILogin } from '../../types/auth'

export async function superAdminLoginAction(data: LoginInput): Promise<BaseApiResponse<ILogin>> {
  const res = await fetchApi<ILogin>('/api/Auth/login', {
    method: 'POST',
    body: JSON.stringify({
      ...data,
      portalType: 'Platform',
    }),
  })

  if (!res.success || !res.data) {
    return res
  }

  // 🔴 منطقة الحماية: فك التوكن بدون مكاتب خارجية
  try {
    const token = res.data.token
    const payloadBase64 = token.split('.')[1]
    // Next.js Server Actions شغالة في بيئة Node.js، فاستخدام Buffer متاح وسريع
    const payload = JSON.parse(Buffer.from(payloadBase64, 'base64').toString())

    // تأكد من اسم الـ claim عندك لو مختلف 
    const role =
      payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] || payload.role

    if (role !== 'SuperAdmin' && role !== 'Worker') {
      return {
        success: false,
        message: 'غير مصرح لك بالدخول كمدير نظام',
        data: null,
        errors: [{ field: 'auth', message: 'Unauthorized Role' }],
        meta: res.meta,
      }
    }
  } catch {
    return { success: false, message: 'توكن غير صالح', data: null, errors: [], meta: res.meta }
  }

  // ✅ لو وصلنا هنا يبقى هو فعلا SuperAdmin
  const cookieStore = await cookies()
  cookieStore.set('token', res.data.token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
  })

  return res
}
