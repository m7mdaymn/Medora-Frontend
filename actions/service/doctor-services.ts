'use server'

import { fetchApi } from '@/lib/fetchApi'
import { BaseApiResponse } from '@/types/api'
import { IDoctorServiceLink } from '@/types/services'
import { revalidatePath } from 'next/cache'

// 1. جلب الخدمات المربوطة بدكتور معين
export async function getDoctorLinksAction(
  tenantSlug: string,
  doctorId: string,
): Promise<IDoctorServiceLink[]> {
  if (!doctorId) return []

  const res = await fetchApi<IDoctorServiceLink[]>(
    `/api/clinic/services/doctors/${doctorId}/links`,
    { method: 'GET', tenantSlug, cache: 'no-store' },
  )
  return res.success && res.data ? res.data : []
}

// 2. ربط خدمة أو تعديل تسعيرها (Upsert - PUT)
export async function upsertDoctorLinkAction(
  tenantSlug: string,
  doctorId: string,
  clinicServiceId: string,
  data: {
    overridePrice: number | null
    overrideDurationMinutes: number | null
    isActive: boolean
  },
): Promise<BaseApiResponse<IDoctorServiceLink>> {
  const res = await fetchApi<IDoctorServiceLink>(
    `/api/clinic/services/doctors/${doctorId}/links/${clinicServiceId}`,
    {
      method: 'PUT',
      tenantSlug,
      body: JSON.stringify(data),
    },
  )
  if (res.success) revalidatePath(`/${tenantSlug}/dashboard/services`)
  return res
}

// 3. فك الربط (DELETE)
export async function deleteDoctorLinkAction(
  tenantSlug: string,
  doctorId: string,
  clinicServiceId: string,
): Promise<BaseApiResponse<boolean>> {
  const res = await fetchApi<boolean>(
    `/api/clinic/services/doctors/${doctorId}/links/${clinicServiceId}`,
    { method: 'DELETE', tenantSlug },
  )
  if (res.success) revalidatePath(`/${tenantSlug}/dashboard/services`)
  return res
}
