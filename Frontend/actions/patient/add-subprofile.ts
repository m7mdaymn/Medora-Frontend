'use server'

import { revalidatePath } from 'next/cache'
import { fetchApi } from '@/lib/fetchApi'
import { BaseApiResponse } from '@/types/api'
import { ISubProfile } from '@/types/patient'
import { CreateSubPatientInput } from '@/validation/patient'

export async function addSubProfileAction(
  tenantSlug: string,
  parentId: string,
  values: CreateSubPatientInput,
): Promise<BaseApiResponse<ISubProfile>> {
  // تحويل التاريخ لـ ISO String عشان الباك-إند
  const formattedData = {
    ...values,
    dateOfBirth: new Date(values.dateOfBirth).toISOString(),
  }

  const res = await fetchApi<ISubProfile>(`/api/clinic/patients/${parentId}/profiles`, {
    method: 'POST',
    tenantSlug, // الـ fetchApi بتاعتك بتهندل الـ X-Tenant لوحده لما بتباصيه هنا
    body: JSON.stringify(formattedData),
  })

  if (res.success) {
    revalidatePath(`/${tenantSlug}/dashboard/patients`)
  }

  return res
}
