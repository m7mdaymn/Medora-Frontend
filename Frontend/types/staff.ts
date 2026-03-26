export interface IStaff {
  id: string
  userId: string // 👈 ناقصة عندك
  name: string
  username: string
  phone: string | null
  role: string
  salary: number | null
  hireDate: string | null
  notes: string | null // 👈 ناقصة عندك
  isEnabled: boolean
  createdAt: string
}
