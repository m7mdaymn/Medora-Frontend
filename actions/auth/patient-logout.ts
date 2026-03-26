'use server'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export async function patientLogoutAction(tenantSlug: string) {
  const cookieStore = await cookies()

  cookieStore.delete({
    name: `patient_token_${tenantSlug}`,
    path: `/${tenantSlug}`,
  })

  redirect(`/${tenantSlug}/patient/login`)
}
