export type TenantPartnerCategory = 'Laboratory' | 'Radiology' | 'Pharmacy'
export type TenantKind = 'Clinic' | TenantPartnerCategory

export interface ITenant {
  id: string
  name: string
  slug: string
  status: 'Active' | 'Suspended' | 'Blocked' | 'Inactive'
  tenantType: 'Clinic' | 'Partner'
  partnerCategory?: TenantPartnerCategory | null
  tenantKind?: TenantKind
  hasBranches: boolean
  contactPhone: string | null
  createdAt: string
}

export interface ITenantNetworkLink {
  id: string
  clinicTenantId: string
  clinicTenantName: string
  clinicTenantSlug: string
  partnerTenantId: string
  partnerTenantName: string
  partnerTenantSlug: string
  partnerType: TenantPartnerCategory
  isActive: boolean
  notes?: string | null
  createdAt: string
}

export interface ICreateTenantNetworkLinkRequest {
  linkedTenantId: string
  partnerType: TenantPartnerCategory
  notes?: string
}
