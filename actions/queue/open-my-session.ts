'use server'

import { fetchApi } from '@/lib/fetchApi'
import { BaseApiResponse } from '@/types/api'
import { IDoctor } from '@/types/doctor'
import { IQueueSession } from '@/types/queue'
import { revalidatePath } from 'next/cache'

// تعريف استجابة الـ Auth
interface AuthMeResponse {
  id: string
  role: string
}

// تعريف استجابة قائمة الأطباء
interface PagedDoctors {
  items: IDoctor[]
}

export async function openMySessionAction(
  tenantSlug: string,
): Promise<BaseApiResponse<IQueueSession>> {
  // 1. مين اليوزر اللي فاتح دلوقتي؟
  const meRes = await fetchApi<AuthMeResponse>('/api/auth/me', { tenantSlug })

  // 2. نجيب لستة الدكاترة
  const doctorsRes = await fetchApi<PagedDoctors>('/api/clinic/doctors', { tenantSlug })

  // 3. نربط اليوزر الحالي بملف الدكتور بتاعه عشان نطلع الـ doctorId
  const currentUserId = meRes.data?.id
  const myDoctorProfile = doctorsRes.data?.items?.find((d) => d.userId === currentUserId)

  // حماية (Defensive Check)
  if (!myDoctorProfile?.id) {
    return {
      success: false,
      message: 'لم يتم العثور على ملف الطبيب الخاص بك لربطه بالجلسة',
      data: null as unknown as IQueueSession,
      errors: [{ field: 'doctorId', message: 'Doctor profile not found' }],
      meta: { timestamp: new Date().toISOString(), requestId: '' },
    }
  }

  // 4. نبعت الريكويست للباك إند بالـ ID الصريح
  const res = await fetchApi<IQueueSession>('/api/clinic/queue/sessions', {
    method: 'POST',
    tenantSlug,
    body: JSON.stringify({
      doctorId: myDoctorProfile.id,
      notes: 'تم فتح الجلسة بواسطة الطبيب مباشرة',
    }),
  })

  if (res.success) {
    revalidatePath(`/${tenantSlug}/dashboard/doctor/queue`)
  }

  return res
}
