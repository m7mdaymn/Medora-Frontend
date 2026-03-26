'use server'

import { fetchApi } from '@/lib/fetchApi'
import { BaseApiResponse } from '@/types/api'
import { IDoctorVisitConfig } from '@/types/doctor'
import { revalidatePath } from 'next/cache'

// جلب إعدادات الدكتور الحالي
export async function getMyVisitFieldsAction(
  tenantSlug: string,
): Promise<BaseApiResponse<IDoctorVisitConfig>> {
  return await fetchApi<IDoctorVisitConfig>('/api/clinic/doctors/me/visit-fields', {
    method: 'GET',
    tenantSlug,
    cache: 'no-store',
  })
}

// تحديث إعدادات الدكتور الحالي
export async function updateMyVisitFieldsAction(
  tenantSlug: string,
  data: Record<string, boolean>,
): Promise<BaseApiResponse<IDoctorVisitConfig>> {
  const res = await fetchApi<IDoctorVisitConfig>('/api/clinic/doctors/me/visit-fields', {
    method: 'PUT',
    body: JSON.stringify(data),
    tenantSlug,
  })

  if (res.success) {
    // ريفاليديت عشان لو راح شاشة الكشف يلاقي الحقول اتغيرت فوراً
    revalidatePath(`/${tenantSlug}/dashboard/doctor/visits`)
  }

  return res
}
