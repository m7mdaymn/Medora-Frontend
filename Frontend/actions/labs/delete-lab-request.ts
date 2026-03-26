'use server'
import { revalidatePath } from 'next/cache'
import { fetchApi } from '../../lib/fetchApi'
import { BaseApiResponse } from '../../types/api'
import { ILabRequest } from '../../types/visit'

export const deleteLabRequestAction = async (
  tenantSlug: string,
  visitId: string,
  labId: string,
): Promise<BaseApiResponse<ILabRequest>> => {
  try {
    const result = await fetchApi<ILabRequest>(`/api/clinic/visits/${visitId}/labs/${labId}`, {
      method: 'DELETE',
      headers: {
        'X-Tenant': tenantSlug,
      },
    })

    if (result.success) {
      // تحديث البيانات فوراً في الصفحة
      revalidatePath(`/${tenantSlug}/dashboard/doctor/visits/${visitId}`)
    }

    return result
  } catch (error) {
    console.error('Error deleting lab request:', error)
    return {
      success: false,
      message: 'حدث خطأ أثناء محاولة حذف الطلب',
      data: null,
      errors: [],
      meta: { timestamp: new Date().toISOString(), requestId: '' },
    }
  }
}
