import { IInventoryItemImage, InventoryItemType } from '@/types/inventory'

export type MarketplaceOrderStatus =
  | 'Pending'
  | 'WhatsAppRedirected'
  | 'Confirmed'
  | 'Cancelled'
  | string

export interface IPublicMarketplaceItem {
  id: string
  branchId: string
  name: string
  description: string | null
  skuCode: string
  itemType: InventoryItemType
  unit: string
  salePrice: number
  quantityOnHand: number
  showInLanding: boolean
  images: IInventoryItemImage[]
}

export interface IMarketplaceOrderItem {
  id: string
  inventoryItemId: string
  itemName: string
  unitPrice: number
  quantity: number
  lineTotal: number
}

export interface ISalesInvoiceLineItem {
  id: string
  inventoryItemId: string
  itemName: string
  unitPrice: number
  quantity: number
  lineTotal: number
}

export interface ISalesInvoice {
  id: string
  invoiceNumber: string
  branchId: string
  marketplaceOrderId: string
  customerName: string
  phone: string
  subtotalAmount: number
  totalAmount: number
  status: string
  issuedAt: string
  cancelledAt: string | null
  lineItems: ISalesInvoiceLineItem[]
}

export interface IMarketplaceOrder {
  id: string
  branchId: string
  customerName: string
  phone: string
  notes: string | null
  status: MarketplaceOrderStatus
  whatsAppRedirectedAt: string | null
  salesInvoiceId: string | null
  subtotalAmount: number
  totalAmount: number
  confirmedAt: string | null
  cancelledAt: string | null
  items: IMarketplaceOrderItem[]
  salesInvoice: ISalesInvoice | null
  createdAt: string
}

export interface IMarketplaceOrdersQuery {
  branchId?: string
  status?: MarketplaceOrderStatus
  fromDate?: string
  toDate?: string
  search?: string
  pageNumber?: number
  pageSize?: number
}

export interface IUpdateMarketplaceOrderStatusPayload {
  status: MarketplaceOrderStatus
  notes?: string
}
