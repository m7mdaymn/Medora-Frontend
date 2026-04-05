export type PartnerType = 'Laboratory' | 'Radiology' | 'Pharmacy' | string
export type PartnerOrderStatus = 'Draft' | 'Sent' | 'Accepted' | 'InProgress' | 'Completed' | 'Cancelled' | string
export type PartnerSettlementTarget = 'Doctor' | 'Clinic' | string

export interface IPartnerOrderStatusHistory {
  id: string
  oldStatus: PartnerOrderStatus | null
  newStatus: PartnerOrderStatus
  changedByUserId: string
  changedAt: string
  notes: string | null
}

export interface IPartnerOrder {
  id: string
  partnerId: string
  partnerName: string
  partnerType: PartnerType
  partnerContractId: string | null
  branchId: string
  visitId: string
  patientId: string
  patientName: string
  doctorId: string
  doctorName: string
  labRequestId: string | null
  prescriptionId: string | null
  partnerServiceCatalogItemId: string | null
  status: PartnerOrderStatus
  orderedByUserId: string
  orderedAt: string
  sentAt: string | null
  acceptedAt: string | null
  scheduledAt: string | null
  patientArrivedAt: string | null
  resultUploadedAt: string | null
  completedAt: string | null
  cancelledAt: string | null
  completedByUserId: string | null
  serviceNameSnapshot: string | null
  servicePrice: number | null
  settlementTarget: PartnerSettlementTarget | null
  settlementPercentage: number | null
  clinicDoctorSharePercentage: number | null
  doctorPayoutAmount: number | null
  clinicRevenueAmount: number | null
  resultSummary: string | null
  estimatedCost: number | null
  finalCost: number | null
  externalReference: string | null
  notes: string | null
  statusHistory: IPartnerOrderStatusHistory[]
  createdAt: string
}

export interface IPartnerServiceCatalogItem {
  id: string
  partnerId: string
  partnerName: string
  branchId: string | null
  serviceName: string
  price: number
  settlementTarget: PartnerSettlementTarget
  settlementPercentage: number
  clinicDoctorSharePercentage: number | null
  isActive: boolean
  notes: string | null
  createdAt: string
}

export interface ICreatePartnerServicePayload {
  partnerId: string
  branchId?: string
  serviceName: string
  price: number
  settlementTarget: PartnerSettlementTarget
  settlementPercentage: number
  clinicDoctorSharePercentage?: number
  notes?: string
}

export interface IUpdatePartnerServicePayload {
  branchId?: string
  serviceName: string
  price: number
  settlementTarget: PartnerSettlementTarget
  settlementPercentage: number
  clinicDoctorSharePercentage?: number
  isActive: boolean
  notes?: string
}

export interface IPartnerUser {
  id: string
  partnerId: string
  partnerName: string
  userId: string
  username: string
  displayName: string
  phone: string | null
  isPrimary: boolean
  isActive: boolean
  createdAt: string
}

export interface IPartner {
  id: string
  name: string
  type: PartnerType
  contactName: string | null
  contactPhone: string | null
  contactEmail: string | null
  address: string | null
  notes: string | null
  isActive: boolean
  createdAt: string
}

export interface IPartnerContract {
  id: string
  partnerId: string
  partnerName: string
  partnerType: PartnerType
  branchId: string | null
  serviceScope: string | null
  commissionPercentage: number | null
  settlementTarget: PartnerSettlementTarget
  clinicDoctorSharePercentage: number | null
  flatFee: number | null
  effectiveFrom: string
  effectiveTo: string | null
  isActive: boolean
  notes: string | null
  createdAt: string
}

export interface ICreatePartnerPayload {
  name: string
  type: PartnerType
  contactName?: string
  contactPhone?: string
  contactEmail?: string
  address?: string
  notes?: string
}

export type IUpdatePartnerPayload = ICreatePartnerPayload

export interface ICreatePartnerContractPayload {
  partnerId: string
  branchId?: string
  serviceScope?: string
  commissionPercentage?: number
  settlementTarget?: PartnerSettlementTarget
  clinicDoctorSharePercentage?: number
  flatFee?: number
  effectiveFrom: string
  effectiveTo?: string
  notes?: string
}

export interface IUpdatePartnerContractPayload {
  branchId?: string
  serviceScope?: string
  commissionPercentage?: number
  settlementTarget?: PartnerSettlementTarget
  clinicDoctorSharePercentage?: number
  flatFee?: number
  effectiveFrom: string
  effectiveTo?: string
  isActive: boolean
  notes?: string
}

export interface IPartnerTimelineItem {
  id: string
  visitId: string
  partnerId: string
  partnerName: string
  partnerType: PartnerType
  serviceName: string | null
  status: PartnerOrderStatus
  orderedAt: string
  acceptedAt: string | null
  scheduledAt: string | null
  patientArrivedAt: string | null
  resultUploadedAt: string | null
  completedAt: string | null
  price: number | null
  finalCost: number | null
  doctorPayoutAmount: number | null
  clinicRevenueAmount: number | null
  resultSummary: string | null
  notes: string | null
}
