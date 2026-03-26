'use server'

import { fetchApi } from '@/lib/fetchApi'
import { BaseApiResponse } from '@/types/api'
import { revalidatePath } from 'next/cache'
import { ITenant } from '../../types/platform'

export async function activateTenantAction(id: string): Promise<BaseApiResponse<ITenant>> {
  const res = await fetchApi<ITenant>(`/api/platform/tenants/${id}/activate`, { method: 'POST' })
  if (res.success) revalidatePath('/admin/tenants')
  return res
}

export async function suspendTenantAction(id: string): Promise<BaseApiResponse<ITenant>> {
  const res = await fetchApi<ITenant>(`/api/platform/tenants/${id}/suspend`, { method: 'POST' })
  if (res.success) revalidatePath('/admin/tenants')
  return res
}

export async function blockTenantAction(id: string): Promise<BaseApiResponse<ITenant>> {
  const res = await fetchApi<ITenant>(`/api/platform/tenants/${id}/block`, { method: 'POST' })
  if (res.success) revalidatePath('/admin/tenants')
  return res
}
