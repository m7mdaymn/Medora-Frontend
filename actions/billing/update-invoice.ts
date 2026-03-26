'use server'

import { fetchApi } from '@/lib/fetchApi'
import { BaseApiResponse } from '@/types/api'
import { IInvoice } from '@/types/visit'
import { revalidatePath } from 'next/cache'
import { CreateInvoiceFormInput } from '../../validation/invoice'

export const updateInvoiceAction = async (
  tenantSlug: string,
  invoiceId: string,
  visitId: string, 
  data: CreateInvoiceFormInput,
): Promise<BaseApiResponse<IInvoice>> => {
  try {
    const result = await fetchApi<IInvoice>(`/api/clinic/invoices/${invoiceId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
      headers: {
        'Content-Type': 'application/json',
        'X-Tenant': tenantSlug,
      },
    })

    if (result.success) {
      revalidatePath(`/${tenantSlug}/dashboard/doctor/visits/${visitId}`)
    }

    return result
  } catch (error) {
    console.error('[UPDATE_INVOICE_ERROR]:', error)
    return {
      success: false,
      message: 'فشل في تحديث المطالبة المالية',
      data: null,
      errors: [],
      meta: { timestamp: new Date().toISOString(), requestId: '' },
    }
  }
}
