'use server'

import { revalidatePath } from 'next/cache'
import { fetchApi } from '../../lib/fetchApi' // تأكد من المسار
import { BaseApiResponse } from '../../types/api'
import { IPrescription } from '../../types/visit'
import { PrescriptionFormInput } from '../../validation/prescription'

export const createPrescriptionAction = async (
  tenantSlug: string,
  visitId: string,
  data: PrescriptionFormInput,
): Promise<BaseApiResponse<IPrescription>> => {
  try {
    // 1. إرسال الطلب لإضافة الدواء
    const result = await fetchApi<IPrescription>(`/api/clinic/visits/${visitId}/prescriptions`, {
      method: 'POST',
      body: JSON.stringify(data),
      headers: {
        'Content-Type': 'application/json',
        'X-Tenant': tenantSlug,
      },
    })

    // 2. تحديث الكاش بتاع الصفحة عشان الدواء يظهر في الجدول فوراً
    if (result.success) {
      revalidatePath(`/${tenantSlug}/dashboard/doctor/visits/${visitId}`)
    }

    return result
  } catch (error) {
    console.error('Error creating prescription:', error)
    return {
      success: false,
      message: 'فشل في إضافة الدواء للروشتة',
      data: null ,
      errors: [],
      meta: { timestamp: new Date().toISOString(), requestId: '' },
    }
  }
}
