'use server'

import { fetchApi } from '@/lib/fetchApi'
import { IClinicPaymentMethod, IClinicSettings } from '@/types/settings'
import { UpdateSettingsInput } from '@/validation/settings'
import { revalidatePath } from 'next/cache'

export interface ReplaceClinicPaymentMethodInput {
  branchId?: string
  methodName: string
  providerName?: string
  accountName?: string
  accountNumber?: string
  iban?: string
  walletNumber?: string
  instructions?: string
  isActive: boolean
  displayOrder: number
}

export async function updateClinicSettings(tenantSlug: string, data: UpdateSettingsInput) {
  const response = await fetchApi<IClinicSettings>(`/api/clinic/settings`, {
    method: 'PUT',
    tenantSlug,
    body: JSON.stringify(data),
  })

  if (response.success) {
    revalidatePath(`/${tenantSlug}/dashboard/settings`)
  }

  return response
}

export async function patchClinicSettings(
  tenantSlug: string,
  data: Partial<UpdateSettingsInput>,
) {
  const response = await fetchApi<IClinicSettings>(`/api/clinic/settings`, {
    method: 'PATCH',
    tenantSlug,
    body: JSON.stringify(data),
  })

  if (response.success) {
    revalidatePath(`/${tenantSlug}/dashboard/settings`)
  }

  return response
}

export async function replaceClinicPaymentMethodsAction(
  tenantSlug: string,
  methods: ReplaceClinicPaymentMethodInput[],
) {
  const response = await fetchApi<IClinicPaymentMethod[]>(`/api/clinic/settings/payment-methods`, {
    method: 'PUT',
    tenantSlug,
    body: JSON.stringify({ methods }),
  })

  if (response.success) {
    revalidatePath(`/${tenantSlug}/dashboard/settings`)
    revalidatePath(`/${tenantSlug}/patient/request`)
    revalidatePath(`/${tenantSlug}/payment-options`)
  }

  return response
}
