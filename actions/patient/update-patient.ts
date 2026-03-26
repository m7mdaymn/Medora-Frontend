'use server'

import { BaseApiResponse } from '@/types/api'
import { IPatient } from '@/types/patient'
import { UpdatePatientInput } from '@/validation/patient' // استخدمنا سكيما التعديل
import { revalidatePath } from 'next/cache'
import { fetchApi } from '../../lib/fetchApi'

/**
 * تحديث بيانات المريض الأساسية
 */
export async function updatePatientAction(
  id: string,
  data: UpdatePatientInput,
  tenantSlug: string,
): Promise<BaseApiResponse<IPatient>> {
  // 🔴 استخدمنا الـ fetchApi عشان هي اللي بتهندل التوكن والـ X-Tenant
  const result = await fetchApi<IPatient>(`/api/clinic/patients/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
    tenantSlug,
    authType: 'staff', //
  })

  // لو العملية نجحت، بنعمل Revalidate عشان البيانات تتحدث في الـ Client
  if (result.success) {
    revalidatePath(`/${tenantSlug}/dashboard/patients`)
    revalidatePath(`/${tenantSlug}/dashboard/patients/${id}`)
  }

  return result
}
