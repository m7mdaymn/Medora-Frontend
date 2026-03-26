'use server'

import { fetchApi } from '@/lib/fetchApi'
import { IPaginatedData } from '@/types/api'
import { IDoctor } from '@/types/doctor'

// التايب الجديد بيرجع الدكاترة ولستة التخصصات
export async function getDoctorsAction(
  tenantSlug: string,
): Promise<{ doctors: IDoctor[]; specialties: string[] }> {
  const res = await fetchApi<IPaginatedData<IDoctor>>(
    '/api/clinic/doctors?pageNumber=1&pageSize=1000',
    {
      method: 'GET',
      tenantSlug,
      cache: 'no-store',
    },
  )

  // تأمين لو مفيش داتا
  if (!res.success || !res.data) {
    return { doctors: [], specialties: [] }
  }

  const doctors = res.data.items

  // الحركة الروشة: استخراج التخصصات في السيرفر
  // ضمجنا الـ filter(Boolean) جوه عشان نشيل الـ null/undefined قبل ما نحطها في الـ Set
  const specialties = Array.from(
    new Set(doctors.map((d) => d.specialty).filter(Boolean)),
  ) as string[]

  return { doctors, specialties }
}
