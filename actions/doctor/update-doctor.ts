'use server'

import { fetchApi } from '@/lib/fetchApi'
import { BaseApiResponse } from '@/types/api'
import { IDoctor } from '@/types/doctor' // التايب بتاعك
import { UpdateDoctorInput } from '@/validation/doctor'
import { revalidatePath } from 'next/cache'

export async function updateDoctorAction(
  id: string,
  tenantSlug: string,
  data: UpdateDoctorInput,
): Promise<BaseApiResponse<IDoctor>> {
  const response = await fetchApi<IDoctor>(`/api/clinic/doctors/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
    tenantSlug,
  })

  if (response.success) {
    revalidatePath(`/${tenantSlug}/dashboard/doctors`)
  }

  return response
}
