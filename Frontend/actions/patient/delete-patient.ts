'use server'

import { revalidatePath } from 'next/cache'
import { BaseApiResponse } from '@/types/api'
import { getToken } from '../auth/getToken'

export async function deletePatientAction(
  id: string,
  tenantSlug: string,
): Promise<BaseApiResponse<null>> {
  const token = await getToken()

  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/clinic/patients/${id}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
        'X-Tenant': tenantSlug,
      },
    })

    const result = await res.json()

    if (result.success) {
      revalidatePath(`/${tenantSlug}/dashboard/patients`)
    }

    return result as BaseApiResponse<null>
  } catch (error) {
    return {
      success: false,
      message: 'حدث خطأ أثناء محاولة حذف المريض',
      data: null,
      errors: [],
      meta: { timestamp: new Date().toISOString(), requestId: '' },
    }
  }
}
