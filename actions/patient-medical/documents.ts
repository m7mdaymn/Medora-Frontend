'use server'

import { revalidatePath } from 'next/cache'
import { fetchApi } from '@/lib/fetchApi'
import { BaseApiResponse } from '@/types/api'
import {
  IPatientChronicProfile,
  IPatientMedicalDocument,
  IPatientMedicalDocumentThread,
} from '@/types/patient-medical'

export async function listPatientMedicalDocumentsAction(
  tenantSlug: string,
  patientId: string,
): Promise<BaseApiResponse<IPatientMedicalDocument[]>> {
  return await fetchApi<IPatientMedicalDocument[]>(`/api/clinic/patients/${patientId}/medical-documents`, {
    method: 'GET',
    tenantSlug,
    cache: 'no-store',
  })
}

export async function uploadPatientMedicalDocumentAction(
  tenantSlug: string,
  patientId: string,
  formData: FormData,
): Promise<BaseApiResponse<IPatientMedicalDocument>> {
  const response = await fetchApi<IPatientMedicalDocument>(`/api/clinic/patients/${patientId}/medical-documents`, {
    method: 'POST',
    tenantSlug,
    body: formData,
  })

  if (response.success) {
    revalidatePath(`/${tenantSlug}/dashboard/patients/${patientId}/medical-documents`)
  }

  return response
}

export async function getPatientMedicalDocumentAction(
  tenantSlug: string,
  patientId: string,
  documentId: string,
): Promise<BaseApiResponse<IPatientMedicalDocument>> {
  return await fetchApi<IPatientMedicalDocument>(
    `/api/clinic/patients/${patientId}/medical-documents/${documentId}`,
    {
      method: 'GET',
      tenantSlug,
      cache: 'no-store',
    },
  )
}

export async function listPatientMedicalDocumentThreadsAction(
  tenantSlug: string,
  patientId: string,
  documentId: string,
): Promise<BaseApiResponse<IPatientMedicalDocumentThread[]>> {
  return await fetchApi<IPatientMedicalDocumentThread[]>(
    `/api/clinic/patients/${patientId}/medical-documents/${documentId}/threads`,
    {
      method: 'GET',
      tenantSlug,
      cache: 'no-store',
    },
  )
}

export async function createPatientMedicalDocumentThreadAction(
  tenantSlug: string,
  patientId: string,
  documentId: string,
  payload: { subject: string; notes?: string; initialMessage?: string },
): Promise<BaseApiResponse<IPatientMedicalDocumentThread>> {
  const response = await fetchApi<IPatientMedicalDocumentThread>(
    `/api/clinic/patients/${patientId}/medical-documents/${documentId}/threads`,
    {
      method: 'POST',
      tenantSlug,
      body: JSON.stringify(payload),
    },
  )

  if (response.success) {
    revalidatePath(`/${tenantSlug}/dashboard/patients/${patientId}/medical-documents`)
  }

  return response
}

export async function addPatientMedicalThreadReplyAction(
  tenantSlug: string,
  patientId: string,
  documentId: string,
  threadId: string,
  payload: { message: string; isInternalNote?: boolean },
): Promise<BaseApiResponse<IPatientMedicalDocumentThread>> {
  const response = await fetchApi<IPatientMedicalDocumentThread>(
    `/api/clinic/patients/${patientId}/medical-documents/${documentId}/threads/${threadId}/replies`,
    {
      method: 'POST',
      tenantSlug,
      body: JSON.stringify(payload),
    },
  )

  if (response.success) {
    revalidatePath(`/${tenantSlug}/dashboard/patients/${patientId}/medical-documents`)
  }

  return response
}

export async function closePatientMedicalThreadAction(
  tenantSlug: string,
  patientId: string,
  documentId: string,
  threadId: string,
  notes?: string,
): Promise<BaseApiResponse<IPatientMedicalDocumentThread>> {
  const response = await fetchApi<IPatientMedicalDocumentThread>(
    `/api/clinic/patients/${patientId}/medical-documents/${documentId}/threads/${threadId}/close`,
    {
      method: 'POST',
      tenantSlug,
      body: JSON.stringify({ notes: notes || null }),
    },
  )

  if (response.success) {
    revalidatePath(`/${tenantSlug}/dashboard/patients/${patientId}/medical-documents`)
  }

  return response
}

export async function getPatientChronicProfileAction(
  tenantSlug: string,
  patientId: string,
): Promise<BaseApiResponse<IPatientChronicProfile>> {
  return await fetchApi<IPatientChronicProfile>(`/api/clinic/patients/${patientId}/chronic-conditions`, {
    method: 'GET',
    tenantSlug,
    cache: 'no-store',
  })
}

export async function upsertPatientChronicProfileAction(
  tenantSlug: string,
  patientId: string,
  payload: {
    diabetes: boolean
    hypertension: boolean
    cardiacDisease: boolean
    asthma: boolean
    other: boolean
    otherNotes?: string
  },
): Promise<BaseApiResponse<IPatientChronicProfile>> {
  const response = await fetchApi<IPatientChronicProfile>(`/api/clinic/patients/${patientId}/chronic-conditions`, {
    method: 'PUT',
    tenantSlug,
    body: JSON.stringify(payload),
  })

  if (response.success) {
    revalidatePath(`/${tenantSlug}/dashboard/patients/${patientId}/medical-documents`)
  }

  return response
}
