'use server'

import { fetchApi } from '@/lib/fetchApi'
import { BaseApiResponse } from '@/types/api'
import { ICreatePatientResponse } from '@/types/patient'
import { CreatePatientInput } from '@/validation/patient'
import { revalidatePath } from 'next/cache'
import { getBranchesAction } from '@/actions/branch/branches'
import { cookies } from 'next/headers'

function buildErrorResponse(message: string): BaseApiResponse<ICreatePatientResponse> {
  return {
    success: false,
    message,
    data: null,
    errors: [{ field: 'branchId', message }],
    meta: {
      timestamp: new Date().toISOString(),
      requestId: '',
    },
  }
}

export async function createPatientAction(
  data: CreatePatientInput,
  tenantSlug: string,
): Promise<BaseApiResponse<ICreatePatientResponse>> {
  const cookieStore = await cookies()
  const selectedBranchId = cookieStore.get(`selected_branch_${tenantSlug}`)?.value?.trim()
  const requestedBranchId = data.branchId?.trim()
  const resolvedBranchId = selectedBranchId || requestedBranchId

  if (!resolvedBranchId) {
    return buildErrorResponse('يجب اختيار الفرع قبل إنشاء المريض')
  }

  const branchesRes = await getBranchesAction(tenantSlug, false)
  const activeBranches = branchesRes.success
    ? (branchesRes.data ?? []).filter((branch) => branch.isActive)
    : []

  if (activeBranches.length > 0) {
    const isAllowed = activeBranches.some((branch) => branch.id === resolvedBranchId)
    if (!isAllowed) {
      return buildErrorResponse('الفرع المحدد غير متاح لهذا الحساب')
    }
  }

  const payload = {
    name: data.name,
    phone: data.phone,
    gender: data.gender,
    dateOfBirth: data.dateOfBirth,
    address: data.address,
    notes: data.notes,
    branchId: resolvedBranchId,
  }

  const res = await fetchApi<ICreatePatientResponse>('/api/clinic/patients', {
    method: 'POST',
    tenantSlug,
    authType: 'staff',
    body: JSON.stringify(payload),
  })

  // لو العملية نجحت، بنعمل تصفير للكاش بتاع صفحة المرضى
  if (res.success) {
    revalidatePath(`/${tenantSlug}/dashboard/patients`)
  }

  return res
}
