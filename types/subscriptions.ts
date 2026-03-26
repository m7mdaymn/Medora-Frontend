export interface ISubscription {
  id: string
  tenantId: string
  planName: string
  startDate: string
  endDate: string
  amount: number
  currency: string
  status: 'Active' | 'Expired' | 'Canceled' | 'Pending'
  isPaid: boolean
  notes: string | null
}
