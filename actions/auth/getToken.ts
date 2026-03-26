'use server'

import { cookies } from 'next/headers'

// ضفنا tenantSlug عشان نقرأ التوكن الخاص بالعيادة المحددة للـ PWA
export async function getToken(role: 'staff' | 'patient' = 'staff', tenantSlug?: string) {
  const cookieStore = await cookies()

  if (role === 'patient') {
    // لو مفيش عيادة متحددة، مش هنعرف نجيب التوكن
    if (!tenantSlug) return undefined

    // بناء اسم الكوكي ديناميكياً
    const cookieName = `patient_token_${tenantSlug}`
    return cookieStore.get(cookieName)?.value
  }

  if (role === 'staff') {
    return cookieStore.get('token')?.value
  }

  return undefined
}
