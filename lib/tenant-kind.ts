import { ITenant, TenantPartnerCategory } from '@/types/platform'

export type TenantKind = 'Clinic' | TenantPartnerCategory

export const TENANT_KIND_OPTIONS: Array<{ value: TenantKind; label: string }> = [
  { value: 'Clinic', label: 'عيادة' },
  { value: 'Laboratory', label: 'معمل' },
  { value: 'Radiology', label: 'مركز أشعة' },
  { value: 'Pharmacy', label: 'صيدلية' },
]

export function getTenantKindLabel(kind: TenantKind): string {
  switch (kind) {
    case 'Clinic':
      return 'عيادة'
    case 'Laboratory':
      return 'معمل'
    case 'Radiology':
      return 'مركز أشعة'
    case 'Pharmacy':
      return 'صيدلية'
    default:
      return 'كيان'
  }
}

export function getTenantKindFromTenant(tenant: Pick<ITenant, 'tenantType' | 'partnerCategory'>): TenantKind {
  if (tenant.tenantType === 'Clinic') {
    return 'Clinic'
  }

  return tenant.partnerCategory ?? 'Laboratory'
}

export function getTenantClassificationFromKind(kind: TenantKind): {
  tenantType: ITenant['tenantType']
  partnerCategory: TenantPartnerCategory | null
  isClinic: boolean
} {
  if (kind === 'Clinic') {
    return {
      tenantType: 'Clinic',
      partnerCategory: null,
      isClinic: true,
    }
  }

  return {
    tenantType: 'Partner',
    partnerCategory: kind,
    isClinic: false,
  }
}
