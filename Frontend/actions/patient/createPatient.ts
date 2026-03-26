'use server'

import { fetchApi } from '@/lib/fetchApi'
import { ICreatePatientResponse } from '@/types/patient'
import { CreatePatientInput } from '@/validation/patient'
import { revalidatePath } from 'next/cache' 

export async function createPatientAction(data: CreatePatientInput, tenantSlug: string) {
  const res = await fetchApi<ICreatePatientResponse>('/api/clinic/patients', {
    method: 'POST',
    tenantSlug,
    authType: 'staff',
    body: JSON.stringify(data),
  })

  // لو العملية نجحت، بنعمل تصفير للكاش بتاع صفحة المرضى
  if (res.success) {
    revalidatePath(`/${tenantSlug}/dashboard/patients`)
  }

  return res
}
