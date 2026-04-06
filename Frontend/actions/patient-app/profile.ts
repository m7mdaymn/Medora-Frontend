'use server'

import { fetchApi } from '@/lib/fetchApi'
import { IPaginatedData } from '@/types/api'
import { IPatient } from '@/types/patient'
import { IPatientMedicalDocument } from '@/types/patient-medical'
import {
  IPatientPartnerOrderTimelineItem,
  IPatientSelfServiceRequestListItem,
  IPatientSummary,
} from '@/types/patient-app'
import { IPartnerOrder } from '@/types/partner'
import { ISelfServiceRequest } from '@/types/self-service'
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

export async function confirmPatientPartnerOrderArrivalAppAction(
  tenantSlug: string,
  patientId: string,
  orderId: string,
  notes?: string,
) {
  return await fetchApi<IPatientPartnerOrderTimelineItem>(
    `/api/clinic/patient-app/profiles/${patientId}/partner-orders/${orderId}/arrived`,
    {
      method: 'POST',
      tenantSlug,
      authType: 'patient',
      body: JSON.stringify({
        arrivedAt: new Date().toISOString(),
        notes: notes?.trim() || null,
      }),
    },
  )
}

export async function addPatientPartnerOrderCommentAppAction(
  tenantSlug: string,
  patientId: string,
  orderId: string,
  comment: string,
) {
  return await fetchApi<IPartnerOrder>(
    `/api/clinic/patient-app/profiles/${patientId}/partner-orders/${orderId}/comment`,
    {
      method: 'POST',
      tenantSlug,
      authType: 'patient',
      body: JSON.stringify({
        comment: comment.trim(),
        notifyPatient: false,
      }),
    },
  )
}

export async function uploadPatientPartnerOrderResultDocumentAppAction(
  tenantSlug: string,
  patientId: string,
  payload: {
    orderId: string
    visitId: string
    partnerType: string
    file: File
    notes?: string
  },
) {
  const formData = new FormData()
  formData.append('file', payload.file)

  const normalizedType = payload.partnerType?.toLowerCase()
  const category =
    normalizedType === 'radiology'
      ? 'Radiology'
      : normalizedType === 'laboratory'
        ? 'Lab'
        : 'OtherMedicalDocument'

  formData.append('category', category)
  formData.append('partnerOrderId', payload.orderId)
  formData.append('visitId', payload.visitId)

  if (payload.notes?.trim()) {
    formData.append('notes', payload.notes.trim())
  }

  return await fetchApi<IPatientMedicalDocument>(`/api/clinic/patients/${patientId}/medical-documents`, {
    method: 'POST',
    tenantSlug,
    authType: 'patient',
    body: formData,
  })
}

// 7. جلب طلبات الدفع الذاتي وحالة الاعتماد (Payment Confirmation)
export async function getPatientSelfServiceRequestsAppAction(tenantSlug: string, patientId: string) {
  return await fetchApi<IPatientSelfServiceRequestListItem[]>(
    `/api/clinic/patient-app/profiles/${patientId}/self-service-requests`,
    {
      method: 'GET',
      tenantSlug,
      authType: 'patient',
      cache: 'no-store',
    },
  )
}

export async function getPatientSelfServiceRequestByIdAppAction(
  tenantSlug: string,
  patientId: string,
  requestId: string,
) {
  return await fetchApi<ISelfServiceRequest>(
    `/api/clinic/patient-app/profiles/${patientId}/self-service-requests/${requestId}`,
    {
      method: 'GET',
      tenantSlug,
      authType: 'patient',
      cache: 'no-store',
    },
  )
}

export async function createPatientSelfServiceRequestAppAction(
  tenantSlug: string,
  patientId: string,
  payload: {
    requestType: 'SameDayTicket' | 'FutureBooking'
    doctorId: string
    branchId: string
    doctorServiceId: string
    visitType: string
    requestedDate: string
    requestedTime?: string
    complaint?: string
    symptoms?: string
    durationNotes?: string
    notes?: string
    paymentMethod?: string
    transferReference?: string
    transferSenderName?: string
    transferDate?: string
    paidAmount?: number
    paymentProof: File
    supportingDocuments?: File[]
  },
) {
  const formData = new FormData()
  formData.append('requestType', payload.requestType)
  formData.append('doctorId', payload.doctorId)
  formData.append('branchId', payload.branchId)
  formData.append('doctorServiceId', payload.doctorServiceId)
  formData.append('visitType', payload.visitType)
  formData.append('requestedDate', payload.requestedDate)

  if (payload.requestedTime?.trim()) {
    formData.append('requestedTime', payload.requestedTime.trim())
  }

  if (payload.complaint?.trim()) {
    formData.append('complaint', payload.complaint.trim())
  }

  if (payload.symptoms?.trim()) {
    formData.append('symptoms', payload.symptoms.trim())
  }

  if (payload.durationNotes?.trim()) {
    formData.append('durationNotes', payload.durationNotes.trim())
  }

  if (payload.notes?.trim()) {
    formData.append('notes', payload.notes.trim())
  }

  if (payload.paymentMethod?.trim()) {
    formData.append('paymentMethod', payload.paymentMethod.trim())
  }

  if (payload.transferReference?.trim()) {
    formData.append('transferReference', payload.transferReference.trim())
  }

  if (payload.transferSenderName?.trim()) {
    formData.append('transferSenderName', payload.transferSenderName.trim())
  }

  if (payload.transferDate?.trim()) {
    formData.append('transferDate', payload.transferDate.trim())
  }

  if (typeof payload.paidAmount === 'number' && Number.isFinite(payload.paidAmount)) {
    formData.append('paidAmount', String(payload.paidAmount))
  }

  formData.append('paymentProof', payload.paymentProof)

  for (const file of payload.supportingDocuments ?? []) {
    formData.append('supportingDocuments', file)
  }

  return await fetchApi<ISelfServiceRequest>(
    `/api/clinic/patient-app/profiles/${patientId}/self-service-requests`,
    {
      method: 'POST',
      tenantSlug,
      authType: 'patient',
      body: formData,
    },
  )
}

export async function reuploadPatientSelfServicePaymentProofAppAction(
  tenantSlug: string,
  patientId: string,
  requestId: string,
  paymentProof: File,
) {
  const formData = new FormData()
  formData.append('paymentProof', paymentProof)

  return await fetchApi<ISelfServiceRequest>(
    `/api/clinic/patient-app/profiles/${patientId}/self-service-requests/${requestId}/payment-proof/reupload`,
    {
      method: 'POST',
      tenantSlug,
      authType: 'patient',
      body: formData,
    },
  )
}
