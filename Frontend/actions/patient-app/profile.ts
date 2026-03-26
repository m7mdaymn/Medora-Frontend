'use server'

import { fetchApi } from '@/lib/fetchApi'
import { IPaginatedData } from '@/types/api'
import { IPatient } from '@/types/patient'
import { ICreditBalance, ICreditHistoryItem, IPatientSummary } from '@/types/patient-app'
import { IVisit } from '@/types/visit'
import { IQueueTicket } from '../../types/queue'
import { IBooking } from '../../types/booking'

// 1. جلب بيانات البروفايل (بما فيها التابعين)
export async function getPatientProfileAppAction(tenantSlug: string, patientId: string) {
  return await fetchApi<IPatient>(`/api/clinic/patient-app/profiles/${patientId}`, {
    method: 'GET',
    tenantSlug,
    authType: 'patient', // 👈 توكن المريض فقط
    cache: 'no-store',
  })
}

// 2. جلب سجل الزيارات للمريض (Paginated)
export async function getPatientVisitsAppAction(
  tenantSlug: string,
  patientId: string,
  pageNumber: number = 1,
  pageSize: number = 10,
) {
  return await fetchApi<IPaginatedData<IVisit>>(
    `/api/clinic/patient-app/profiles/${patientId}/visits?pageNumber=${pageNumber}&pageSize=${pageSize}`,
    {
      method: 'GET',
      tenantSlug,
      authType: 'patient',
      cache: 'no-store',
    },
  )
}

// 3. جلب ملخص سريع (Summary) عشان الصفحة الرئيسية
export async function getPatientSummaryAppAction(tenantSlug: string, patientId: string) {
  return await fetchApi<IPatientSummary>(`/api/clinic/patient-app/profiles/${patientId}/summary`, {
    method: 'GET',
    tenantSlug,
    authType: 'patient',
    cache: 'no-store',
  })
}

// 4. جلب التذكرة النشطة حالياً (لو المريض حاجز في العيادة دلوقتي)
export async function getPatientQueueTicketAppAction(tenantSlug: string, patientId: string) {
  return await fetchApi<IQueueTicket>(
    `/api/clinic/patient-app/profiles/${patientId}/queue-ticket`,
    {
      method: 'GET',
      tenantSlug,
      authType: 'patient',
      cache: 'no-store',
    },
  )
}

// 5. جلب الحجوزات المستقبلية أو السابقة (Bookings)
export async function getPatientBookingsAppAction(tenantSlug: string, patientId: string) {
  return await fetchApi<IBooking[]>(`/api/clinic/patient-app/profiles/${patientId}/bookings`, {
    method: 'GET',
    tenantSlug,
    authType: 'patient',
    cache: 'no-store',
  })
}

// 6. جلب رصيد المحفظة (الـ Credit)
export async function getPatientCreditBalanceAction(tenantSlug: string, patientId: string) {
  return await fetchApi<ICreditBalance>(`/api/clinic/patient-credits/${patientId}/balance`, {
    method: 'GET',
    tenantSlug,
  authType: 'patient', // في الغالب دي كمان بتستخدم توكن المريض عشان يعرض رصيده
    cache: 'no-store',
  })
}

// 7. جلب سجل حركات الرصيد (History)
export async function getPatientCreditHistoryAction(
  tenantSlug: string,
  patientId: string,
  pageNumber: number = 1,
  pageSize: number = 20,
) {
  return await fetchApi<IPaginatedData<ICreditHistoryItem>>(
    `/api/clinic/patient-credits/${patientId}/history?pageNumber=${pageNumber}&pageSize=${pageSize}`,
    {
      method: 'GET',
      tenantSlug,
      authType: 'patient',
      cache: 'no-store',
    },
  )
}
