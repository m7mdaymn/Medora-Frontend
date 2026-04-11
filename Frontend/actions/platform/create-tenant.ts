'use server'

import { fetchApi } from '@/lib/fetchApi'
import { getTenantClassificationFromKind } from '@/lib/tenant-kind'
import { BaseApiResponse } from '@/types/api'
import { ITenant } from '@/types/platform'
import { revalidatePath } from 'next/cache'
import { CreateTenantInput } from '@/validation/tenant'

function normalizeOptionalText(value?: string | null): string | null {
  const normalized = value?.trim()
  return normalized ? normalized : null
}

function parseBranchNames(input?: string | null): string[] {
  if (!input) return []

  const seen = new Set<string>()
  const names: string[] = []

  input
    .split(/\r?\n|,/)
    .map((line) => line.trim())
    .filter(Boolean)
    .forEach((name) => {
      const key = name.toLowerCase()
      if (!seen.has(key)) {
        seen.add(key)
        names.push(name)
      }
    })

  return names
}

export async function createTenantAction(
  data: CreateTenantInput,
): Promise<BaseApiResponse<ITenant>> {
  const tenantClassification = getTenantClassificationFromKind(data.tenantKind)
  const tenantType = tenantClassification.tenantType
  const partnerCategory = tenantClassification.partnerCategory
  const hasBranches = tenantClassification.isClinic ? data.hasBranches : false
  const initialBranchNames = hasBranches ? parseBranchNames(data.initialBranchNames) : []
  const linkedTenantIds = Array.from(new Set((data.linkedTenantIds || []).filter(Boolean)))

  const payload = {
    name: data.name,
    slug: data.slug,
    contactPhone: normalizeOptionalText(data.contactPhone),
    address: normalizeOptionalText(data.address),
    logoUrl: normalizeOptionalText(data.logoUrl),
    tenantType,
    tenantKind: data.tenantKind,
    partnerCategory,
    hasBranches,
    initialBranches: initialBranchNames.map((name) => ({ name })),
    linkedTenantIds,
    ownerName: data.ownerName,
    ownerUsername: data.ownerUsername,
    ownerPassword: data.ownerPassword,
    ownerPhone: normalizeOptionalText(data.ownerPhone),
  }

  const res = await fetchApi<ITenant>('/api/platform/tenants', {
    method: 'POST',
    body: JSON.stringify(payload),
  })

  if (res.success) {
    revalidatePath('/admin/tenants')
  }

  return res
}

export async function updateTenantAction(
  tenantId: string,
  data: Partial<CreateTenantInput>,
): Promise<BaseApiResponse<ITenant>> {
  const payload = {
    name: data.name,
    contactPhone: normalizeOptionalText(data.contactPhone),
    address: normalizeOptionalText(data.address),
    logoUrl: normalizeOptionalText(data.logoUrl),
  }

  const res = await fetchApi<ITenant>(`/api/platform/tenants/${tenantId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })

  if (res.success) {
    revalidatePath('/admin/tenants')
  }

  return res
}
