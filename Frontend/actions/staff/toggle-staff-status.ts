'use server'

import { fetchApi } from '@/lib/fetchApi'
import { BaseApiResponse } from '@/types/api'
import { revalidatePath } from 'next/cache'

// التايب هنا <null> أو <any> لأن الـ Toggle غالباً مابيرجعش داتا، بيرجع رسالة نجاح بس
export async function toggleStaffStatusAction(
  staffId: string,
  isEnabled: boolean,
  tenantSlug: string,
): Promise<BaseApiResponse<null>> {
  // بنحدد الـ Endpoint زي ما كنت عامل
  const action = isEnabled ? 'enable' : 'disable'

  const res = await fetchApi<null>(`/api/clinic/staff/${staffId}/${action}`, {
    method: 'POST',
    tenantSlug,
  })

  if (res.success) {
    revalidatePath(`/${tenantSlug}/dashboard/staff`)
    res.message = isEnabled ? 'تم تفعيل حساب الموظف بنجاح' : 'تم إيقاف حساب الموظف'
  }

  return res
}
