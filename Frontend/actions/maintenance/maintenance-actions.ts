'use server'

import { fetchApi } from '@/lib/fetchApi'
import { BaseApiResponse } from '@/types/api'
import { revalidatePath } from 'next/cache'
import { IStaleVisit, IVisit } from '../../types/visit'


// 2. أكشن جلب الزيارات المعلقة
export const getStaleVisitsAction = async (
  tenantSlug: string,
  olderThanHours: number = 12,
): Promise<BaseApiResponse<IStaleVisit[]>> => {
  return await fetchApi<IStaleVisit[]>(
    `/api/clinic/visits/maintenance/stale-open?olderThanHours=${olderThanHours}`,
    {
      method: 'GET',
      tenantSlug,
    },
  )
}

// 3. أكشن الإغلاق الإداري الإجباري
export const closeStaleVisitAction = async (
  tenantSlug: string,
  visitId: string,
  notes: string,
  markNoShow: boolean = true,
): Promise<BaseApiResponse<IVisit>> => {
  try {
    const result = await fetchApi<IVisit>(`/api/clinic/visits/maintenance/${visitId}/close`, {
      method: 'POST',
      tenantSlug,
      body: JSON.stringify({
        resolutionNote: notes,
        markQueueTicketNoShow: markNoShow,
      }),
    })

    if (result.success) {
      revalidatePath(`/${tenantSlug}/dashboard`)
      revalidatePath(`/${tenantSlug}/dashboard/doctor/queue`)
    }

    return result
  } catch (error) {
    console.error('[MAINTENANCE_CLOSE_ERROR]:', error)
    return {
      success: false,
      message: 'فشل في تنفيذ الإغلاق الإداري',
      data: null,
      errors: [],
      meta: { timestamp: new Date().toISOString(), requestId: '' },
    }
  }
}
