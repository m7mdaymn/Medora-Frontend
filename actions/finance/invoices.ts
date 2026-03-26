'use server'

import { fetchApi } from '@/lib/fetchApi'
import { BaseApiResponse, IPaginatedData } from '@/types/api'
import { IInvoice, IPayment } from '@/types/visit' // التايبس بتاعتك
import { revalidatePath } from 'next/cache'

export async function getInvoicesAction(
  tenantSlug: string,
  pageNumber: number = 1,
  pageSize: number = 10,
  from?: string,
  to?: string,
  invoiceNumber?: string,
) {
  let url = `/api/clinic/invoices?pageNumber=${pageNumber}&pageSize=${pageSize}`

  if (from) url += `&from=${from}`
  if (to) url += `&to=${to}`
  if (invoiceNumber) url += `&invoiceNumber=${invoiceNumber}` // 👈 2. لزقناه في الـ URL للباك إند

  return await fetchApi<IPaginatedData<IInvoice>>(url, {
    tenantSlug,
    authType: 'staff',
    cache: 'no-store',
  })
}

export async function addPaymentAction(
  tenantSlug: string,
  payload: { invoiceId: string; amount: number; paymentMethod: string; notes?: string },
): Promise<BaseApiResponse<IPayment>> {
  const result = await fetchApi<IPayment>('/api/clinic/payments', {
    method: 'POST',
    tenantSlug,
    authType: 'staff',
    body: JSON.stringify(payload),
  })

  if (result.success) {
    revalidatePath(`/${tenantSlug}/dashboard/invoices`)
  }
  return result
}

export async function editInvoiceAction(
  tenantSlug: string,
  invoiceId: string,
  payload: { amount: number },
) {
  const result = await fetchApi<IInvoice>(`/api/clinic/invoices/${invoiceId}`, {
    method: 'PATCH',
    tenantSlug,
    authType: 'staff',
    body: JSON.stringify(payload),
  })

  if (result.success) {
    revalidatePath(`/${tenantSlug}/dashboard/invoices`)
  }
  return result
}

export async function getInvoiceByIdAction(tenantSlug: string, invoiceId: string) {
  return await fetchApi<IInvoice>(`/api/clinic/invoices/${invoiceId}`, {
    tenantSlug,
    authType: 'staff',
    cache: 'no-store',
  })
}

export async function addInvoiceLineItemAction(
  tenantSlug: string,
  invoiceId: string,
  payload: {
    clinicServiceId: string
    itemName: string
    unitPrice: number
    quantity: number
    notes?: string
  },
): Promise<BaseApiResponse<IInvoice>> {
  const result = await fetchApi<IInvoice>(`/api/clinic/invoices/${invoiceId}/line-items`, {
    method: 'POST',
    tenantSlug,
    authType: 'staff',
    body: JSON.stringify(payload),
  })

  if (result.success) {
    revalidatePath(`/${tenantSlug}/dashboard/invoices`)
  }
  return result
}

// 2. عمل خصم أو رسوم إضافية (Adjustments)
export async function addInvoiceAdjustmentAction(
  tenantSlug: string,
  invoiceId: string,
  payload: {
    extraAmount: number // موجب للزيادة، سالب للخصم
    reason: string
  },
): Promise<BaseApiResponse<IInvoice>> {
  const result = await fetchApi<IInvoice>(`/api/clinic/invoices/${invoiceId}/adjustments`, {
    method: 'POST',
    tenantSlug,
    authType: 'staff',
    body: JSON.stringify(payload),
  })

  if (result.success) {
    revalidatePath(`/${tenantSlug}/dashboard/invoices`)
  }
  return result
}

// 3. استرداد مبلغ (Refund)
export async function refundInvoiceAction(
  tenantSlug: string,
  invoiceId: string,
  payload: {
    amount: number
    reason: string
    referenceNumber?: string // اختياري لو كاش، بس إجباري تبعت String فاضي لو مفيش
  },
): Promise<BaseApiResponse<IPayment>> {
  // لاحظ إن دي بترجع بيانات الدفعة مش الفاتورة كلها
  const result = await fetchApi<IPayment>(`/api/clinic/invoices/${invoiceId}/refund`, {
    method: 'POST',
    tenantSlug,
    authType: 'staff',
    body: JSON.stringify({
      amount: payload.amount,
      reason: payload.reason,
      referenceNumber: payload.referenceNumber || '',
    }),
  })

  if (result.success) {
    revalidatePath(`/${tenantSlug}/dashboard/invoices`)
  }
  return result
}