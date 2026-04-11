export type WorkerMode = 'LoginBased' | 'PayrollOnly'

export interface IStaff {
  id: string
  userId: string | null
  name: string
  username: string
  phone: string | null
  role: string
  salary: number | null
  workerMode: WorkerMode
  hireDate: string | null
  notes: string | null // 👈 ناقصة عندك
  isEnabled: boolean
  createdAt: string
}
