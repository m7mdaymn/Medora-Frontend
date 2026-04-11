'use server'

import { cookies } from 'next/headers'

export interface AuthContextResult {
  token?: string
  selectedBranchId?: string
}

// Reads auth cookie context on the server for both staff and patient flows.
export async function getAuthContext(
  role: 'staff' | 'patient' = 'staff',
  tenantSlug?: string,
): Promise<AuthContextResult> {
  const cookieStore = await cookies()

  if (role === 'patient') {
    if (!tenantSlug) {
      return {}
    }

    const cookieName = `patient_token_${tenantSlug}`
    return {
      token: cookieStore.get(cookieName)?.value,
    }
  }

  if (role === 'staff') {
    return {
      token: cookieStore.get('token')?.value,
      selectedBranchId: tenantSlug
        ? cookieStore.get(`selected_branch_${tenantSlug}`)?.value
        : undefined,
    }
  }

  return {}
}

// ضفنا tenantSlug عشان نقرأ التوكن الخاص بالعيادة المحددة للـ PWA
export async function getToken(role: 'staff' | 'patient' = 'staff', tenantSlug?: string) {
  const auth = await getAuthContext(role, tenantSlug)
  return auth.token
}
