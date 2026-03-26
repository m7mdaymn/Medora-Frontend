'use server'

import { cookies } from 'next/headers'
import { fetchApi } from '../../lib/fetchApi'
import { ILogin } from '../../types/auth' // تأكد من مسار الـ Interface بتاعك
import { LoginInput } from '../../validation/login'

export async function loginAction(values: LoginInput, tenantSlug: string) {
  // 1. استخدام الـ Wrapper الموحد
  const result = await fetchApi<ILogin>('/api/Auth/login', {
    method: 'POST',
    body: JSON.stringify(values),
    tenantSlug, // الـ fetchApi هيتعامل ويحطه في هيدر X-Tenant
    cache: 'no-store', // عشان نضمن إن الريكويست ميتعملوش كاش بالغلط
  })

  // 2. معالجة الرد الموحد
  if (!result.success || !result.data) {
    return { success: false, message: result.message || 'فشل تسجيل الدخول' }
  }

  // 3. الفلترة الأمنية للـ Token (Defensive Programming)
  try {
    const token = result.data.token
    const payloadBase64 = token.split('.')[1]
    const payload = JSON.parse(Buffer.from(payloadBase64, 'base64').toString())
    const role =
      payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] || payload.role

    // منع المريض من دخول لوحة الموظفين
    if (role === 'Patient') {
      return {
        success: false,
        message: 'هذا الحساب خاص بمريض. يرجى تسجيل الدخول من بوابة المرضى.',
      }
    }
  } catch (error) {
    return { success: false, message: 'استجابة غير صالحة من الخادم (التوكن تالف)' }
  }

  // 4. زرع الجلسة بطريقة معزولة
  const cookieStore = await cookies()

  // تنظيف أي جلسة مريض سابقة لمنع التضارب
  cookieStore.delete('patient_token')

cookieStore.set('token', result.data.token, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  path: `/`,
  maxAge: 30 * 24 * 60 * 60,
})


if (result.data.refreshToken) {
  cookieStore.set('refreshToken', result.data.refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: `/`,
    maxAge: 30 * 24 * 60 * 60, // خليه يعيش نفس المدة أو أكتر
  })
}


  return { success: true, data: result.data }
}
