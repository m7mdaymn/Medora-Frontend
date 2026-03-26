'use server'

import { fetchApi } from '@/lib/fetchApi'
import { BaseApiResponse } from '@/types/api'
import { UpdateFeatureFlagsInput } from '@/validation/feature-flags'
import { revalidatePath } from 'next/cache'
import { IFeatureFlags } from '../../types/feature-flags'

// جلب الفلاجز لعيادة معينة
export async function getTenantFlags(tenantId: string): Promise<BaseApiResponse<IFeatureFlags>> {
  return await fetchApi<IFeatureFlags>(`/api/platform/feature-flags/${tenantId}`)
}

// تحديث الفلاجز
export async function updateTenantFlags(
  tenantId: string,
  data: UpdateFeatureFlagsInput,
): Promise<BaseApiResponse<IFeatureFlags>> {
  const res = await fetchApi<IFeatureFlags>(`/api/platform/feature-flags/${tenantId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })

  if (res.success) {
    revalidatePath('/admin/tenants')
  }

  return res
}
