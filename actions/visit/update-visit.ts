'use server'

import { revalidatePath } from 'next/cache'
import { fetchApi } from '../../lib/fetchApi' 
import { BaseApiResponse } from '../../types/api'
import { IVisit } from '../../types/visit'
import { ClinicalFormInput } from '../../validation/visit'

export const updateVisit = async (
  tenantSlug: string,
  visitId: string,
  data: ClinicalFormInput,
): Promise<BaseApiResponse<IVisit>> => {
  try {

    const result = await fetchApi<IVisit>(`/api/clinic/visits/${visitId}`, {
      method: 'PUT',
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

    console.error('Error updating clinical data:', error)

    return {
      success: false,
      message: 'حدث خطأ أثناء حفظ البيانات السريرية، يرجى المحاولة لاحقاً',
      data: null,
      errors: [],
      meta: { timestamp: new Date().toISOString(), requestId: '' },
    }
  }
}
