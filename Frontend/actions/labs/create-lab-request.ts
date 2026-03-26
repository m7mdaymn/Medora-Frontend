'use server'

import { revalidatePath } from 'next/cache'
import { fetchApi } from '../../lib/fetchApi'
import { BaseApiResponse } from '../../types/api'
import { ILabRequest } from '../../types/visit'
import { LabRequestFormInput } from '../../validation/labs'

export const createLabRequestAction = async (
  tenantSlug: string,
  visitId: string,
  data: LabRequestFormInput,
): Promise<BaseApiResponse<ILabRequest>> => {
  try {
    const result = await fetchApi<ILabRequest>(`/api/clinic/visits/${visitId}/labs`, {
      method: 'POST',
      body: JSON.stringify(data),
      headers: {
        'Content-Type': 'application/json',
        'X-Tenant': tenantSlug,
      },
    })

    if (result.success) {
      revalidatePath(`/${tenantSlug}/dashboard/doctor/visits/${visitId}`)
    }

    return result
  } catch (error) {
    console.error('Error creating lab request:', error)
    return {
      success: false,
      message: 'فشل في إضافة طلب التحليل/الأشعة',
      data: null,
      errors: [],
      meta: { timestamp: new Date().toISOString(), requestId: '' },
    }
  }
}
