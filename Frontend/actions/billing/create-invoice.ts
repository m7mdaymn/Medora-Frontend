'use server'

import { fetchApi } from '@/lib/fetchApi'
import { BaseApiResponse } from '@/types/api'
import { IInvoice } from '@/types/visit'
import { revalidatePath } from 'next/cache'
import { CreateInvoiceFormInput } from '../../validation/invoice'

export const createInvoiceAction = async (
  tenantSlug: string,
  visitId: string, // هنا هنبعت الـ TicketID مؤقتاً لو مفيش Visit أو string فاضي حسب الباك إند
  data: CreateInvoiceFormInput,
): Promise<BaseApiResponse<IInvoice>> => {
  try {
    // التعديل: بنبعت الداتا التفصيلية للباك إند
    // وبنضيف عليها الـ visitId (الباك إند المفروض يهندل لو ده ticketId أو visitId)
    const payload = {
      ...data,
      visitId: visitId,
    }

    const result = await fetchApi<IInvoice>(`/api/clinic/invoices`, {
      method: 'POST',
      body: JSON.stringify(payload),
      headers: {
        'Content-Type': 'application/json',
        'X-Tenant': tenantSlug,
      },
    })

    if (result.success) {
      revalidatePath(`/${tenantSlug}/dashboard/queue`)
      // لو فيه visitId حقيقي، نعمل revalidate لصفحته
      if (visitId) {
        revalidatePath(`/${tenantSlug}/dashboard/doctor/visits/${visitId}`)
      }
    }

    return result
  } catch (error) {
    console.error('[CREATE_INVOICE_ERROR]:', error)
    return {
      success: false,
      message: 'فشل في إنشاء الفاتورة',
      data: null,
      errors: [],
      meta: { timestamp: new Date().toISOString(), requestId: '' },
    }
  }
}
