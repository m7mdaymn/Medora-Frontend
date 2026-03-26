export interface ITenant {
  id: string
  name: string
  slug: string
  status: 'Active' | 'Suspended' | 'Blocked' 
  contactPhone: string | null
  createdAt: string
}
