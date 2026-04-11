export interface IBranch {
  id: string
  name: string
  code: string | null
  address: string | null
  phone: string | null
  isActive: boolean
  assignedStaffCount: number
}
