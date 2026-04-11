'use server'

import { fetchApi } from '@/lib/fetchApi'
import { BaseApiResponse } from '@/types/api'
import { IStaff } from '@/types/staff'
import { revalidatePath } from 'next/cache'
import { CreatePayrollWorkerInput, CreateStaffInput } from '../../validation/staff'

export async function createStaffAction(
  data: CreateStaffInput,
  tenantSlug: string,
): Promise<BaseApiResponse<IStaff>> {
  const payload = {
    ...data,
    phone: data.phone.trim(),
    notes: data.notes?.trim() || undefined,
  }

  const res = await fetchApi<IStaff>('/api/clinic/staff', {
    method: 'POST',
    body: JSON.stringify(payload),
    tenantSlug,
  })

  if (res.success) {
    revalidatePath(`/${tenantSlug}/dashboard/staff`)
  }

  return res
}

export async function createPayrollOnlyWorkerAction(
  data: CreatePayrollWorkerInput,
  tenantSlug: string,
): Promise<BaseApiResponse<IStaff>> {
  const payload = {
    ...data,
    phone: data.phone.trim(),
    notes: data.notes?.trim() || undefined,
  }

  const res = await fetchApi<IStaff>('/api/clinic/staff/payroll-only', {
    method: 'POST',
    body: JSON.stringify(payload),
    tenantSlug,
  })

  if (res.success) {
    revalidatePath(`/${tenantSlug}/dashboard/staff`)
  }

  return res
}
