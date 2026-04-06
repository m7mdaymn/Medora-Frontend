export type WorkerMode = 'LoginBased' | 'PayrollOnly'

export interface IAssignedStaffBranch {
  id: string
  name: string
  isPrimary: boolean
}

export interface IStaff {
  id: string
  userId: string
  name: string
  username: string
  phone: string | null
  role: string
  salary: number | null
  workerMode: WorkerMode
  hireDate: string | null
  notes: string | null
  isEnabled: boolean
  assignedBranchIds: string[]
  assignedBranches: IAssignedStaffBranch[]
  createdAt: string
}
