'use server'

import { revalidatePath } from 'next/cache'
import { BaseApiResponse } from '@/types/api'
import { fetchApi } from '@/lib/fetchApi'

export async function deletePatientAction(
  id: string,
  tenantSlug: string,
): Promise<BaseApiResponse<null>> {
  const result = await fetchApi<null>(`/api/clinic/patients/${id}`, {
    method: 'DELETE',
    tenantSlug,
    authType: 'staff',
  })

  if (result.success) {
    revalidatePath(`/${tenantSlug}/dashboard/patients`)
  }

  return result
}
