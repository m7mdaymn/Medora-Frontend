'use server'

import { revalidatePath } from 'next/cache'
import { fetchApi } from '@/lib/fetchApi'
import { BaseApiResponse } from '@/types/api'
import {
  IAbsenceRecord,
  IAttendanceRecord,
  ICreateDoctorCompensationRuleRequest,
  IDailyClosingSnapshot,
  IDoctorCompensationRule,
  ISalaryPayoutExpense,
} from '@/types/workforce'

function toDateRangeQuery(params: {
  from?: string
  to?: string
  doctorId?: string
  employeeId?: string
}): string {
  const search = new URLSearchParams()
  if (params.from) search.set('from', params.from)
  if (params.to) search.set('to', params.to)
  if (params.doctorId) search.set('doctorId', params.doctorId)
  if (params.employeeId) search.set('employeeId', params.employeeId)

  const query = search.toString()
  return query ? `?${query}` : ''
}

export async function listDoctorCompensationRulesAction(
  tenantSlug: string,
  doctorId: string,
): Promise<BaseApiResponse<IDoctorCompensationRule[]>> {
  return await fetchApi<IDoctorCompensationRule[]>(
    `/api/clinic/workforce/doctors/${doctorId}/compensation-rules`,
    {
      method: 'GET',
      tenantSlug,
      cache: 'no-store',
    },
  )
}

export async function createDoctorCompensationRuleAction(
  tenantSlug: string,
  doctorId: string,
  payload: ICreateDoctorCompensationRuleRequest,
): Promise<BaseApiResponse<IDoctorCompensationRule>> {
  const response = await fetchApi<IDoctorCompensationRule>(
    `/api/clinic/workforce/doctors/${doctorId}/compensation-rules`,
    {
      method: 'POST',
      tenantSlug,
      body: JSON.stringify(payload),
    },
  )

  if (response.success) {
    revalidatePath(`/${tenantSlug}/dashboard/workforce`)
  }

  return response
}

export async function listAttendanceAction(
  tenantSlug: string,
  filters: { from?: string; to?: string; doctorId?: string; employeeId?: string } = {},
): Promise<BaseApiResponse<IAttendanceRecord[]>> {
  return await fetchApi<IAttendanceRecord[]>(
    `/api/clinic/workforce/attendance${toDateRangeQuery(filters)}`,
    {
      method: 'GET',
      tenantSlug,
      cache: 'no-store',
    },
  )
}

export async function createAttendanceAction(
  tenantSlug: string,
  payload: {
    employeeId?: string
    doctorId?: string
    branchId?: string
    checkInAt?: string
    lateMinutes?: number
    isAbsent?: boolean
  },
): Promise<BaseApiResponse<IAttendanceRecord>> {
  const response = await fetchApi<IAttendanceRecord>('/api/clinic/workforce/attendance', {
    method: 'POST',
    tenantSlug,
    body: JSON.stringify(payload),
  })

  if (response.success) {
    revalidatePath(`/${tenantSlug}/dashboard/workforce`)
  }

  return response
}

export async function checkOutAttendanceAction(
  tenantSlug: string,
  attendanceId: string,
  payload: { checkOutAt?: string; overtimeMinutes?: number } = {},
): Promise<BaseApiResponse<IAttendanceRecord>> {
  const response = await fetchApi<IAttendanceRecord>(
    `/api/clinic/workforce/attendance/${attendanceId}/checkout`,
    {
      method: 'PUT',
      tenantSlug,
      body: JSON.stringify(payload),
    },
  )

  if (response.success) {
    revalidatePath(`/${tenantSlug}/dashboard/workforce`)
  }

  return response
}

export async function listAbsenceAction(
  tenantSlug: string,
  filters: { from?: string; to?: string; doctorId?: string; employeeId?: string } = {},
): Promise<BaseApiResponse<IAbsenceRecord[]>> {
  return await fetchApi<IAbsenceRecord[]>(`/api/clinic/workforce/absence${toDateRangeQuery(filters)}`, {
    method: 'GET',
    tenantSlug,
    cache: 'no-store',
  })
}

export async function createAbsenceAction(
  tenantSlug: string,
  payload: {
    employeeId?: string
    doctorId?: string
    fromDate: string
    toDate: string
    reason: string
    isPaid?: boolean
    notes?: string
    branchId?: string
  },
): Promise<BaseApiResponse<IAbsenceRecord>> {
  const response = await fetchApi<IAbsenceRecord>('/api/clinic/workforce/absence', {
    method: 'POST',
    tenantSlug,
    body: JSON.stringify(payload),
  })

  if (response.success) {
    revalidatePath(`/${tenantSlug}/dashboard/workforce`)
  }

  return response
}

export async function createSalaryPayoutAction(
  tenantSlug: string,
  payload: {
    employeeId?: string
    doctorId?: string
    amount: number
    payoutDate?: string
    notes?: string
  },
): Promise<BaseApiResponse<ISalaryPayoutExpense>> {
  const response = await fetchApi<ISalaryPayoutExpense>('/api/clinic/workforce/salary-payouts', {
    method: 'POST',
    tenantSlug,
    body: JSON.stringify(payload),
  })

  if (response.success) {
    revalidatePath(`/${tenantSlug}/dashboard/workforce`)
  }

  return response
}

export async function generateDailyClosingAction(
  tenantSlug: string,
  date?: string,
): Promise<BaseApiResponse<IDailyClosingSnapshot>> {
  const query = date ? `?date=${encodeURIComponent(date)}` : ''
  const response = await fetchApi<IDailyClosingSnapshot>(
    `/api/clinic/workforce/daily-closing/generate${query}`,
    {
      method: 'POST',
      tenantSlug,
    },
  )

  if (response.success) {
    revalidatePath(`/${tenantSlug}/dashboard/workforce`)
  }

  return response
}

export async function listDailyClosingSnapshotsAction(
  tenantSlug: string,
  filters: { from?: string; to?: string } = {},
): Promise<BaseApiResponse<IDailyClosingSnapshot[]>> {
  const search = new URLSearchParams()
  if (filters.from) search.set('from', filters.from)
  if (filters.to) search.set('to', filters.to)
  const query = search.toString()

  return await fetchApi<IDailyClosingSnapshot[]>(
    `/api/clinic/workforce/daily-closing${query ? `?${query}` : ''}`,
    {
      method: 'GET',
      tenantSlug,
      cache: 'no-store',
    },
  )
}
