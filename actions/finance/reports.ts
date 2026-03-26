'use server'

import { fetchApi } from '@/lib/fetchApi'
import {
  IProfitReport,
  IDailyFinance,
  IMonthlyFinance,
  IYearlyFinance,
  IDoctorProfit,
} from '@/types/finance'

// 1. تقرير الأرباح الشامل (الجوكر)
export async function getProfitReportAction(tenantSlug: string, from?: string, to?: string) {
  const params = new URLSearchParams()
  if (from) params.append('from', from)
  if (to) params.append('to', to)

  return await fetchApi<IProfitReport>(`/api/clinic/finance/profit?${params.toString()}`, {
    tenantSlug,
    authType: 'staff',
    cache: 'no-store',
  })
}

// 2. التقرير اليومي
export async function getDailyFinanceAction(tenantSlug: string, date?: string) {
  const params = new URLSearchParams()
  if (date) params.append('date', date)

  return await fetchApi<IDailyFinance>(`/api/clinic/finance/daily?${params.toString()}`, {
    tenantSlug,
    authType: 'staff',
    cache: 'no-store',
  })
}

// 3. تقرير أرباح دكتور محدد (أو كل الدكاترة ليوم معين)
export async function getFinanceByDoctorAction(
  tenantSlug: string,
  date?: string,
  doctorId?: string,
) {
  const params = new URLSearchParams()
  if (date) params.append('date', date)
  if (doctorId) params.append('doctorId', doctorId)

  return await fetchApi<IDoctorProfit[]>(`/api/clinic/finance/by-doctor?${params.toString()}`, {
    tenantSlug,
    authType: 'staff',
    cache: 'no-store',
  })
}

// 4. التقرير الشهري
export async function getMonthlyFinanceAction(tenantSlug: string, year: number, month: number) {
  return await fetchApi<IMonthlyFinance>(
    `/api/clinic/finance/monthly?year=${year}&month=${month}`,
    {
      tenantSlug,
      authType: 'staff',
      cache: 'no-store',
    },
  )
}

// 5. التقرير السنوي
export async function getYearlyFinanceAction(tenantSlug: string, year: number) {
  return await fetchApi<IYearlyFinance>(`/api/clinic/finance/yearly?year=${year}`, {
    tenantSlug,
    authType: 'staff',
    cache: 'no-store',
  })
}
