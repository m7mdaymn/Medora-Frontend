'use server'

import { fetchApi } from '@/lib/fetchApi'
import { BaseApiResponse } from '@/types/api'
import { IDoctor } from '@/types/doctor'
import { revalidatePath } from 'next/cache'
import * as v from 'valibot'
import { CreateDoctorInput, CreateDoctorSchema } from '../../validation/doctor' // ضفنا السكيما هنا

export async function createDoctorAction(
  data: CreateDoctorInput,
  tenantSlug: string,
): Promise<BaseApiResponse<IDoctor>> {
  // 1. Validation (خط الدفاع الأول في السيرفر)
  const validationResult = v.safeParse(CreateDoctorSchema, data)
  if (!validationResult.success) {
    return {
      success: false,
      message: 'بيانات غير صحيحة، يرجى المراجعة',
      data: null,
      errors: validationResult.issues.map((i) => ({
        field: i.path?.[0]?.key?.toString() || 'general',
        message: i.message,
      })),
      meta: {
        timestamp: new Date().toISOString(),
        requestId: '',
      },
    }
  }

  const res = await fetchApi<IDoctor>('/api/clinic/doctors', {
    method: 'POST',
    body: JSON.stringify(data),
    tenantSlug,
  })

  // 3. تحديث الكاش لو نجحنا
  if (res.success) {
    revalidatePath(`/${tenantSlug}/dashboard/doctors`)
  }

  return res
}
