'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export async function logoutAction(tenantSlug: string) {
  const cookieStore = await cookies()

  cookieStore.delete('token')
  cookieStore.delete('refreshToken')

  redirect(`/${tenantSlug}/login`)
}
