'use server'

import { fetchApi } from '@/lib/fetchApi'
import { BaseApiResponse } from '@/types/api'
import { IVisit } from '@/types/visit'

export async function getPatientVisitsAction(
  tenantSlug: string,
  patientId: string,
): Promise<BaseApiResponse<{ items: IVisit[] } | null>> {
  try {
    const response = await fetchApi<{ items: IVisit[] }>(
      `/api/clinic/patients/${patientId}/visits?pageNumber=1&pageSize=1`,
      {
        method: 'GET',
        tenantSlug,
      },
    )

    return response
  } catch (error) {
    console.error('[GET_PATIENT_VISITS_ERROR]:', error)
    return {
      success: false,
      message: 'فشل في جلب تاريخ زيارات المريض',
      data: null,
      errors: [],
      meta: {
        timestamp: new Date().toISOString(),
        requestId: '',
      },
    }
  }
}
