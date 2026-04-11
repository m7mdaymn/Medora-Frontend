'use server'

import { fetchApi } from '@/lib/fetchApi'
import { BaseApiResponse } from '@/types/api'
import { revalidatePath } from 'next/cache'

interface ClinicMediaUploadResult {
  id: string
  category: string
  publicUrl: string
  contentType: string
  fileSizeBytes: number
  originalFileName: string
  createdAt: string
}

export async function uploadClinicImageAction(
  tenantSlug: string,
  formData: FormData,
): Promise<BaseApiResponse<ClinicMediaUploadResult>> {
  const result = await fetchApi<ClinicMediaUploadResult>('/api/clinic/media/clinic-image', {
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
