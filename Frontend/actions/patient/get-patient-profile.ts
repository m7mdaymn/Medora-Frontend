'use server'

import { fetchApi } from '@/lib/fetchApi'
import { IPatient } from '@/types/patient'
import { IVisit } from '@/types/visit'

interface GetPatientProfileResult {
  success: boolean
  message: string
  patient?: IPatient | null
  visits?: IVisit[]
  pagination?: {
    pageNumber: number
    totalPages: number
    totalCount: number
    hasNextPage: boolean
    hasPreviousPage: boolean
  }
}

export async function getPatientProfileAction(
  patientId: string,
  tenantSlug: string,
  page: number = 1,
  pageSize: number = 10,
): Promise<GetPatientProfileResult> {
  try {
    // 1. جلب بيانات المريض
    const patientRes = await fetchApi<IPatient>(`/api/clinic/patients/${patientId}`, {
      method: 'GET',
      tenantSlug,
      cache: 'no-store',
    })

    if (!patientRes.success || !patientRes.data) {
      return {
        success: false,
        message: patientRes.message || 'فشل في جلب بيانات المريض',
      }
    }

    // 2. جلب الزيارات
    const queryParams = new URLSearchParams({
      pageNumber: page.toString(),
      pageSize: pageSize.toString(),
    })

    const visitsRes = await fetchApi<{
      items: IVisit[]
      pageNumber: number
      totalPages: number
      totalCount: number
      hasNextPage: boolean
      hasPreviousPage: boolean
    }>(`/api/clinic/patients/${patientId}/visits?${queryParams.toString()}`, {
      method: 'GET',
      tenantSlug,
      cache: 'no-store',
    })

    return {
      success: true,
      message: 'تم جلب البيانات بنجاح',
      patient: patientRes.data,
      visits: visitsRes.success ? visitsRes.data?.items : [],
      pagination: visitsRes.success
        ? {
            pageNumber: visitsRes.data?.pageNumber || 1,
            totalPages: visitsRes.data?.totalPages || 1,
            totalCount: visitsRes.data?.totalCount || 0,
            hasNextPage: visitsRes.data?.hasNextPage || false,
            hasPreviousPage: visitsRes.data?.hasPreviousPage || false,
          }
        : undefined,
    }
  } catch (error) {
    console.error('Error in getPatientProfileAction:', error)
    return {
      success: false,
      message: 'حدث خطأ غير متوقع',
    }
  }
}
