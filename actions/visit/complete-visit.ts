'use server'

import { fetchApi } from '@/lib/fetchApi'
import { BaseApiResponse } from '@/types/api'
import { IVisit } from '@/types/visit'
import { revalidatePath } from 'next/cache'

export const completeVisitAction = async (
  tenantSlug: string,
  visitId: string,
  diagnosis?: string,
  notes?: string,
): Promise<BaseApiResponse<IVisit>> => {
  try {
    const result = await fetchApi<IVisit>(`/api/clinic/visits/${visitId}/complete`, {
      method: 'POST',
      body: JSON.stringify({
        diagnosis: diagnosis || '',
        notes: notes || '',
      }),
      headers: {
        'Content-Type': 'application/json',
        'X-Tenant': tenantSlug,
      },
    })

    if (result.success) {
      revalidatePath(`/${tenantSlug}/dashboard/doctor/queue`)
    }

    return result
  } catch (error) {
    console.error('[COMPLETE_VISIT_ERROR]:', error)
    return {
      success: false,
      message: 'فشل في إنهاء الزيارة',
      data: null,
      errors: [],
      meta: { timestamp: new Date().toISOString(), requestId: '' },
    }
  }
}
