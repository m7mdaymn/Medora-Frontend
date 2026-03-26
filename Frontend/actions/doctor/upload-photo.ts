'use server'

import { fetchApi } from '@/lib/fetchApi'
import { BaseApiResponse } from '@/types/api'
import { revalidatePath } from 'next/cache'

export async function uploadDoctorPhotoAction(
  tenantSlug: string,
  doctorId: string,
  formData: FormData,
): Promise<BaseApiResponse<{ publicUrl: string }>> {
  const result = await fetchApi<{ publicUrl: string }>(
    `/api/clinic/media/doctors/${doctorId}/photo`,
    {
      method: 'POST',
      tenantSlug,
      authType: 'staff',
      body: formData,
    },
  )

  if (result.success) {
    revalidatePath(`/${tenantSlug}/dashboard/doctors`)
  }

  return result
}
