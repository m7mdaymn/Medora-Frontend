'use server'

import { fetchApi } from '@/lib/fetchApi' // 👈 عدل المسار حسب مكان الملف الأسطوري بتاعك
import { BaseApiResponse } from '@/types/api'
import { IVisit } from '@/types/visit'

type PaginatedVisits = {
  items: IVisit[]
}

export async function getMyTodayVisitsAction(
  tenantSlug: string,
): Promise<BaseApiResponse<IVisit[]>> {
  const today = new Date()
  const dateOnly = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

  // endpoint contract: /api/clinic/visits/my مع فلترة اليوم الحالي
  const result = await fetchApi<PaginatedVisits>(
    `/api/clinic/visits/my?fromDate=${dateOnly}&toDate=${dateOnly}&pageNumber=1&pageSize=100`,
    {
      method: 'GET',
      tenantSlug,
      cache: 'no-store', // عشان يجيب داتا لايف دايماً
    },
  )

  if (!result.success) {
    return {
      ...result,
      data: null,
    }
  }

  return {
    ...result,
    data: result.data?.items || [],
  }
}
