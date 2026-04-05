export type DoctorCompensationMode = 'Salary' | 'Percentage' | 'FixedPerVisit' | string

export interface IDoctorCompensationRule {
  id: string
  doctorId: string
  mode: DoctorCompensationMode
  value: number
  effectiveFrom: string
  effectiveTo: string | null
  isActive: boolean
  createdAt: string
}

export interface IAttendanceRecord {
  id: string
  employeeId: string | null
  employeeName: string | null
  doctorId: string | null
  doctorName: string | null
  branchId: string | null
  enteredByUserId: string | null
  checkInAt: string
  checkOutAt: string | null
  lateMinutes: number | null
  overtimeMinutes: number | null
  isAbsent: boolean
  createdAt: string
}

export interface IAbsenceRecord {
  id: string
  employeeId: string | null
  employeeName: string | null
  doctorId: string | null
  doctorName: string | null
  fromDate: string
  toDate: string
  reason: string
  isPaid: boolean
  notes: string | null
  enteredByUserId: string
  branchId: string | null
  createdAt: string
}

export interface ISalaryPayoutExpense {
  expenseId: string
  amount: number
  expenseDate: string
  category: string
  notes: string | null
}

export interface IDailyClosingSnapshot {
  id: string
  snapshotDate: string
  generatedByUserId: string
  totalInvoiced: number
  totalCollected: number
  totalExpenses: number
  netCashFlow: number
  visitsCompleted: number
  paymentsCount: number
  expensesCount: number
  createdAt: string
}
