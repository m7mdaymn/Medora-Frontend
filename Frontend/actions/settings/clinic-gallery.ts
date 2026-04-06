'use server'

import { fetchApi } from '@/lib/fetchApi'
import { BaseApiResponse } from '@/types/api'
import { revalidatePath } from 'next/cache'

export interface IClinicGalleryImage {
  id: string
  category: string
  publicUrl: string
  contentType: string
  fileSizeBytes: number
  originalFileName: string
  createdAt: string
}

export async function getClinicGalleryAction(
  tenantSlug: string,
): Promise<BaseApiResponse<IClinicGalleryImage[]>> {
  return await fetchApi<IClinicGalleryImage[]>('/api/clinic/media/clinic-gallery', {
    method: 'GET',
    tenantSlug,
    authType: 'staff',
    cache: 'no-store',
  })
}

export async function uploadClinicGalleryImageAction(
  tenantSlug: string,
  formData: FormData,
): Promise<BaseApiResponse<IClinicGalleryImage>> {
  const result = await fetchApi<IClinicGalleryImage>('/api/clinic/media/clinic-gallery', {
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

export async function deleteClinicGalleryImageAction(
  tenantSlug: string,
  mediaId: string,
): Promise<BaseApiResponse<null>> {
  const result = await fetchApi<null>(`/api/clinic/media/clinic-gallery/${mediaId}`, {
    method: 'DELETE',
    tenantSlug,
    authType: 'staff',
  })

  if (result.success) {
    revalidatePath(`/${tenantSlug}/dashboard/settings`)
  }

  return result
}
