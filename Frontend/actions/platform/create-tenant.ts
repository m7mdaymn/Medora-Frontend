'use server'

import { fetchApi } from '@/lib/fetchApi'
import { BaseApiResponse } from '@/types/api'
import { ITenant } from '@/types/platform'
import { revalidatePath } from 'next/cache'
import { CreateTenantInput } from '@/validation/tenant'

export async function createTenantAction(
  data: CreateTenantInput,
): Promise<BaseApiResponse<ITenant>> {
  const res = await fetchApi<ITenant>('/api/platform/tenants', {
    method: 'POST',
    body: JSON.stringify(data),
  })

  if (res.success) {
    revalidatePath('/admin/tenants')
  }

  return res
}
