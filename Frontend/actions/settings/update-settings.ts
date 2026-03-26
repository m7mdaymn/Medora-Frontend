'use server'

import { fetchApi } from '@/lib/fetchApi'
import { IClinicSettings } from '@/types/settings'
import { UpdateSettingsInput } from '@/validation/settings'
import { revalidatePath } from 'next/cache'

export async function updateClinicSettings(tenantSlug: string, data: UpdateSettingsInput) {
  const response = await fetchApi<IClinicSettings>(`/api/clinic/settings`, {
    method: 'PUT',
    tenantSlug,
    body: JSON.stringify(data),
  })

  if (response.success) {
    revalidatePath(`/${tenantSlug}/dashboard/settings`)
  }

  return response
}
