export type InventoryItemType = 'Medicine' | 'Tool' | 'Equipment' | 'Consumable' | string

export interface IInventoryItemImage {
  id: string
  imageUrl: string
  displayOrder: number
}

export interface IInventoryItem {
  id: string
  name: string
  description: string | null
  skuCode: string
  itemType: InventoryItemType
  unit: string
  salePrice: number
  costPrice: number
  quantityOnHand: number
  lowStockThreshold: number
  usableInVisit: boolean
  sellablePublicly: boolean
  internalOnly: boolean
  billableInVisit: boolean
  active: boolean
  branchId: string
  branchName: string
  showInLanding: boolean
  isLowStock: boolean
  images: IInventoryItemImage[]
  createdAt: string
  updatedAt: string
}

export interface IInventoryItemsQuery {
  branchId?: string
  activeOnly?: boolean
  usableInVisit?: boolean
  sellablePublicly?: boolean
  includeInternalOnly?: boolean
  lowStockOnly?: boolean
  search?: string
  pageNumber?: number
  pageSize?: number
}

export interface IInventoryItemPayload {
  name: string
  description?: string
  skuCode: string
  itemType: InventoryItemType
  unit: string
  salePrice: number
  costPrice: number
  quantityOnHand: number
  lowStockThreshold: number
  usableInVisit: boolean
  sellablePublicly: boolean
  internalOnly: boolean
  billableInVisit: boolean
  active: boolean
  branchId: string
  showInLanding: boolean
  images?: string[]
}
