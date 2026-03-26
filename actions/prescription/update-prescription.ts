'use server'

import { revalidatePath } from 'next/cache'
import { fetchApi } from '../../lib/fetchApi'
import { PrescriptionFormInput } from '../../validation/prescription'

export const updatePrescriptionAction = async (
  tenantSlug: string,
  visitId: string,
  prescriptionId: string,
  data: PrescriptionFormInput,
) => {
  try {
    const result = await fetchApi(`/api/clinic/visits/${visitId}/prescriptions/${prescriptionId}`, {
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
    return { success: false, message: 'فشل في تعديل الدواء' }
  }
}
