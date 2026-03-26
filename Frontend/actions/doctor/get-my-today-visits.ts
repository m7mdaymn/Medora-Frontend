'use server'

import { fetchApi } from '@/lib/fetchApi' // 👈 عدل المسار حسب مكان الملف الأسطوري بتاعك
import { BaseApiResponse } from '@/types/api'
import { IVisit } from '@/types/visit'

export async function getMyTodayVisitsAction(
  tenantSlug: string,
): Promise<BaseApiResponse<IVisit[]>> {
  // الـ fetchApi هيتولى حقن التوكين، والـ X-Tenant، وهندلة الإيرورز لوحده!
  return await fetchApi<IVisit[]>('/api/clinic/visits/my/today', {
    method: 'GET',
    tenantSlug,
    cache: 'no-store', // عشان يجيب داتا لايف دايماً
  })
}
