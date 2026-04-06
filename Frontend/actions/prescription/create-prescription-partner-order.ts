'use server'

import { revalidatePath } from 'next/cache'
import { fetchApi } from '../../lib/fetchApi'
import { BaseApiResponse } from '../../types/api'
import { IPartnerOrder } from '../../types/partner'

interface CreatePrescriptionPartnerOrderPayload {
  partnerId: string
  partnerContractId?: string
  partnerServiceCatalogItemId?: string
  estimatedCost?: number
  externalReference?: string
  notes?: string
}

export async function createPrescriptionPartnerOrderAction(
  tenantSlug: string,
  visitId: string,
  prescriptionId: string,
  payload: CreatePrescriptionPartnerOrderPayload,
): Promise<BaseApiResponse<IPartnerOrder>> {
  try {
    const response = await fetchApi<IPartnerOrder>(
      `/api/clinic/visits/${visitId}/prescriptions/${prescriptionId}/partner-order`,
      {
        method: 'POST',
        body: JSON.stringify(payload),
        headers: {
          'Content-Type': 'application/json',
          'X-Tenant': tenantSlug,
        },
      },
    )

    if (response.success) {
      revalidatePath(`/${tenantSlug}/dashboard/doctor/visits/${visitId}`)
      revalidatePath(`/${tenantSlug}/dashboard/contracts`)
      revalidatePath(`/${tenantSlug}/dashboard/contractor/orders`)
      revalidatePath(`/${tenantSlug}/dashboard/partner-orders`)
    }

    return response
  } catch (error) {
    console.error('Error creating prescription partner order:', error)
    return {
      success: false,
      message: 'فشل إرسال طلب الشريك للروشتة',
      data: null,
      errors: [],
      meta: { timestamp: new Date().toISOString(), requestId: '' },
    }
  }
}
