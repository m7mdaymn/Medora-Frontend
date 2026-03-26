'use server'

import { revalidatePath } from 'next/cache'
import { fetchApi } from '../../lib/fetchApi'

export const deletePrescriptionAction = async (
  tenantSlug: string,
  visitId: string,
  prescriptionId: string,
) => {
  try {
    const result = await fetchApi(`/api/clinic/visits/${visitId}/prescriptions/${prescriptionId}`, {
      method: 'DELETE',
      headers: { 'X-Tenant': tenantSlug },
    })

    if (result.success) {
      revalidatePath(`/${tenantSlug}/dashboard/doctor/visits/${visitId}`)
    }
    return result
  } catch (error) {
    return { success: false, message: 'فشل في حذف الدواء' }
  }
}
