'use server'

import { fetchApi } from '@/lib/fetchApi'
import { BaseApiResponse } from '@/types/api'
import { IStaff } from '@/types/staff'
import { revalidatePath } from 'next/cache'
import { UpdateStaffInput } from '../../validation/staff'

export async function updateStaffAction(
  data: UpdateStaffInput,
  tenantSlug: string,
): Promise<BaseApiResponse<IStaff>> {
  // الـ Payload اللي هيتبعت للباك إند بدون الـ id وبدون الداتا اللي مش هتتعدل
  const payload = {
    name: data.name,
    phone: data.phone,
    salary: data.salary,
  }

  // الـ id بيتبعت في الـ URL هنا
  const res = await fetchApi<IStaff>(`/api/clinic/staff/${data.id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
    tenantSlug,
  })

  if (res.success) {
    revalidatePath(`/${tenantSlug}/dashboard/staff`)
  }

  return res
}
