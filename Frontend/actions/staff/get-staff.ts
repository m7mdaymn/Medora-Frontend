'use server'

import { fetchApi } from '@/lib/fetchApi'
import { IPaginatedData } from '@/types/api'
import { IStaff } from '@/types/staff'

export async function getAllStaffAction(tenantSlug: string): Promise<IStaff[]> {
  // بنضرب رقم كبير في الـ pageSize عشان نجيب الداتابيز كلها خبطة واحدة
  const query = new URLSearchParams({
    pageNumber: '1',
    pageSize: '1000',
  })

  // بنكلم الباك إند بالتايبس بتاعته
  const res = await fetchApi<IPaginatedData<IStaff>>(`/api/clinic/staff?${query}`, {
    method: 'GET',
    tenantSlug,
    cache: 'no-store',
  })

  // لو فشل أو مفيش داتا، بنرجع مصفوفة فاضية
  if (!res.success || !res.data) {
    return []
  }

  // بنستخلص الـ items بس ونرمي الباقي
  return res.data.items
}
