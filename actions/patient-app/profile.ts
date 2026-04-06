'use server'

import { fetchApi } from '@/lib/fetchApi'
import { IPaginatedData } from '@/types/api'
import { IPatient } from '@/types/patient'
import { IPatientPartnerOrderTimelineItem, IPatientSummary } from '@/types/patient-app'
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

// 6. جلب رحلة الطلبات الخارجية (المعامل/الأشعة/الصيدليات) للمريض
export async function getPatientPartnerOrdersAppAction(tenantSlug: string, patientId: string) {
  return await fetchApi<IPatientPartnerOrderTimelineItem[]>(
    `/api/clinic/patient-app/profiles/${patientId}/partner-orders`,
    {
      method: 'GET',
      tenantSlug,
      authType: 'patient',
      cache: 'no-store',
    },
  )
}
