'use server'

import { fetchApi } from '@/lib/fetchApi'
import { BaseApiResponse, IPaginatedData } from '@/types/api'
import { IClinicService } from '@/types/services' // تأكد من مسار التايب
import { ClinicServiceInput } from '@/validation/services'
import { revalidatePath } from 'next/cache'

// 1. جلب الخدمات (GET)
export async function getClinicServicesAction(
  tenantSlug: string,
  pageNumber: number = 1,
  pageSize: number = 20,
  activeOnly?: boolean,
): Promise<IPaginatedData<IClinicService> | null> {
  const params = new URLSearchParams({
    pageNumber: pageNumber.toString(),
    pageSize: pageSize.toString(),
  })
  if (activeOnly !== undefined) params.set('activeOnly', activeOnly.toString())

  const res = await fetchApi<IPaginatedData<IClinicService>>(
    `/api/clinic/services?${params.toString()}`,
    {
      method: 'GET',
      tenantSlug,
      cache: 'no-store',
    },
  )
  return res.success ? res.data : null
}

// 2. إنشاء خدمة (POST)
export async function createClinicServiceAction(
  tenantSlug: string,
  data: ClinicServiceInput,
): Promise<BaseApiResponse<IClinicService>> {
  const res = await fetchApi<IClinicService>('/api/clinic/services', {
    method: 'POST',
    tenantSlug,
    body: JSON.stringify(data),
  })
  if (res.success) revalidatePath(`/${tenantSlug}/dashboard/services`)
  return res
}

// 3. تعديل خدمة (PATCH)
export async function updateClinicServiceAction(
  tenantSlug: string,
  id: string,
  data: ClinicServiceInput,
): Promise<BaseApiResponse<IClinicService>> {
  const res = await fetchApi<IClinicService>(`/api/clinic/services/${id}`, {
    method: 'PATCH',
    tenantSlug,
    body: JSON.stringify(data),
  })
  if (res.success) revalidatePath(`/${tenantSlug}/dashboard/services`)
  return res
}

// 4. حذف خدمة (DELETE)
export async function deleteClinicServiceAction(
  tenantSlug: string,
  id: string,
): Promise<BaseApiResponse<boolean>> {
  const res = await fetchApi<boolean>(`/api/clinic/services/${id}`, {
    method: 'DELETE',
    tenantSlug,
  })
  if (res.success) revalidatePath(`/${tenantSlug}/dashboard/services`)
  return res
}
