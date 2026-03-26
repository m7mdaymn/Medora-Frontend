'use server'

import { fetchApi } from '@/lib/fetchApi'
import { BaseApiResponse } from '@/types/api'
import { IStaff } from '@/types/staff'
import { revalidatePath } from 'next/cache'
import { CreateStaffInput } from '../../validation/staff'

export async function createStaffAction(
  data: CreateStaffInput,
  tenantSlug: string,
): Promise<BaseApiResponse<IStaff>> {
  const res = await fetchApi<IStaff>('/api/clinic/staff', {
    method: 'POST',
    body: JSON.stringify(data), 
    tenantSlug,
  })

  if (res.success) {
    revalidatePath(`/${tenantSlug}/dashboard/staff`)
  }

  return res
}
