'use server'

import { fetchApi } from '@/lib/fetchApi'
import { BaseApiResponse } from '@/types/api'
import { revalidatePath } from 'next/cache'

export async function uploadClinicLogoAction(
  tenantSlug: string,
  formData: FormData,
): Promise<BaseApiResponse<{ publicUrl: string }>> {
  const result = await fetchApi<{ publicUrl: string }>('/api/clinic/media/clinic-logo', {
    method: 'POST',
    tenantSlug,
    authType: 'staff',
    body: formData,
  })

  if (result.success) {
    revalidatePath(`/${tenantSlug}/dashboard/settings`)
  }

  return result
}
