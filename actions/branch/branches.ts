'use server'

import { fetchApi } from '@/lib/fetchApi'
import { BaseApiResponse } from '@/types/api'
import { IBranch } from '@/types/branch'
import { IClinicPaymentMethod, IClinicPaymentOptions } from '@/types/settings'
import { IStaff } from '@/types/staff'
import { revalidatePath } from 'next/cache'

export interface IUpsertBranchPayload {
  name: string
  code?: string
  address?: string
  phone?: string
  isActive?: boolean
}

interface IReplaceClinicPaymentMethodPayload {
  branchId?: string
  methodName: string
  providerName?: string
  accountName?: string
  accountNumber?: string
  iban?: string
  walletNumber?: string
  instructions?: string
  isActive: boolean
  displayOrder: number
}

interface IAssignDoctorsToBranchResult {
  branchId: string
  requestedCount: number
  assignedCount: number
  skippedCount: number
  createdScheduleRows: number
  missingDoctorIds: string[]
}

export interface ICreateBranchWithSetupPayload extends IUpsertBranchPayload {
  paymentSourceBranchId?: string | null
  assignStaffIds?: string[]
  assignDoctorIds?: string[]
}

export interface ICreateBranchWithSetupResult {
  branch: IBranch
  paymentMethodsCopied: number
  staffAssigned: number
  staffFailed: number
  doctorAssignmentsRequested: number
  warnings: string[]
}

function toOptional(value?: string | null): string | undefined {
  const normalized = value?.trim()
  return normalized ? normalized : undefined
}

function toUniqueIds(values?: string[]): string[] {
  return Array.from(new Set((values || []).map((item) => item.trim()).filter(Boolean)))
}

function toPaymentReplacePayload(
  method: IClinicPaymentMethod,
  branchIdOverride?: string,
): IReplaceClinicPaymentMethodPayload {
  return {
    branchId: branchIdOverride ?? method.branchId ?? undefined,
    methodName: method.methodName,
    providerName: toOptional(method.providerName),
    accountName: toOptional(method.accountName),
    accountNumber: toOptional(method.accountNumber),
    iban: toOptional(method.iban),
    walletNumber: toOptional(method.walletNumber),
    instructions: toOptional(method.instructions),
    isActive: method.isActive,
    displayOrder: method.displayOrder,
  }
}

export async function getBranchesAction(
  tenantSlug: string,
  includeInactive = true,
): Promise<BaseApiResponse<IBranch[]>> {
  try {
    return await fetchApi<IBranch[]>(`/api/clinic/branches?includeInactive=${includeInactive}`, {
      method: 'GET',
      tenantSlug,
      cache: 'no-store',
    })
  } catch {
    return {
      success: false,
      message: 'تعذر تحميل بيانات الفروع',
      data: [],
      errors: [{ field: 'server', message: 'Unexpected branch loading error' }],
      meta: { timestamp: new Date().toISOString(), requestId: '' },
    }
  }
}

export async function createBranchAction(
  tenantSlug: string,
  payload: IUpsertBranchPayload,
): Promise<BaseApiResponse<IBranch>> {
  const result = await fetchApi<IBranch>('/api/clinic/branches', {
    method: 'POST',
    tenantSlug,
    body: JSON.stringify(payload),
  })

  if (result?.success) {
    revalidatePath(`/${tenantSlug}/dashboard/branches`)
    revalidatePath(`/${tenantSlug}/dashboard/staff`)
    revalidatePath(`/${tenantSlug}/patient/request`)
  }

  return result
}

export async function createBranchWithSetupAction(
  tenantSlug: string,
  payload: ICreateBranchWithSetupPayload,
): Promise<BaseApiResponse<ICreateBranchWithSetupResult>> {
  const meta = { timestamp: new Date().toISOString(), requestId: '' }

  const createResult = await fetchApi<IBranch>('/api/clinic/branches', {
    method: 'POST',
    tenantSlug,
    body: JSON.stringify({
      name: payload.name,
      code: payload.code,
      address: payload.address,
      phone: payload.phone,
    }),
  })

  if (!createResult.success || !createResult.data) {
    return {
      success: false,
      message: createResult.message || 'فشل إنشاء الفرع',
      data: null,
      errors: createResult.errors || [{ field: 'createBranch', message: 'تعذر إنشاء الفرع' }],
      meta: createResult.meta || meta,
    }
  }

  const createdBranch = createResult.data
  const warnings: string[] = []
  let paymentMethodsCopied = 0
  let staffAssigned = 0
  let staffFailed = 0

  if (payload.paymentSourceBranchId !== undefined) {
    const sourceBranchId = payload.paymentSourceBranchId || undefined
    const sourceQuery = sourceBranchId ? `?branchId=${encodeURIComponent(sourceBranchId)}` : ''

    const sourcePaymentResult = await fetchApi<IClinicPaymentOptions>(
      `/api/clinic/settings/payment-options${sourceQuery}`,
      {
        method: 'GET',
        tenantSlug,
        cache: 'no-store',
      },
    )

    if (!sourcePaymentResult.success || !sourcePaymentResult.data) {
      warnings.push(
        sourcePaymentResult.message || 'تعذر تحميل إعدادات الدفع من الفرع المصدر، تم تخطي نسخ الدفع.',
      )
    } else {
      const sourceMethods = sourcePaymentResult.data.methods.filter((method) =>
        sourceBranchId ? method.branchId === sourceBranchId : method.branchId === null,
      )

      if (sourceMethods.length === 0) {
        warnings.push('لا توجد طرق دفع قابلة للنسخ من الفرع/القالب المحدد.')
      } else {
        const allPaymentResult = await fetchApi<IClinicPaymentOptions>(
          '/api/clinic/settings/payment-options',
          {
            method: 'GET',
            tenantSlug,
            cache: 'no-store',
          },
        )

        if (!allPaymentResult.success || !allPaymentResult.data) {
          warnings.push(
            allPaymentResult.message || 'تعذر تحميل طرق الدفع الحالية، تم تخطي تطبيق قالب الدفع.',
          )
        } else {
          const retainedMethods = allPaymentResult.data.methods
            .filter((method) => method.branchId !== createdBranch.id)
            .map((method) => toPaymentReplacePayload(method))

          const clonedMethods = sourceMethods.map((method) =>
            toPaymentReplacePayload(method, createdBranch.id),
          )

          const replaceResult = await fetchApi<IClinicPaymentMethod[]>(
            '/api/clinic/settings/payment-methods',
            {
              method: 'PUT',
              tenantSlug,
              body: JSON.stringify({ methods: [...retainedMethods, ...clonedMethods] }),
            },
          )

          if (replaceResult.success) {
            paymentMethodsCopied = clonedMethods.length
          } else {
            warnings.push(replaceResult.message || 'تعذر تطبيق إعدادات الدفع على الفرع الجديد.')
          }
        }
      }
    }
  }

  const staffIds = toUniqueIds(payload.assignStaffIds)
  for (const staffId of staffIds) {
    const staffResult = await fetchApi<IStaff>(`/api/clinic/staff/${staffId}`, {
      method: 'GET',
      tenantSlug,
      cache: 'no-store',
    })

    if (!staffResult.success || !staffResult.data) {
      staffFailed += 1
      warnings.push(`تعذر تحميل بيانات الموظف (${staffId}) لتعيينه على الفرع الجديد.`)
      continue
    }

    const nextBranchIds = Array.from(
      new Set([...(staffResult.data.assignedBranchIds || []), createdBranch.id]),
    )

    const patchResult = await fetchApi<IStaff>(`/api/clinic/staff/${staffId}`, {
      method: 'PATCH',
      tenantSlug,
      body: JSON.stringify({ branchIds: nextBranchIds }),
    })

    if (patchResult.success) {
      staffAssigned += 1
    } else {
      staffFailed += 1
      warnings.push(
        patchResult.message || `فشل ربط الموظف ${staffResult.data.name} بالفرع الجديد.`,
      )
    }
  }

  const doctorIds = toUniqueIds(payload.assignDoctorIds)
  let doctorAssignmentsRequested = doctorIds.length

  if (doctorIds.length > 0) {
    const assignDoctorsResult = await fetchApi<IAssignDoctorsToBranchResult>(
      `/api/clinic/branches/${createdBranch.id}/doctors`,
      {
        method: 'POST',
        tenantSlug,
        body: JSON.stringify({ doctorIds }),
      },
    )

    if (!assignDoctorsResult.success || !assignDoctorsResult.data) {
      warnings.push(assignDoctorsResult.message || 'تعذر ربط الأطباء بالفرع الجديد.')
    } else {
      doctorAssignmentsRequested = assignDoctorsResult.data.requestedCount

      if (assignDoctorsResult.data.missingDoctorIds.length > 0) {
        warnings.push('بعض الأطباء المحددين غير موجودين أو غير مفعلين وتم تخطيهم.')
      }

      if (assignDoctorsResult.data.skippedCount > 0) {
        warnings.push('بعض الأطباء كانوا مرتبطين بالفرع مسبقاً ولم يتم تكرار الربط.')
      }
    }
  }

  revalidatePath(`/${tenantSlug}/dashboard/branches`)
  revalidatePath(`/${tenantSlug}/dashboard/staff`)
  revalidatePath(`/${tenantSlug}/dashboard/settings`)
  revalidatePath(`/${tenantSlug}/dashboard/doctors`)
  revalidatePath(`/${tenantSlug}/patient/request`)
  revalidatePath(`/${tenantSlug}/payment-options`)

  const data: ICreateBranchWithSetupResult = {
    branch: createdBranch,
    paymentMethodsCopied,
    staffAssigned,
    staffFailed,
    doctorAssignmentsRequested,
    warnings,
  }

  return {
    success: true,
    message:
      warnings.length > 0
        ? 'تم إنشاء الفرع وتنفيذ التهيئة مع بعض الملاحظات.'
        : 'تم إنشاء الفرع وتنفيذ التهيئة التفصيلية بنجاح.',
    data,
    errors: warnings.map((warning, index) => ({ field: `setup-${index + 1}`, message: warning })),
    meta: createResult.meta || meta,
  }
}

export async function updateBranchAction(
  tenantSlug: string,
  branchId: string,
  payload: IUpsertBranchPayload,
): Promise<BaseApiResponse<IBranch>> {
  const result = await fetchApi<IBranch>(`/api/clinic/branches/${branchId}`, {
    method: 'PUT',
    tenantSlug,
    body: JSON.stringify(payload),
  })

  if (result?.success) {
    revalidatePath(`/${tenantSlug}/dashboard/branches`)
    revalidatePath(`/${tenantSlug}/dashboard/staff`)
    revalidatePath(`/${tenantSlug}`)
  }

  return result
}

export async function setBranchStatusAction(
  tenantSlug: string,
  branchId: string,
  isActive: boolean,
): Promise<BaseApiResponse<IBranch>> {
  const endpoint = isActive
    ? `/api/clinic/branches/${branchId}/activate`
    : `/api/clinic/branches/${branchId}/deactivate`

  const result = await fetchApi<IBranch>(endpoint, {
    method: 'POST',
    tenantSlug,
  })

  if (result?.success) {
    revalidatePath(`/${tenantSlug}/dashboard/branches`)
    revalidatePath(`/${tenantSlug}/dashboard/staff`)
    revalidatePath(`/${tenantSlug}`)
  }

  return result
}
