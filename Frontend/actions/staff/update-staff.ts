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
  const payload = {
    name: data.name,
    phone: data.phone.trim() || undefined,
    salary: data.salary,
    hireDate: data.hireDate?.trim() || undefined,
    notes: data.notes?.trim() || undefined,
    branchIds: data.branchIds,
  }

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

export async function patchStaffAction(
  data: Partial<UpdateStaffInput> & { id: string },
  tenantSlug: string,
): Promise<BaseApiResponse<IStaff>> {
  const { id, ...payload } = data

  const res = await fetchApi<IStaff>(`/api/clinic/staff/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
    tenantSlug,
  })

  if (res.success) {
    revalidatePath(`/${tenantSlug}/dashboard/staff`)
  }

  return res
}
