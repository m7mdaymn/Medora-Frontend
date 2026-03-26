'use server'

import { fetchApi } from '@/lib/fetchApi'
import { IDoctorNote } from '../../types/notes'

// 1. الدكتور بيبعت الملاحظة
export async function createDoctorNoteAction(tenantSlug: string, message: string) {
  return await fetchApi<IDoctorNote>('/api/clinic/doctor-notes', {
    method: 'POST',
    tenantSlug,
    authType: 'staff',
    body: JSON.stringify({ message }),
  })
}

// 2. الريسبشن بيجيب الملاحظات اللي متقرتش
// دي هنستخدمها جوه الـ SWR Fetcher
export async function getUnreadDoctorNotes(tenantSlug: string) {
  return await fetchApi<IDoctorNote[]>('/api/clinic/doctor-notes/unread', {
    method: 'GET',
    tenantSlug,
    authType: 'staff',
    cache: 'no-store',
  })
}

// 3. الريسبشن بيعلم على الملاحظة إنها اتقرت
export async function markDoctorNoteAsReadAction(tenantSlug: string, noteId: string) {
  return await fetchApi<IDoctorNote>(`/api/clinic/doctor-notes/${noteId}/read`, {
    method: 'POST',
    tenantSlug,
    authType: 'staff',
  })
}
